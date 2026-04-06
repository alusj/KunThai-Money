import supabase from "../lib/supabaseClient";

function normalizeAmount(amount) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Enter a valid amount.");
  }
  return Number(parsed.toFixed(2));
}

function resolveUserEmail(user) {
  return (
    user?.email ||
    user?.user_metadata?.email ||
    user?.raw_user_meta_data?.email ||
    ""
  );
}

function resolveUserPhone(user) {
  return (
    user?.phone ||
    user?.user_metadata?.phone ||
    user?.raw_user_meta_data?.phone ||
    ""
  );
}

function resolveUserName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.raw_user_meta_data?.full_name ||
    user?.user_metadata?.name ||
    user?.raw_user_meta_data?.name ||
    "KunTai User"
  );
}

function getSupabaseFunctionUrl(functionName) {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!baseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL in frontend environment.");
  }

  return `${baseUrl}/functions/v1/${functionName}`;
}

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || "Unable to get current session.");
  }

  if (!session?.access_token) {
    throw new Error("You are not logged in.");
  }

  return session.access_token;
}

async function parseFunctionResponse(response) {
  let result = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        result?.details?.message ||
        JSON.stringify(result?.details) ||
        JSON.stringify(result) ||
        "Payment verification failed."
    );
  }

  return result;
}

export async function createCardCashInIntent({
  accountId,
  amount,
  currency = "SLL",
  cardCategory,
}) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to continue.");
  }

  if (!accountId) {
    throw new Error("Missing wallet account.");
  }

  const safeAmount = normalizeAmount(amount);

  const txRef = `kuntai-cashin-${user.id}-${Date.now()}`;
  const idempotencyKey =
    globalThis.crypto?.randomUUID?.() ||
    `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const payload = {
    user_id: user.id,
    account_id: accountId,
    provider: "flutterwave",
    amount: safeAmount,
    currency,
    fee_amount: 0,
    status: "created",
    risk_status: "clear",
    idempotency_key: idempotencyKey,
    client_reference: txRef,
    metadata: {
      flow: "cash_in_card",
      card_category: cardCategory,
    },
  };

  const { data, error } = await supabase
    .from("kuntai_payment_intents")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Unable to create payment intent.");
  }

  return {
    paymentIntent: data,
    txRef,
    customer: {
      name: resolveUserName(user),
      email: resolveUserEmail(user),
      phone: resolveUserPhone(user),
    },
  };
}

export async function verifyCardCashIn({
  paymentIntentId,
  txRef,
  mockSuccess = false,
}) {
  if (!paymentIntentId) {
    throw new Error("Missing payment intent ID.");
  }

  if (!txRef) {
    throw new Error("Missing payment reference.");
  }

  const accessToken = await getAccessToken();
  const functionUrl = getSupabaseFunctionUrl("flutterwave-verify-payment");

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      paymentIntentId,
      txRef,
      mockSuccess,
    }),
  });

  return parseFunctionResponse(response);
}