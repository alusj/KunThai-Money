import supabase from "../lib/supabaseClient";

export async function convertOwnAccounts(payload) {
  const { data, error } = await supabase.rpc("convert_own_accounts", {
    p_source_account_id: payload.sourceAccountId,
    p_target_account_number: payload.targetAccountNumber,
    p_amount: payload.amount,
    p_converted_amount: payload.convertedAmount,
    p_exchange_rate: payload.exchangeRate,
    p_reason: payload.reason || null,
    p_pin: payload.pin,
    p_metadata: payload.metadata || {},
  });

  if (error) {
    throw error;
  }

  return data;
}
