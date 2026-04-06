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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SB_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized user",
          details: userError,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const {
      accountId,
      amount,
      currency = "SLL",
      cardCategory = "Debit Card",
      receiptEmail = "",
    } = body ?? {};

    const numericAmount = Number(amount);

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: "Missing accountId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: account, error: accountError } = await supabase
      .from("kuntai_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({
          error: "Account not found or not owned by user",
          details: accountError,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const txRef = `mock-cashin-${user.id}-${Date.now()}`;
    const idempotencyKey =
      globalThis.crypto?.randomUUID?.() ||
      `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const { data: paymentIntent, error: intentError } = await supabase
      .from("kuntai_payment_intents")
      .insert({
        user_id: user.id,
        account_id: account.id,
        provider: "flutterwave",
        amount: Number(numericAmount.toFixed(2)),
        currency,
        fee_amount: 0,
        status: "created",
        risk_status: "clear",
        idempotency_key: idempotencyKey,
        client_reference: txRef,
        metadata: {
          flow: "cash_in_card_mock",
          card_category: cardCategory,
          receipt_email: receiptEmail,
        },
      })
      .select()
      .single();

    if (intentError || !paymentIntent) {
      return new Response(
        JSON.stringify({
          error: "Failed to create payment intent",
          details: intentError,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mockProviderPaymentId = `mock-${paymentIntent.id}`;
    const mockFlwRef = `mock-flw-ref-${paymentIntent.id}`;

    const { error: eventError } = await supabase
      .from("kuntai_payment_events")
      .upsert(
        {
          payment_intent_id: paymentIntent.id,
          provider: "flutterwave",
          provider_event_id: mockProviderPaymentId,
          event_type: "mock_verify_success",
          payload_json: {
            status: "success",
            message: "Mock verification successful",
            data: {
              id: mockProviderPaymentId,
              tx_ref: txRef,
              flw_ref: mockFlwRef,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: "successful",
              processor_response: "Approved by secure mock mode",
              card: {
                type: "MOCK_CARD",
                first_6digits: "553188",
              },
            },
          },
          signature_verified: true,
          processed_at: new Date().toISOString(),
        },
        {
          onConflict: "provider,provider_event_id",
        }
      );

    if (eventError) {
      return new Response(
        JSON.stringify({
          error: "Failed to write payment event",
          details: eventError,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: verifyUpdateError } = await supabase
      .from("kuntai_payment_intents")
      .update({
        provider_payment_id: mockProviderPaymentId,
        status: "verified",
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...(paymentIntent.metadata || {}),
          verification_mode: "mock_secure",
          flutterwave_tx_ref: txRef,
          flutterwave_flw_ref: mockFlwRef,
        },
      })
      .eq("id", paymentIntent.id)
      .neq("status", "credited");

    if (verifyUpdateError) {
      return new Response(
        JSON.stringify({
          error: "Failed to mark payment intent as verified",
          details: verifyUpdateError,
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
          error: "Wallet credit failed",
          details: creditError,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mock cash in completed successfully",
        paymentIntent: creditedIntent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});