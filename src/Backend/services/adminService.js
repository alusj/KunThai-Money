import supabase from "../lib/supabaseClient";
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

export async function updateAgentAccountStatus({ accountId, status, comment = "" }) {
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
    agent_profile: {
      ...(existing.metadata?.agent_profile || {}),
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
