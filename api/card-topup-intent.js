import { createServiceClient, requireAuthorizedUser } from "./_lib/supabaseServer.js";

function normalizeAmount(amount) {
  const parsed = Number(amount);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Enter a valid amount.");
  }

  return Number(parsed.toFixed(2));
}

function resolveUserName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.raw_user_meta_data?.full_name ||
    user?.raw_user_meta_data?.name ||
    "KunThai User"
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const auth = await requireAuthorizedUser(req);

    if (auth.error) {
      return res.status(auth.error.status).json(auth.error.body);
    }

    const { user } = auth;
    const {
      accountId,
      amount,
      currency = "SLL",
      cardCategory = "Debit Card",
      receiptEmail = "",
    } = req.body || {};

    if (!accountId) {
      return res.status(400).json({ error: "Missing accountId." });
    }

    const normalizedAmount = normalizeAmount(amount);
    const serviceClient = createServiceClient();
    const { data: account, error: accountError } = await serviceClient
      .from("kuntai_accounts")
      .select("id,user_id,currency")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({
        error: "Wallet account not found for this user.",
        details: accountError?.message || null,
      });
    }

    const txRef = `kuntai-cashin-${user.id}-${Date.now()}`;
    const idempotencyKey = crypto.randomUUID();
    const intentPayload = {
      user_id: user.id,
      account_id: account.id,
      provider: "flutterwave",
      amount: normalizedAmount,
      currency: currency || account.currency || "SLL",
      fee_amount: 0,
      status: "created",
      risk_status: "clear",
      idempotency_key: idempotencyKey,
      client_reference: txRef,
      metadata: {
        flow: "cash_in_card_flutterwave",
        card_category: cardCategory,
        receipt_email: receiptEmail || user.email || "",
      },
    };

    const { data: paymentIntent, error: intentError } = await serviceClient
      .from("kuntai_payment_intents")
      .insert(intentPayload)
      .select()
      .single();

    if (intentError || !paymentIntent) {
      return res.status(500).json({
        error: "Unable to create payment intent.",
        details: intentError?.message || null,
      });
    }

    return res.status(200).json({
      success: true,
      paymentIntentId: paymentIntent.id,
      txRef,
      currency: paymentIntent.currency,
      amount: paymentIntent.amount,
      customer: {
        name: resolveUserName(user),
        email: receiptEmail || user.email || "",
        phone: resolveUserPhone(user),
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown server error.",
    });
  }
}
