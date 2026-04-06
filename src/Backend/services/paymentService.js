import supabase from "../lib/supabaseClient";

async function ensureFreshSession({ forceRefresh = false } = {}) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || "Unable to get current session.");
  }

  if (!session) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const expiresAtMs = Number(session.expires_at || 0) * 1000;
  const needsRefresh =
    forceRefresh || !session.access_token || (expiresAtMs && expiresAtMs - Date.now() < 60_000);

  if (!needsRefresh) {
    return session;
  }

  const {
    data: refreshData,
    error: refreshError,
  } = await supabase.auth.refreshSession();

  if (refreshError || !refreshData?.session) {
    throw new Error("Your session has expired. Please sign in again and retry.");
  }

  return refreshData.session;
}

async function extractFunctionError(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  const responseContext = error.context;

  if (responseContext) {
    try {
      const parsed =
        typeof responseContext.json === "function"
          ? await responseContext.json()
          : null;

      if (parsed) {
        return (
          parsed.error ||
          parsed.message ||
          parsed.details?.message ||
          (typeof parsed.details === "string" ? parsed.details : "") ||
          fallbackMessage
        );
      }
    } catch {
      try {
        const text =
          typeof responseContext.text === "function"
            ? await responseContext.text()
            : "";

        if (text) {
          return text;
        }
      } catch {
        // Fall back to the generic error below.
      }
    }
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  return (
    error.error ||
    error.message ||
    error.details?.message ||
    (typeof error.details === "string" ? error.details : "") ||
    fallbackMessage
  );
}

export async function runMockCashInTest({
  accountId,
  amount,
  currency = "SLL",
  cardCategory,
  receiptEmail,
}) {
  const payload = {
    accountId,
    amount,
    currency,
    cardCategory,
    receiptEmail,
  };

  const invokeMockFunction = async () => {
    const { data, error } = await supabase.functions.invoke("mock-cashin-test", {
      body: payload,
    });

    if (error) {
      throw new Error(await extractFunctionError(error, "Mock cash in failed."));
    }

    return data;
  };

  try {
    await ensureFreshSession();
    return await invokeMockFunction();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!/jwt|auth/i.test(message)) {
      throw error;
    }

    await ensureFreshSession({ forceRefresh: true });
    return invokeMockFunction();
  }
}
