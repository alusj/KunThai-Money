import supabase from "../lib/supabaseClient";

export async function verifyUserPin(pin) {
  const normalizedPin = String(pin || "").trim();

  if (!/^\d{6}$/.test(normalizedPin)) {
    throw new Error("Transaction PIN must be exactly 6 digits.");
  }

  const { data, error } = await supabase.rpc("verify_user_pin", {
    p_pin: normalizedPin,
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}
