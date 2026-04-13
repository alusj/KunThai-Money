import supabase from "../lib/supabaseClient";
import { normalizeCurrencyRecord } from "../utils/currency";

export async function createPaymentRequest(payload) {
  const { data, error } = await supabase.rpc("create_payment_request", {
    p_requester_account_id: payload.requesterAccountId,
    p_recipient_account_number: payload.recipientAccountNumber,
    p_amount: payload.amount,
    p_reason: payload.reason || null,
  });

  if (error) {
    throw error;
  }

  return normalizeCurrencyRecord(data);
}

export async function getPaymentRequests({ userId, direction = "incoming", status = ["pending", "viewed"], limit = 10 } = {}) {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    resolvedUserId = user?.id;
  }

  if (!resolvedUserId) {
    return [];
  }

  let query = supabase
    .from("kuntai_payment_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  query = direction === "outgoing"
    ? query.eq("requester_user_id", resolvedUserId)
    : query.eq("recipient_user_id", resolvedUserId);

  if (status?.length) {
    query = query.in("status", status);
  }

  const { data, error } = await query;

  if (error) {
    if (
      error.message?.toLowerCase?.().includes("does not exist") ||
      error.message?.toLowerCase?.().includes("schema cache")
    ) {
      return [];
    }

    throw error;
  }

  return (data || []).map(normalizeCurrencyRecord);
}

export async function markPaymentRequestViewed(requestId) {
  const { data, error } = await supabase.rpc("mark_payment_request_viewed", {
    p_request_id: requestId,
  });

  if (error) {
    throw error;
  }

  return normalizeCurrencyRecord(data);
}

export async function cancelPaymentRequest(requestId) {
  const { data, error } = await supabase.rpc("cancel_payment_request", {
    p_request_id: requestId,
  });

  if (error) {
    throw error;
  }

  return normalizeCurrencyRecord(data);
}

export async function resolvePaymentRequest(requestId, status) {
  const { data, error } = await supabase.rpc("resolve_payment_request", {
    p_request_id: requestId,
    p_status: status,
  });

  if (error) {
    throw error;
  }

  return normalizeCurrencyRecord(data);
}
