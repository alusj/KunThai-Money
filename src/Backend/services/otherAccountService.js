import supabase from "../lib/supabaseClient";
import { isReviewManagedAccountType } from "../utils/accountReview";
import { normalizeCurrencyRecord } from "../utils/currency";
import {
  buildEventDateTime,
  EVENT_ACCOUNT_TYPE,
  getEventDisplayName,
  getEventLocation,
  getEventProfile,
  normalizeTicketCategories,
} from "../utils/eventAccounts";

function sanitizeFileName(name = "document") {
  return String(name || "document")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-");
}

async function uploadBusinessDocuments(userId, files = []) {
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

function buildReviewedAccountMetadata(payload, uploadedDocumentFiles = []) {
  if (payload.account_type !== "agent" && payload.account_type !== "insurance") {
    return null;
  }

  const profileKey = payload.account_type === "insurance" ? "insurance_profile" : "agent_profile";

  return {
    profileKey,
    requested_business_documents: payload.requested_business_documents || [],
    business_document_note: payload.business_document_note || "",
    business_document_files: uploadedDocumentFiles,
  };
}

function buildEventMetadata(payload) {
  if (payload.account_type !== EVENT_ACCOUNT_TYPE) {
    return null;
  }

  const ticketCategories = normalizeTicketCategories(payload.ticket_categories);
  const availableTickets = ticketCategories.length
    ? ticketCategories.reduce((total, item) => total + Number(item.available_tickets || 0), 0)
    : Number(payload.available_tickets || 0);
  const lowestPrice = ticketCategories.length
    ? Math.min(...ticketCategories.map((item) => Number(item.price || 0)))
    : Number(payload.ticket_price || 0);

  return {
    review_status: "pending",
    event_name: payload.event_name?.trim() || "",
    event_category: payload.event_category?.trim() || "",
    event_location: payload.event_location?.trim() || "",
    event_date: payload.event_date || "",
    event_time: payload.event_time || "",
    ticket_price: Number(lowestPrice || 0),
    available_tickets: Number(availableTickets || 0),
    ticket_categories: ticketCategories,
    description: payload.event_description?.trim() || "",
  };
}

function buildInsuranceMetadata(payload, uploadedDocumentFiles = []) {
  if (payload.account_type !== "insurance") {
    return null;
  }

  return {
    review_status: "pending",
    insurance_category: payload.insurance_category?.trim() || "",
    support_phone: payload.support_phone?.trim() || "",
    payment_reference_format: payload.payment_reference_format?.trim() || "",
    accepted_payment_types: payload.accepted_payment_types?.trim() || "",
    requested_business_documents: payload.requested_business_documents || [],
    business_document_note: payload.business_document_note || "",
    business_document_files: uploadedDocumentFiles,
  };
}

function buildDonationMetadata(payload, uploadedDocumentFiles = []) {
  if (payload.account_type !== "donation") {
    return null;
  }

  return {
    review_status: "pending",
    organization_name: payload.organization_name?.trim() || "",
    cause_category: payload.cause_category?.trim() || "",
    support_phone: payload.support_phone?.trim() || "",
    mission: payload.mission?.trim() || "",
    requested_business_documents: payload.requested_business_documents || [],
    business_document_note: payload.business_document_note || "",
    business_document_files: uploadedDocumentFiles,
  };
}

function buildAccountMetadata(payload, uploadedDocumentFiles = []) {
  const metadata = {};
  const reviewedAccountProfile = buildReviewedAccountMetadata(payload, uploadedDocumentFiles);
  const eventProfile = buildEventMetadata(payload);
  const insuranceProfile = buildInsuranceMetadata(payload, uploadedDocumentFiles);
  const donationProfile = buildDonationMetadata(payload, uploadedDocumentFiles);

  if (reviewedAccountProfile?.profileKey === "agent_profile") {
    metadata.agent_profile = {
      review_status: "pending",
      requested_business_documents: reviewedAccountProfile.requested_business_documents || [],
      business_document_note: reviewedAccountProfile.business_document_note || "",
      business_document_files: reviewedAccountProfile.business_document_files || [],
    };
  }

  if (insuranceProfile) {
    metadata.insurance_profile = insuranceProfile;
  }

  if (donationProfile) {
    metadata.donation_profile = donationProfile;
  }

  if (eventProfile) {
    metadata.event_profile = eventProfile;
  }

  return metadata;
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

function buildInsuranceResubmissionMetadata(existingMetadata = {}, payload, uploadedDocumentFiles = []) {
  const existingInsuranceProfile = existingMetadata?.insurance_profile || {};

  return {
    ...existingMetadata,
    insurance_profile: {
      ...existingInsuranceProfile,
      review_status: "pending",
      reviewed_at: null,
      rejected_at: null,
      rejection_reason: "",
      rejection_comment: "",
      resubmitted_at: new Date().toISOString(),
      insurance_category: payload.insurance_category?.trim() || "",
      support_phone: payload.support_phone?.trim() || "",
      payment_reference_format: payload.payment_reference_format?.trim() || "",
      accepted_payment_types: payload.accepted_payment_types?.trim() || "",
      requested_business_documents: payload.requested_business_documents || [],
      business_document_note: payload.business_document_note || "",
      business_document_files: uploadedDocumentFiles,
    },
  };
}

function buildDonationResubmissionMetadata(existingMetadata = {}, payload, uploadedDocumentFiles = []) {
  const existingDonationProfile = existingMetadata?.donation_profile || {};

  return {
    ...existingMetadata,
    donation_profile: {
      ...existingDonationProfile,
      review_status: "pending",
      reviewed_at: null,
      rejected_at: null,
      rejection_reason: "",
      rejection_comment: "",
      resubmitted_at: new Date().toISOString(),
      organization_name: payload.organization_name?.trim() || "",
      cause_category: payload.cause_category?.trim() || "",
      support_phone: payload.support_phone?.trim() || "",
      mission: payload.mission?.trim() || "",
      requested_business_documents: payload.requested_business_documents || [],
      business_document_note: payload.business_document_note || "",
      business_document_files: uploadedDocumentFiles,
    },
  };
}

function buildEventResubmissionMetadata(existingMetadata = {}, payload) {
  const existingEventProfile = existingMetadata?.event_profile || {};
  const nextEventProfile = buildEventMetadata(payload);

  return {
    ...existingMetadata,
    event_profile: {
      ...existingEventProfile,
      ...nextEventProfile,
      review_status: "pending",
      reviewed_at: null,
      rejected_at: null,
      rejection_reason: "",
      rejection_comment: "",
      resubmitted_at: new Date().toISOString(),
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

  const metadata = buildAccountMetadata(payload, uploadedDocumentFiles);

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
        status: isReviewManagedAccountType(payload.account_type) ? "pending" : "active",
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
    payload.account_type === "agent" ||
    payload.account_type === "insurance" ||
    payload.account_type === "donation"
      ? await uploadBusinessDocuments(user.id, payload.business_document_files || [])
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
    try {
      return await createOtherAccountFallback(payload, uploadedDocumentFiles);
    } catch (fallbackError) {
      if (
        payload.account_type === "agent" ||
        payload.account_type === "insurance" ||
        payload.account_type === "donation"
      ) {
        throw fallbackError;
      }
    }

    throw error;
  }

  const metadata = buildAccountMetadata(payload, uploadedDocumentFiles);

  if (!data?.id || !Object.keys(metadata).length) {
    return normalizeCurrencyRecord(data);
  }

  const { data: updatedAccount, error: updateError } = await supabase
    .from("kuntai_other_accounts")
    .update({
      metadata,
      status:
        isReviewManagedAccountType(payload.account_type)
          ? "pending"
          : data.status,
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

  const uploadedDocumentFiles = await uploadBusinessDocuments(
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

export async function resubmitInsuranceAccount(accountId, payload) {
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
    throw new Error("Insurance account could not be found.");
  }

  if (!payload.account_name?.trim()) {
    throw new Error("Enter an account name");
  }

  if (!payload.insurance_category?.trim()) {
    throw new Error("Enter the insurance category");
  }

  if (!payload.support_phone?.trim()) {
    throw new Error("Enter the support phone");
  }

  if (!payload.location_country?.trim() || !payload.location_city?.trim()) {
    throw new Error("Enter at least country and city for account location");
  }

  if (!payload.business_document_files?.length) {
    throw new Error("Upload at least one insurance document before resubmitting.");
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

  if (existingAccount.account_type !== "insurance") {
    throw new Error("Only insurance accounts can be resubmitted from this form.");
  }

  const uploadedDocumentFiles = await uploadBusinessDocuments(user.id, payload.business_document_files || []);
  const metadata = buildInsuranceResubmissionMetadata(
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

export async function resubmitDonationAccount(accountId, payload) {
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
    throw new Error("Donation account could not be found.");
  }

  if (!payload.account_name?.trim()) {
    throw new Error("Enter an account name");
  }

  if (!payload.organization_name?.trim()) {
    throw new Error("Enter the organization name");
  }

  if (!payload.cause_category?.trim()) {
    throw new Error("Enter the cause category");
  }

  if (!payload.support_phone?.trim()) {
    throw new Error("Enter the support phone");
  }

  if (!payload.location_country?.trim() || !payload.location_city?.trim()) {
    throw new Error("Enter at least country and city for account location");
  }

  if (!payload.business_document_files?.length) {
    throw new Error("Upload at least one donation document before resubmitting.");
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

  if (existingAccount.account_type !== "donation") {
    throw new Error("Only donation accounts can be resubmitted from this form.");
  }

  const uploadedDocumentFiles = await uploadBusinessDocuments(user.id, payload.business_document_files || []);
  const metadata = buildDonationResubmissionMetadata(
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

export async function resubmitEventAccount(accountId, payload) {
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
    throw new Error("Event account could not be found.");
  }

  if (!payload.account_name?.trim()) {
    throw new Error("Enter an account name");
  }

  if (!payload.event_name?.trim()) {
    throw new Error("Enter the event name");
  }

  if (!payload.event_location?.trim()) {
    throw new Error("Enter the event location");
  }

  if (!payload.event_date) {
    throw new Error("Select the event date");
  }

  if (!payload.event_time) {
    throw new Error("Select the event time");
  }

  if (!payload.ticket_categories?.length) {
    throw new Error("Add at least one ticket category before resubmitting.");
  }

  if (!payload.location_country?.trim() || !payload.location_city?.trim()) {
    throw new Error("Enter at least country and city for account location");
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

  if (existingAccount.account_type !== EVENT_ACCOUNT_TYPE) {
    throw new Error("Only event accounts can be resubmitted from this form.");
  }

  const metadata = buildEventResubmissionMetadata(existingAccount.metadata || {}, payload);

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

function calculateDistanceKm(firstLatitude, firstLongitude, secondLatitude, secondLongitude) {
  if (
    !Number.isFinite(firstLatitude) ||
    !Number.isFinite(firstLongitude) ||
    !Number.isFinite(secondLatitude) ||
    !Number.isFinite(secondLongitude)
  ) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(secondLatitude - firstLatitude);
  const deltaLongitude = toRadians(secondLongitude - firstLongitude);
  const latitudeOne = toRadians(firstLatitude);
  const latitudeTwo = toRadians(secondLatitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeOne) * Math.cos(latitudeTwo) * Math.sin(deltaLongitude / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function normalizeEventAccount(account, viewerContext = {}) {
  const profile = getEventProfile(account);
  const eventDate = buildEventDateTime(profile);
  const distanceKm = calculateDistanceKm(
    Number(viewerContext.latitude),
    Number(viewerContext.longitude),
    Number(account.latitude),
    Number(account.longitude)
  );
  const sameCity =
    viewerContext.city &&
    account.location_city &&
    String(viewerContext.city).trim().toLowerCase() === String(account.location_city).trim().toLowerCase();
  const sameCountry =
    viewerContext.country &&
    account.location_country &&
    String(viewerContext.country).trim().toLowerCase() ===
      String(account.location_country).trim().toLowerCase();

  return {
    ...account,
    event_profile: profile,
    event_name: getEventDisplayName(account),
    event_location: getEventLocation(account),
    event_date_time: eventDate ? eventDate.toISOString() : null,
    distance_km: distanceKm,
    same_city: Boolean(sameCity),
    same_country: Boolean(sameCountry),
  };
}

function normalizeNearbyFlags(account, viewerContext = {}) {
  const distanceKm = calculateDistanceKm(
    Number(viewerContext.latitude),
    Number(viewerContext.longitude),
    Number(account.latitude),
    Number(account.longitude)
  );
  const sameCity =
    viewerContext.city &&
    account.location_city &&
    String(viewerContext.city).trim().toLowerCase() === String(account.location_city).trim().toLowerCase();
  const sameCountry =
    viewerContext.country &&
    account.location_country &&
    String(viewerContext.country).trim().toLowerCase() ===
      String(account.location_country).trim().toLowerCase();

  return {
    distance_km: distanceKm,
    same_city: Boolean(sameCity),
    same_country: Boolean(sameCountry),
  };
}

function sortNearbyAccounts(first, second) {
  const firstDistance = Number.isFinite(first.distance_km) ? first.distance_km : Number.POSITIVE_INFINITY;
  const secondDistance = Number.isFinite(second.distance_km) ? second.distance_km : Number.POSITIVE_INFINITY;

  if (firstDistance !== secondDistance) {
    return firstDistance - secondDistance;
  }

  if (first.same_city !== second.same_city) {
    return first.same_city ? -1 : 1;
  }

  if (first.same_country !== second.same_country) {
    return first.same_country ? -1 : 1;
  }

  return new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime();
}

export async function getDiscoverableEventAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", EVENT_ACCOUNT_TYPE)
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const normalized = (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => normalizeEventAccount(account, viewerContext))
    .filter((account) => account.event_profile?.event_name && account.event_profile?.event_date);

  return normalized.sort((first, second) => {
    const nearbySort = sortNearbyAccounts(first, second);

    if (nearbySort !== 0) {
      return nearbySort;
    }

    const firstDate = first.event_date_time ? new Date(first.event_date_time).getTime() : Number.POSITIVE_INFINITY;
    const secondDate = second.event_date_time ? new Date(second.event_date_time).getTime() : Number.POSITIVE_INFINITY;

    return firstDate - secondDate;
  });
}

export async function getDiscoverableMerchantAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", "merchant")
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => ({
      ...account,
      merchant_name: account.account_name || "Merchant",
      merchant_location:
        account.location_address ||
        [account.location_city, account.location_country].filter(Boolean).join(", ") ||
        "Location not available",
      ...normalizeNearbyFlags(account, viewerContext),
    }))
    .sort(sortNearbyAccounts);
}

export async function getDiscoverableAgentAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", "agent")
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => ({
      ...account,
      agent_name: account.account_name || "Agent",
      agent_location:
        account.location_address ||
        [account.location_city, account.location_country].filter(Boolean).join(", ") ||
        "Location not available",
      ...normalizeNearbyFlags(account, viewerContext),
    }))
    .sort(sortNearbyAccounts);
}

export async function getDiscoverableHotelAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", "hotel")
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => ({
      ...account,
      hotel_name: account.account_name || "Hotel",
      hotel_location:
        account.location_address ||
        [account.location_city, account.location_country].filter(Boolean).join(", ") ||
        "Location not available",
      ...normalizeNearbyFlags(account, viewerContext),
    }))
    .sort(sortNearbyAccounts);
}

export async function getDiscoverableSchoolAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", "school_fees")
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => ({
      ...account,
      school_name: account.account_name || "School",
      school_location:
        account.location_address ||
        [account.location_city, account.location_country].filter(Boolean).join(", ") ||
        "Location not available",
      ...normalizeNearbyFlags(account, viewerContext),
    }))
    .sort(sortNearbyAccounts);
}

export async function getDiscoverableRestaurantAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", "restaurant")
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => ({
      ...account,
      restaurant_name: account.account_name || "Restaurant",
      restaurant_location:
        account.location_address ||
        [account.location_city, account.location_country].filter(Boolean).join(", ") ||
        "Location not available",
      ...normalizeNearbyFlags(account, viewerContext),
    }))
    .sort(sortNearbyAccounts);
}

export async function getDiscoverableSupermarketAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", "supermarket")
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => ({
      ...account,
      supermarket_name: account.account_name || "Supermarket",
      supermarket_location:
        account.location_address ||
        [account.location_city, account.location_country].filter(Boolean).join(", ") ||
        "Location not available",
      ...normalizeNearbyFlags(account, viewerContext),
    }))
    .sort(sortNearbyAccounts);
}

export async function getDiscoverablePharmacyAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", "pharmacy")
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => ({
      ...account,
      pharmacy_name: account.account_name || "Pharmacy",
      pharmacy_location:
        account.location_address ||
        [account.location_city, account.location_country].filter(Boolean).join(", ") ||
        "Location not available",
      ...normalizeNearbyFlags(account, viewerContext),
    }))
    .sort(sortNearbyAccounts);
}

export async function getDiscoverableInsuranceAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", "insurance")
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => ({
      ...account,
      insurance_name: account.account_name || "Insurance",
      insurance_location:
        account.location_address ||
        [account.location_city, account.location_country].filter(Boolean).join(", ") ||
        "Location not available",
      insurance_profile: account.metadata?.insurance_profile || {},
      ...normalizeNearbyFlags(account, viewerContext),
    }))
    .sort(sortNearbyAccounts);
}

export async function getDiscoverableDonationAccounts(viewerContext = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select(
      "id,user_id,account_type,account_name,account_number,currency,status,location_country,location_city,location_address,latitude,longitude,nearby_discovery_enabled,metadata,created_at"
    )
    .eq("account_type", "donation")
    .eq("nearby_discovery_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((account) => account.user_id !== user?.id)
    .map(normalizeCurrencyRecord)
    .map((account) => ({
      ...account,
      donation_name: account.account_name || "Donation",
      donation_location:
        account.location_address ||
        [account.location_city, account.location_country].filter(Boolean).join(", ") ||
        "Location not available",
      donation_profile: account.metadata?.donation_profile || {},
      ...normalizeNearbyFlags(account, viewerContext),
    }))
    .sort(sortNearbyAccounts);
}
