import supabase from "../lib/supabaseClient";
import { normalizeCurrencyRecord } from "../utils/currency";

function sanitizeFileName(name = "document") {
  return String(name || "document")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-");
}

async function uploadAgentBusinessDocuments(userId, files = []) {
  if (!files.length) {
    return [];
  }

  const uploadedFiles = [];

  for (const file of files) {
    if (!(file instanceof File)) {
      uploadedFiles.push(file);
      continue;
    }

    const filePath = `agent-documents/${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}-${sanitizeFileName(file.name)}`;

    const { error } = await supabase.storage.from("kyc").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

    if (error) {
      throw error;
    }

    uploadedFiles.push({
      name: file.name,
      size: file.size,
      type: file.type,
      bucket: "kyc",
      path: filePath,
    });
  }

  return uploadedFiles;
}

function buildAgentMetadata(payload, uploadedDocumentFiles = []) {
  if (payload.account_type !== "agent") {
    return {};
  }

  return {
    agent_profile: {
      review_status: "pending",
      requested_business_documents: payload.requested_business_documents || [],
      business_document_note: payload.business_document_note || "",
      business_document_files: uploadedDocumentFiles,
    },
  };
}

function buildAgentResubmissionMetadata(existingMetadata = {}, payload, uploadedDocumentFiles = []) {
  const existingAgentProfile = existingMetadata?.agent_profile || {};

  return {
    ...existingMetadata,
    agent_profile: {
      ...existingAgentProfile,
      review_status: "pending",
      reviewed_at: null,
      rejected_at: null,
      rejection_reason: "",
      rejection_comment: "",
      resubmitted_at: new Date().toISOString(),
      requested_business_documents: payload.requested_business_documents || [],
      business_document_note: payload.business_document_note || "",
      business_document_files: uploadedDocumentFiles,
    },
  };
}

function normalizeCountryCode(countryCode = "") {
  return String(countryCode || "").replace(/\+/g, "").trim();
}

function buildFallbackAccountNumber(countryCode, accountType) {
  const cleanCountryCode = normalizeCountryCode(countryCode);
  const sequenceLength = accountType === "foreign" ? 9 : 8;
  const randomDigits = Array.from({ length: sequenceLength }, () =>
    Math.floor(Math.random() * 10)
  ).join("");

  return `${cleanCountryCode}${randomDigits}`;
}

async function createOtherAccountFallback(payload, uploadedDocumentFiles = []) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user?.id) {
    throw new Error("Authentication required");
  }

  const { data: mainAccount, error: mainAccountError } = await supabase
    .from("kuntai_accounts")
    .select("id,country_code,country,currency")
    .eq("user_id", user.id)
    .eq("account_type", "main")
    .single();

  if (mainAccountError) {
    throw mainAccountError;
  }

  const metadata = buildAgentMetadata(payload, uploadedDocumentFiles);

  let lastInsertError = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const fallbackAccountNumber = buildFallbackAccountNumber(
      mainAccount.country_code,
      payload.account_type
    );

    const { data: insertedAccount, error: insertError } = await supabase
      .from("kuntai_other_accounts")
      .insert({
        user_id: user.id,
        linked_main_account_id: mainAccount.id,
        account_type: payload.account_type,
        account_name: payload.account_name,
        account_number: fallbackAccountNumber,
        country_code: mainAccount.country_code,
        country: mainAccount.country,
        currency: payload.account_type === "foreign" ? "USD" : mainAccount.currency,
        status: payload.account_type === "agent" ? "pending" : "active",
        location_mode: payload.location_mode || "manual",
        use_current_location: Boolean(payload.use_current_location),
        location_country: payload.location_country,
        location_city: payload.location_city,
        location_address: payload.location_address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        nearby_discovery_enabled: Boolean(payload.nearby_discovery_enabled),
        is_system_created: false,
        created_from: "wallet_app",
        metadata,
      })
      .select("*")
      .single();

    if (!insertError) {
      return normalizeCurrencyRecord(insertedAccount);
    }

    lastInsertError = insertError;

    if (!String(insertError.message || "").toLowerCase().includes("duplicate")) {
      throw insertError;
    }
  }

  throw lastInsertError || new Error("Failed to create account");
}

export async function getOtherAccounts(userId) {
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

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select("*")
    .eq("user_id", resolvedUserId)
    .order("created_at", { ascending: false });

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

export async function createOtherAccount(payload) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user?.id) {
    throw new Error("Authentication required");
  }

  const uploadedDocumentFiles =
    payload.account_type === "agent"
      ? await uploadAgentBusinessDocuments(user.id, payload.business_document_files || [])
      : [];

  const { data, error } = await supabase.rpc("create_other_account", {
    p_account_type: payload.account_type,
    p_account_name: payload.account_name,
    p_location_mode: payload.location_mode,
    p_use_current_location: payload.use_current_location,
    p_location_country: payload.location_country,
    p_location_city: payload.location_city,
    p_location_address: payload.location_address,
    p_latitude: payload.latitude,
    p_longitude: payload.longitude,
    p_nearby_discovery_enabled: payload.nearby_discovery_enabled,
  });

  if (error) {
    if (payload.account_type === "agent") {
      try {
        return await createOtherAccountFallback(payload, uploadedDocumentFiles);
      } catch (fallbackError) {
        throw fallbackError;
      }
    }

    throw error;
  }

  const metadata = buildAgentMetadata(payload, uploadedDocumentFiles);

  if (!data?.id || !Object.keys(metadata).length) {
    return normalizeCurrencyRecord(data);
  }

  const { data: updatedAccount, error: updateError } = await supabase
    .from("kuntai_other_accounts")
    .update({
      metadata,
      status: payload.account_type === "agent" ? "pending" : data.status,
    })
    .eq("id", data.id)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  return normalizeCurrencyRecord(updatedAccount);
}

export async function resubmitAgentAccount(accountId, payload) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user?.id) {
    throw new Error("Authentication required");
  }

  if (!accountId) {
    throw new Error("Agent account could not be found.");
  }

  if (!payload.account_name?.trim()) {
    throw new Error("Enter an account name");
  }

  if (!payload.location_country?.trim() || !payload.location_city?.trim()) {
    throw new Error("Enter at least country and city for account location");
  }

  if (!payload.business_document_files?.length) {
    throw new Error("Upload at least one business document before resubmitting.");
  }

  const { data: existingAccount, error: fetchError } = await supabase
    .from("kuntai_other_accounts")
    .select("id,user_id,account_type,metadata")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (existingAccount.account_type !== "agent") {
    throw new Error("Only agent accounts can be resubmitted from this form.");
  }

  const uploadedDocumentFiles = await uploadAgentBusinessDocuments(
    user.id,
    payload.business_document_files || []
  );

  const metadata = buildAgentResubmissionMetadata(
    existingAccount.metadata || {},
    payload,
    uploadedDocumentFiles
  );

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .update({
      account_name: payload.account_name.trim(),
      status: "pending",
      location_mode: payload.location_mode || "manual",
      use_current_location: Boolean(payload.use_current_location),
      location_country: payload.location_country.trim(),
      location_city: payload.location_city.trim(),
      location_address: payload.location_address?.trim() || null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      nearby_discovery_enabled: Boolean(payload.nearby_discovery_enabled),
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeCurrencyRecord(data);
}
