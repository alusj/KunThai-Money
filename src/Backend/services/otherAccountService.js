import supabase from "../lib/supabaseClient";
import { normalizeCurrencyRecord } from "../utils/currency";

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
    throw error;
  }

  return data;
}
