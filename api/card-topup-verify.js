import { createServiceClient, requireAuthorizedUser } from "./_lib/supabaseServer.js";

function buildFailureResponse(message, details) {
  return {
    success: false,
    error: message,
    details: typeof details === "string" ? details : details?.message || details || null,
  };
}

async function markIntentFailed(serviceClient, paymentIntent, reason, metadataPatch = {}) {
  await serviceClient
    .from("kuntai_payment_intents")
    .update({
      status: "failed",
      failure_reason: reason,
      updated_at: new Date().toISOString(),
      metadata: {
        ...(paymentIntent.metadata || {}),
        ...metadataPatch,
      },
    })
    .eq("id", paymentIntent.id);
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
    const { paymentIntentId, txRef } = req.body || {};
    const flutterwaveSecretKey = process.env.FLW_SECRET_KEY;

    if (!flutterwaveSecretKey) {
      return res.status(500).json({ error: "Missing FLW_SECRET_KEY environment variable." });
    }

    if (!paymentIntentId || !txRef) {
      return res.status(400).json({ error: "paymentIntentId and txRef are required." });
    }

    const serviceClient = createServiceClient();
    const { data: paymentIntent, error: paymentIntentError } = await serviceClient
      .from("kuntai_payment_intents")
      .select("*")
      .eq("id", paymentIntentId)
      .eq("user_id", user.id)
      .single();

    if (paymentIntentError || !paymentIntent) {
      return res.status(404).json(
        buildFailureResponse("Payment intent not found.", paymentIntentError)
      );
    }

    if (paymentIntent.client_reference !== txRef) {
      return res.status(400).json(
        buildFailureResponse("Payment reference does not match the created intent.")
      );
    }

    if (paymentIntent.status === "credited") {
      return res.status(200).json({
        success: true,
        alreadyCredited: true,
        message: "Payment already credited.",
      });
    }

    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verifyJson = await verifyResponse.json().catch(() => ({}));
    const flwData = verifyJson?.data ?? null;

    if (!verifyResponse.ok || !flwData) {
      await markIntentFailed(serviceClient, paymentIntent, "Flutterwave verification failed", {
        flutterwave_verify_response: verifyJson,
      });

      return res.status(400).json(
        buildFailureResponse("Flutterwave verification failed.", verifyJson?.message || verifyJson)
      );
    }

    const providerEventId = flwData?.id?.toString() || flwData?.flw_ref || txRef;
    const { error: eventError } = await serviceClient
      .from("kuntai_payment_events")
      .upsert(
        {
          payment_intent_id: paymentIntent.id,
          provider: "flutterwave",
          provider_event_id: providerEventId,
          event_type: "verify_by_reference",
          payload_json: verifyJson,
          signature_verified: true,
          processed_at: new Date().toISOString(),
        },
        {
          onConflict: "provider,provider_event_id",
        }
      );

    if (eventError) {
      return res.status(500).json(
        buildFailureResponse("Failed to write payment event.", eventError)
      );
    }

    const paidAmount = Number(flwData.amount ?? 0);
    const expectedAmount = Number(paymentIntent.amount ?? 0);
    const paidCurrency = String(flwData.currency ?? "").toUpperCase();
    const expectedCurrency = String(paymentIntent.currency ?? "").toUpperCase();
    const paymentStatus = String(flwData.status ?? "").toLowerCase();
    const passesChecks =
      paymentStatus === "successful" &&
      paidAmount >= expectedAmount &&
      paidCurrency === expectedCurrency;

    if (!passesChecks) {
      await markIntentFailed(serviceClient, paymentIntent, "Payment did not pass verification checks.", {
        flutterwave_verify_response: verifyJson,
      });

      return res.status(400).json(
        buildFailureResponse("Payment did not pass verification checks.", verifyJson)
      );
    }

    const { error: verifyUpdateError } = await serviceClient
      .from("kuntai_payment_intents")
      .update({
        provider_payment_id: flwData.id?.toString() ?? paymentIntent.provider_payment_id,
        status: "verified",
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...(paymentIntent.metadata || {}),
          flutterwave_tx_ref: txRef,
          flutterwave_flw_ref: flwData.flw_ref ?? null,
          flutterwave_verify_response: verifyJson,
          flutterwave_processor_response: flwData.processor_response ?? null,
          flutterwave_card_type: flwData.card?.type ?? null,
        },
      })
      .eq("id", paymentIntent.id)
      .neq("status", "credited");

    if (verifyUpdateError) {
      return res.status(500).json(
        buildFailureResponse("Failed to mark payment as verified.", verifyUpdateError)
      );
    }

    const { data: creditedIntent, error: creditError } = await serviceClient.rpc(
      "kuntai_credit_verified_payment_intent",
      { p_payment_intent_id: paymentIntent.id }
    );

    if (creditError) {
      return res.status(500).json(buildFailureResponse("Wallet credit failed.", creditError));
    }

    return res.status(200).json({
      success: true,
      message: "Wallet funded successfully.",
      paymentIntent: creditedIntent,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown server error.",
    });
  }
}
