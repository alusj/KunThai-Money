async function callAuthApi(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Authentication request failed.");
  }

  return data;
}

export async function sendOtpCode({ phone }) {
  return callAuthApi("/api/auth-otp-start", {
    phone,
    channel: "sms",
  });
}

export async function verifyOtpCode({ phone, code, intent }) {
  return callAuthApi("/api/auth-otp-check", {
    phone,
    code,
    intent,
  });
}

export async function completePhoneRegistration({ phone, password, verificationToken }) {
  return callAuthApi("/api/auth-register-complete", {
    phone,
    password,
    verificationToken,
  });
}

export async function resetPasswordWithOtp({ phone, password, verificationToken }) {
  return callAuthApi("/api/auth-reset-password", {
    phone,
    password,
    verificationToken,
  });
}
