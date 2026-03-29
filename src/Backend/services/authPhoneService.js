import supabase from "../lib/supabaseClient";

export async function getPhoneAuthStatus(phone) {
  const normalizedPhone = phone?.trim();

  if (!normalizedPhone) {
    return {
      phone: phone || "",
      is_registered: false,
      exists_in_auth: false,
      exists_in_accounts: false,
      exists_in_profiles: false,
    };
  }

  const { data, error } = await supabase.rpc("get_phone_auth_status", {
    p_phone: normalizedPhone,
  });

  if (error) {
    throw error;
  }

  return data || {
    phone: normalizedPhone,
    is_registered: false,
    exists_in_auth: false,
    exists_in_accounts: false,
    exists_in_profiles: false,
  };
}
