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
