import supabase from "../lib/supabaseClient";

function extractErrorMessage(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === "string") {
    return payload;
  }

  return (
    payload.error ||
    payload.message ||
    payload.details?.message ||
    (typeof payload.details === "string" ? payload.details : "") ||
    fallbackMessage
  );
}

async function ensureFreshAccessToken({ forceRefresh = false } = {}) {
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
  const shouldRefresh =
    forceRefresh || !session.access_token || (expiresAtMs && expiresAtMs - Date.now() < 60_000);

  if (!shouldRefresh) {
    return session.access_token;
  }

  const {
    data: refreshData,
    error: refreshError,
  } = await supabase.auth.refreshSession();

  if (refreshError || !refreshData?.session?.access_token) {
    throw new Error("Your session has expired. Please sign in again and retry.");
  }

  return refreshData.session.access_token;
}

async function callAuthorizedApi(path, payload) {
  const send = async (accessToken) => {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(extractErrorMessage(result, "Payment request failed."));
    }

    return result;
  };

  try {
    const accessToken = await ensureFreshAccessToken();
    return await send(accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!/jwt|token|session/i.test(message)) {
      throw error;
    }

    const refreshedToken = await ensureFreshAccessToken({ forceRefresh: true });
    return send(refreshedToken);
  }
}

export async function createCardTopupIntent(payload) {
  return callAuthorizedApi("/api/card-topup-intent", payload);
}

export async function verifyCardTopup(payload) {
  return callAuthorizedApi("/api/card-topup-verify", payload);
}
