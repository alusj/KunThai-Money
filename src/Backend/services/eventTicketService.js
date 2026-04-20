import supabase from "../lib/supabaseClient";

const BUYER_IMAGE_BUCKET = "kyc";
const QR_API_BASE_URL = "https://api.qrserver.com/v1/create-qr-code/";

function sanitizeFileName(name = "image") {
  return String(name || "image")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-");
}

function generateTicketCode() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EVT-${Date.now().toString().slice(-6)}-${randomPart}`;
}

export function buildTicketQrPayload(ticket) {
  return JSON.stringify({
    type: "kuntai-event-ticket",
    ticket_code: ticket.ticket_code,
    ticket_category_id: ticket.ticket_category_id || null,
  });
}

export function buildTicketQrImageUrl(ticket) {
  const payload = typeof ticket === "string" ? ticket : buildTicketQrPayload(ticket);
  return `${QR_API_BASE_URL}?size=240x240&data=${encodeURIComponent(payload)}`;
}

async function uploadBuyerImage(userId, file) {
  if (!(file instanceof File)) {
    return null;
  }

  const filePath = `event-ticket-buyers/${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from(BUYER_IMAGE_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(BUYER_IMAGE_BUCKET).getPublicUrl(filePath);
  return {
    bucket: BUYER_IMAGE_BUCKET,
    path: filePath,
    public_url: data?.publicUrl || "",
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

function isMissingCategoryColumns(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("ticket_category_id") ||
    message.includes("ticket_category_name") ||
    message.includes("ticket_category_price")
  );
}

function normalizeTicketRow(row) {
  return {
    ...row,
    buyer_name: row.buyer_name || "Buyer",
    buyer_image_url: row.buyer_image_url || row.buyer_image?.public_url || "",
    ticket_category_id: row.ticket_category_id || row.order?.ticket_category_id || "",
    ticket_category_name: row.ticket_category_name || row.order?.ticket_category_name || "",
    ticket_category_price:
      Number(row.ticket_category_price || row.order?.ticket_category_price || 0) || 0,
  };
}

export async function createEventTicketPurchase({
  buyerUserId,
  buyerProfile,
  buyerImageFile,
  eventAccount,
  quantity,
  ticketCategory,
  transfer,
}) {
  if (!buyerUserId) {
    throw new Error("Authentication required");
  }

  if (!eventAccount?.id) {
    throw new Error("Event account could not be found.");
  }

  if (!ticketCategory?.name || !(Number(ticketCategory?.price) > 0)) {
    throw new Error("Select a valid ticket category before paying.");
  }

  const safeQuantity = Number(quantity || 0);
  if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) {
    throw new Error("Enter a valid ticket quantity.");
  }

  const buyerImage = buyerImageFile
    ? await uploadBuyerImage(buyerUserId, buyerImageFile)
    : buyerProfile?.profile_image
      ? { public_url: buyerProfile.profile_image }
      : null;

  const orderPayload = {
    buyer_user_id: buyerUserId,
    seller_user_id: eventAccount.user_id,
    event_account_id: eventAccount.id,
    event_account_number: eventAccount.account_number,
    event_name: eventAccount.event_name || eventAccount.account_name || "Event",
    event_location: eventAccount.event_location || eventAccount.location_address || "",
    event_date_time: eventAccount.event_date_time,
    ticket_category_id: String(ticketCategory.id || "").trim(),
    ticket_category_name: String(ticketCategory.name || "").trim(),
    ticket_category_price: Number(ticketCategory.price || 0),
    quantity: safeQuantity,
    unit_price: Number(ticketCategory.price || 0),
    total_amount: Number(transfer?.amount || 0),
    transfer_id: transfer?.id || transfer?.sender_transaction_id || null,
    reference_number: transfer?.reference_number || null,
    buyer_name:
      [buyerProfile?.first_name, buyerProfile?.middle_name, buyerProfile?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || "Buyer",
    buyer_image: buyerImage,
    buyer_image_url: buyerImage?.public_url || "",
    status: "completed",
  };

  const { data: createdOrder, error: orderError } = await supabase
    .from("kuntai_event_orders")
    .insert(orderPayload)
    .select("*")
    .single();

  if (orderError) {
    if (isMissingCategoryColumns(orderError)) {
      throw new Error(
        "The event category SQL upgrade is not installed yet. Run `event_ticket_categories_upgrade.sql` in Supabase, then try again."
      );
    }
    throw orderError;
  }

  const ticketRows = Array.from({ length: safeQuantity }, (_, index) => {
    const ticketCode = generateTicketCode();

    return {
      order_id: createdOrder.id,
      buyer_user_id: buyerUserId,
      seller_user_id: eventAccount.user_id,
      event_account_id: eventAccount.id,
      ticket_code: ticketCode,
      qr_payload: buildTicketQrPayload({ ticket_code: ticketCode }),
      ticket_index: index + 1,
      buyer_name: orderPayload.buyer_name,
      buyer_image: buyerImage,
      buyer_image_url: buyerImage?.public_url || "",
      ticket_category_id: orderPayload.ticket_category_id,
      ticket_category_name: orderPayload.ticket_category_name,
      ticket_category_price: orderPayload.ticket_category_price,
      status: "unused",
    };
  });

  const { data: createdTickets, error: ticketError } = await supabase
    .from("kuntai_event_tickets")
    .insert(ticketRows)
    .select("*");

  if (ticketError) {
    if (isMissingCategoryColumns(ticketError)) {
      throw new Error(
        "The event category SQL upgrade is not installed yet. Run `event_ticket_categories_upgrade.sql` in Supabase, then try again."
      );
    }
    throw ticketError;
  }

  const ticketCategories = Array.isArray(eventAccount.event_profile?.ticket_categories)
    ? eventAccount.event_profile.ticket_categories
    : [];
  const updatedCategories = ticketCategories.map((item) =>
    String(item.id || "") === String(ticketCategory.id || "")
      ? {
          ...item,
          available_tickets: Math.max(
            0,
            Number(item.available_tickets || 0) - safeQuantity
          ),
        }
      : item
  );
  const nextAvailableTotal = updatedCategories.reduce(
    (total, item) => total + Number(item.available_tickets || 0),
    0
  );

  try {
    await supabase
      .from("kuntai_other_accounts")
      .update({
        metadata: {
          ...(eventAccount.metadata || {}),
          event_profile: {
            ...(eventAccount.event_profile || {}),
            ticket_categories: updatedCategories,
            available_tickets: nextAvailableTotal,
            ticket_price: updatedCategories.length
              ? Math.min(...updatedCategories.map((item) => Number(item.price || 0)))
              : Number(ticketCategory.price || 0),
          },
        },
      })
      .eq("id", eventAccount.id)
      .eq("user_id", eventAccount.user_id);
  } catch {
    // Keep purchase successful even if category inventory sync cannot be updated immediately.
  }

  return {
    order: createdOrder,
    tickets: (createdTickets || []).map(normalizeTicketRow),
  };
}

export async function getBuyerEventTickets(userId) {
  let buyerId = userId;

  if (!buyerId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    buyerId = user?.id;
  }

  if (!buyerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("kuntai_event_tickets")
    .select("*,kuntai_event_orders(*)")
    .eq("buyer_user_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.toLowerCase?.().includes("does not exist")) {
      return [];
    }
    throw error;
  }

  return (data || []).map((item) => ({
    ...normalizeTicketRow(item),
    order: item.kuntai_event_orders || null,
  }));
}

export async function getSellerEventTickets(sellerUserId) {
  let sellerId = sellerUserId;

  if (!sellerId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    sellerId = user?.id;
  }

  if (!sellerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("kuntai_event_tickets")
    .select("*,kuntai_event_orders(*)")
    .eq("seller_user_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.toLowerCase?.().includes("does not exist")) {
      return [];
    }
    throw error;
  }

  return (data || []).map((item) => ({
    ...normalizeTicketRow(item),
    order: item.kuntai_event_orders || null,
  }));
}

export async function findSellerTicketByCode(code, sellerUserId) {
  const trimmedCode = String(code || "").trim();
  if (!trimmedCode) {
    throw new Error("Enter a valid ticket code.");
  }

  let sellerId = sellerUserId;
  if (!sellerId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    sellerId = user?.id;
  }

  const { data, error } = await supabase
    .from("kuntai_event_tickets")
    .select("*,kuntai_event_orders(*)")
    .eq("seller_user_id", sellerId)
    .eq("ticket_code", trimmedCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Ticket code was not found for this event seller.");
  }

  return {
    ...normalizeTicketRow(data),
    order: data.kuntai_event_orders || null,
  };
}

export async function markEventTicketUsed(ticketId) {
  if (!ticketId) {
    throw new Error("Ticket could not be identified.");
  }

  const { data, error } = await supabase
    .from("kuntai_event_tickets")
    .update({
      status: "used",
      used_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .select("*,kuntai_event_orders(*)")
    .single();

  if (error) {
    throw error;
  }

  return {
    ...normalizeTicketRow(data),
    order: data.kuntai_event_orders || null,
  };
}
