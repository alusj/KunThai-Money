import supabase from "../lib/supabaseClient";

export async function getAccountTransferRecipient(payload) {
  const { data, error } = await supabase.rpc("get_account_transfer_recipient", {
    p_source_account_id: payload.sourceAccountId,
    p_recipient_account_number: payload.recipientAccountNumber,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : data;
}

export async function createAccountTransfer(payload) {
  const { data, error } = await supabase.rpc("create_account_transfer", {
    p_source_account_id: payload.sourceAccountId,
    p_recipient_account_number: payload.recipientAccountNumber,
    p_amount: payload.amount,
    p_reason: payload.reason || null,
    p_pin: payload.pin,
    p_metadata: payload.metadata || {},
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getAccountTransfers({ userId, limit = 20 } = {}) {
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
    .from("kuntai_account_transfers")
    .select("*")
    .or(`user_id.eq.${resolvedUserId},recipient_user_id.eq.${resolvedUserId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}
