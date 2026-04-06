import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const flutterwaveSecretKey = Deno.env.get("FLW_SECRET_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();
    const { paymentIntentId, txRef, mockSuccess = false } = body;

    if (!paymentIntentId || !txRef) {
      return new Response(
        JSON.stringify({ error: "paymentIntentId and txRef are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: paymentIntent, error: paymentIntentError } = await supabase
      .from("kuntai_payment_intents")
      .select("*")
      .eq("id", paymentIntentId)
      .eq("user_id", user.id)
      .single();

    if (paymentIntentError || !paymentIntent) {
      return new Response(
        JSON.stringify({ error: "Payment intent not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (paymentIntent.status === "credited") {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyCredited: true,
          message: "Payment already credited",
          paymentIntent,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let verifyJson: any = null;
    let flwData: any = null;
    let providerEventId = txRef;

    if (mockSuccess) {
      flwData = {
        id: `mock-${paymentIntent.id}`,
        tx_ref: txRef,
        flw_ref: `mock-flw-ref-${paymentIntent.id}`,
        amount: Number(paymentIntent.amount),
        currency: paymentIntent.currency,
        status: "successful",
        processor_response: "Approved by mock test mode",
        card: {
          type: "MASTERCARD",
          first_6digits: "553188",
        },
      };

      verifyJson = {
        status: "success",
        message: "Mock verification successful",
        data: flwData,
      };

      providerEventId = flwData.id;
    } else {
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

      verifyJson = await verifyResponse.json();
      flwData = verifyJson?.data ?? null;
      providerEventId = flwData?.id?.toString() || flwData?.flw_ref || txRef;

      if (!verifyResponse.ok || !flwData) {
        await supabase
          .from("kuntai_payment_intents")
          .update({
            status: "failed",
            failure_reason: "Flutterwave verification failed",
            updated_at: new Date().toISOString(),
            metadata: {
              ...(paymentIntent.metadata || {}),
              flutterwave_verify_response: verifyJson,
            },
          })
          .eq("id", paymentIntent.id);

        return new Response(
          JSON.stringify({
            success: false,
            error: "Flutterwave verification failed",
            providerResponse: verifyJson,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    await supabase
      .from("kuntai_payment_events")
      .upsert(
        {
          payment_intent_id: paymentIntent.id,
          provider: "flutterwave",
          provider_event_id: providerEventId,
          event_type: mockSuccess ? "mock_verify_success" : "verify_by_reference",
          payload_json: verifyJson,
          signature_verified: true,
          processed_at: new Date().toISOString(),
        },
        {
          onConflict: "provider,provider_event_id",
        }
      );

    const paidAmount = Number(flwData.amount ?? 0);
    const expectedAmount = Number(paymentIntent.amount ?? 0);
    const paidCurrency = String(flwData.currency ?? "").toUpperCase();
    const expectedCurrency = String(paymentIntent.currency ?? "").toUpperCase();
    const statusOk = String(flwData.status ?? "").toLowerCase() === "successful";

    const passesChecks =
      statusOk &&
      paidAmount >= expectedAmount &&
      paidCurrency === expectedCurrency;

    if (!passesChecks) {
      await supabase
        .from("kuntai_payment_intents")
        .update({
          status: "failed",
          failure_reason: "Payment failed verification checks",
          provider_payment_id: flwData?.id?.toString() ?? paymentIntent.provider_payment_id,
          updated_at: new Date().toISOString(),
          metadata: {
            ...(paymentIntent.metadata || {}),
            flutterwave_verify_response: verifyJson,
          },
        })
        .eq("id", paymentIntent.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment did not pass verification checks",
          providerResponse: verifyJson,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateIntentError } = await supabase
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
          flutterwave_card_brand: flwData.card?.first_6digits ?? null,
          verification_mode: mockSuccess ? "mock" : "live_flutterwave",
        },
      })
      .eq("id", paymentIntent.id)
      .neq("status", "credited");

    if (updateIntentError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update payment intent",
          details: updateIntentError,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: creditedIntent, error: creditError } = await supabase.rpc(
      "kuntai_credit_verified_payment_intent",
      { p_payment_intent_id: paymentIntent.id }
    );

    if (creditError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment verified but wallet credit failed",
          details: creditError,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: mockSuccess
          ? "Mock payment verified and wallet funded successfully"
          : "Wallet funded successfully",
        paymentIntent: creditedIntent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});