import supabase from "../lib/supabaseClient";

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

async function parseFunctionResponse(response, fallbackMessage) {
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
        fallbackMessage
    );
  }

  return result;
}

export async function runMockCashInTest({
  accountId,
  amount,
  currency = "SLL",
  cardCategory,
  receiptEmail,
}) {
  const accessToken = await getAccessToken();

  const response = await fetch(getSupabaseFunctionUrl("mock-cashin-test"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      accountId,
      amount,
      currency,
      cardCategory,
      receiptEmail,
    }),
  });

  return parseFunctionResponse(response, "Mock cash in failed.");
}