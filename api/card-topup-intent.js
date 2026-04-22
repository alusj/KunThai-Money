import { createServiceClient, requireAuthorizedUser } from "./_lib/supabaseServer.js";
import { normalizeCurrencyCode } from "./_lib/currency.js";

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
    "KunTai User"
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

function normalizeFlutterwaveHostedLink(link) {
  if (!link) {
    return "";
  }

  return link
    .replace("https://checkout-v2.dev-flutterwave.com", "https://checkout.flutterwave.com")
    .replace("https://checkout-v3.dev-flutterwave.com", "https://checkout.flutterwave.com")
    .replace("https://out-v2.dev-flutterwave.com", "https://checkout.flutterwave.com");
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
    const flutterwaveSecretKey = process.env.FLW_SECRET_KEY;

    if (!accountId) {
      return res.status(400).json({ error: "Missing accountId." });
    }

    if (!flutterwaveSecretKey) {
      return res.status(500).json({ error: "Missing FLW_SECRET_KEY environment variable." });
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
      currency: normalizeCurrencyCode(currency || account.currency) || "SLL",
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

    const forwardedProto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const redirectUrl =
      `${forwardedProto}://${host}/wallet/topup/callback` +
      `?payment_intent_id=${encodeURIComponent(paymentIntent.id)}`;

    const flutterwaveResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flutterwaveSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: normalizedAmount,
        currency: normalizeCurrencyCode(paymentIntent.currency) || "SLL",
        redirect_url: redirectUrl,
        customer: {
          email: receiptEmail || user.email || "",
          name: resolveUserName(user),
          phonenumber: resolveUserPhone(user),
        },
        customizations: {
      title: "KunTaiMoney Cash In",
          description: "Fund your wallet with card using Flutterwave hosted checkout",
        },
        meta: {
          payment_intent_id: paymentIntent.id,
          account_id: account.id,
          card_category: cardCategory,
        },
      }),
    });

    const flutterwaveJson = await flutterwaveResponse.json().catch(() => ({}));
    const paymentLink = normalizeFlutterwaveHostedLink(
      flutterwaveJson?.data?.link || flutterwaveJson?.data?.checkout_url || ""
    );

    if (!flutterwaveResponse.ok || !paymentLink) {
      await serviceClient
        .from("kuntai_payment_intents")
        .update({
          status: "failed",
          failure_reason: "Flutterwave payment-link creation failed",
          updated_at: new Date().toISOString(),
          metadata: {
            ...(paymentIntent.metadata || {}),
            flutterwave_create_payment_response: flutterwaveJson,
          },
        })
        .eq("id", paymentIntent.id);

      return res.status(400).json({
        error: "Flutterwave could not create a hosted payment link.",
        details: flutterwaveJson?.message || flutterwaveJson,
      });
    }

    return res.status(200).json({
      success: true,
      paymentIntentId: paymentIntent.id,
      txRef,
      paymentLink,
      currency: normalizeCurrencyCode(paymentIntent.currency) || "SLL",
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
