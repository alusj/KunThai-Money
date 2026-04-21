import supabase from "../lib/supabaseClient";
import {
  getNormalizedAccountReviewStatus,
  getReviewAccountConfig,
} from "../utils/accountReview";
import { EVENT_ACCOUNT_TYPE } from "../utils/accountTypes";
import { formatEventDateTime } from "../utils/eventAccounts";
import { resolveRegisteredName } from "../utils/profileName";

async function getProfileMap(userIds = []) {
  if (!userIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("kuntai_profiles")
    .select("user_id,first_name,middle_name,last_name,phone,profile_image")
    .in("user_id", userIds);

  if (error) {
    throw error;
  }

  return new Map((data || []).map((profile) => [profile.user_id, profile]));
}

export async function getAdminKycReviews() {
  const { data, error } = await supabase
    .from("kuntai_kyc")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const items = data || [];
  const profiles = await getProfileMap(items.map((item) => item.user_id));

  return items.map((item) => {
    const profile = profiles.get(item.user_id);

    return {
      ...item,
      profile,
      displayName: resolveRegisteredName(profile, null),
    };
  });
}

export async function updateKycStatus({ kycId, status }) {
  const { data, error } = await supabase
    .from("kuntai_kyc")
    .update({
      kyc_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", kycId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getSignedKycDocument(path) {
  if (!path) {
    return null;
  }

  const { data, error } = await supabase.storage.from("kyc").createSignedUrl(path, 3600);

  if (error) {
    throw error;
  }

  return data?.signedUrl || null;
}

export async function getSignedStoredDocument({ bucket = "kyc", path } = {}) {
  if (!path) {
    return null;
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

  if (error) {
    throw error;
  }

  return data?.signedUrl || null;
}

export async function getAdminAgentReviews() {
  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select("*")
    .eq("account_type", "agent")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const items = data || [];
  const profiles = await getProfileMap(items.map((item) => item.user_id));

  return items.map((item) => {
    const profile = profiles.get(item.user_id);
    const agentProfile = item.metadata?.agent_profile || {};

    return {
      ...item,
      profile,
      displayName: resolveRegisteredName(profile, null),
      agentReviewStatus: agentProfile.review_status || item.status || "pending",
      rejectionReason: agentProfile.rejection_reason || agentProfile.rejection_comment || "",
      requestedBusinessDocuments: agentProfile.requested_business_documents || [],
      businessDocumentNote: agentProfile.business_document_note || "",
      businessDocumentFiles: (agentProfile.business_document_files || []).map((file, index) => ({
        id: file.path || file.name || `agent-document-${index}`,
        name: file.name || `Document ${index + 1}`,
        size: file.size || 0,
        type: file.type || "",
        bucket: file.bucket || "kyc",
        path: file.path || "",
      })),
    };
  });
}

export async function getAdminInsuranceReviews() {
  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select("*")
    .eq("account_type", "insurance")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const items = data || [];
  const profiles = await getProfileMap(items.map((item) => item.user_id));

  return items.map((item) => {
    const profile = profiles.get(item.user_id);
    const insuranceProfile = item.metadata?.insurance_profile || {};

    return {
      ...item,
      profile,
      displayName: resolveRegisteredName(profile, null),
      insuranceReviewStatus: insuranceProfile.review_status || item.status || "pending",
      rejectionReason: insuranceProfile.rejection_reason || insuranceProfile.rejection_comment || "",
      insuranceCategory: insuranceProfile.insurance_category || "",
      supportPhone: insuranceProfile.support_phone || "",
      paymentReferenceFormat: insuranceProfile.payment_reference_format || "",
      acceptedPaymentTypes: insuranceProfile.accepted_payment_types || "",
      requestedBusinessDocuments: insuranceProfile.requested_business_documents || [],
      businessDocumentNote: insuranceProfile.business_document_note || "",
      businessDocumentFiles: (insuranceProfile.business_document_files || []).map((file, index) => ({
        id: file.path || file.name || `insurance-document-${index}`,
        name: file.name || `Document ${index + 1}`,
        size: file.size || 0,
        type: file.type || "",
        bucket: file.bucket || "kyc",
        path: file.path || "",
      })),
    };
  });
}

export async function getAdminDonationReviews() {
  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select("*")
    .eq("account_type", "donation")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const items = data || [];
  const profiles = await getProfileMap(items.map((item) => item.user_id));

  return items.map((item) => {
    const profile = profiles.get(item.user_id);
    const donationProfile = item.metadata?.donation_profile || {};

    return {
      ...item,
      profile,
      displayName: resolveRegisteredName(profile, null),
      donationReviewStatus: donationProfile.review_status || item.status || "pending",
      rejectionReason: donationProfile.rejection_reason || donationProfile.rejection_comment || "",
      organizationName: donationProfile.organization_name || "",
      causeCategory: donationProfile.cause_category || "",
      supportPhone: donationProfile.support_phone || "",
      mission: donationProfile.mission || "",
      requestedBusinessDocuments: donationProfile.requested_business_documents || [],
      businessDocumentNote: donationProfile.business_document_note || "",
      businessDocumentFiles: (donationProfile.business_document_files || []).map((file, index) => ({
        id: file.path || file.name || `donation-document-${index}`,
        name: file.name || `Document ${index + 1}`,
        size: file.size || 0,
        type: file.type || "",
        bucket: file.bucket || "kyc",
        path: file.path || "",
      })),
    };
  });
}

export async function getAdminEventReviews() {
  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .select("*")
    .eq("account_type", EVENT_ACCOUNT_TYPE)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const items = data || [];
  const profiles = await getProfileMap(items.map((item) => item.user_id));

  return items.map((item) => {
    const profile = profiles.get(item.user_id);
    const eventProfile = item.metadata?.event_profile || {};

    return {
      ...item,
      profile,
      displayName: resolveRegisteredName(profile, null),
      eventReviewStatus: getNormalizedAccountReviewStatus(item),
      rejectionReason: eventProfile.rejection_reason || eventProfile.rejection_comment || "",
      eventName: eventProfile.event_name || item.account_name || "",
      eventCategory: eventProfile.event_category || "",
      eventLocation: eventProfile.event_location || "",
      eventDateLabel: formatEventDateTime(eventProfile),
      eventDescription: eventProfile.description || "",
      ticketCategories: eventProfile.ticket_categories || [],
      availableTickets: Number(eventProfile.available_tickets || 0),
      lowestTicketPrice: Number(eventProfile.ticket_price || 0),
    };
  });
}

async function updateReviewedOtherAccountStatus({ accountId, accountType, status, comment = "" }) {
  const reviewConfig = getReviewAccountConfig(accountType);

  if (!reviewConfig) {
    throw new Error("This account type does not support admin review.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("kuntai_other_accounts")
    .select("id,metadata")
    .eq("id", accountId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const metadata = {
    ...(existing.metadata || {}),
    [reviewConfig.profileKey]: {
      ...(existing.metadata?.[reviewConfig.profileKey] || {}),
      review_status: status,
      reviewed_at: new Date().toISOString(),
      rejected_at: status === "rejected" ? new Date().toISOString() : null,
      rejection_reason: status === "rejected" ? comment.trim() : "",
      rejection_comment: status === "rejected" ? comment.trim() : "",
    },
  };

  const normalizedStatus = status === "approved" ? "active" : status;

  const { data, error } = await supabase
    .from("kuntai_other_accounts")
    .update({
      status: normalizedStatus,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAgentAccountStatus({ accountId, status, comment = "" }) {
  return updateReviewedOtherAccountStatus({
    accountId,
    accountType: "agent",
    status,
    comment,
  });
}

export async function updateInsuranceAccountStatus({ accountId, status, comment = "" }) {
  return updateReviewedOtherAccountStatus({
    accountId,
    accountType: "insurance",
    status,
    comment,
  });
}

export async function updateDonationAccountStatus({ accountId, status, comment = "" }) {
  return updateReviewedOtherAccountStatus({
    accountId,
    accountType: "donation",
    status,
    comment,
  });
}

export async function updateEventAccountStatus({ accountId, status, comment = "" }) {
  return updateReviewedOtherAccountStatus({
    accountId,
    accountType: EVENT_ACCOUNT_TYPE,
    status,
    comment,
  });
}
