const PHONE_KEY = "kuntai_onboarding_phone";
const PIN_KEY = "kuntai_onboarding_pin";
const TRANSACTION_PIN_RESET_PHONE_KEY = "kuntai_transaction_pin_reset_phone";
const OTP_VERIFICATION_SESSION_KEY = "kuntai_otp_verification_session";
const PENDING_REGISTRATION_KEY = "kuntai_pending_registration";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function setOnboardingPhone(phone) {
  const storage = getStorage();

  if (storage) {
    storage.setItem(PHONE_KEY, phone);
  }
}

export function getOnboardingPhone() {
  const storage = getStorage();

  if (!storage) {
    return "";
  }

  const currentPhone = storage.getItem(PHONE_KEY);

  if (currentPhone) {
    return currentPhone;
  }

  const legacyPhone = window.localStorage.getItem("kuntai_phone");

  if (legacyPhone) {
    storage.setItem(PHONE_KEY, legacyPhone);
    window.localStorage.removeItem("kuntai_phone");
    return legacyPhone;
  }

  return "";
}

export function clearOnboardingPhone() {
  const storage = getStorage();

  if (storage) {
    storage.removeItem(PHONE_KEY);
  }

  if (typeof window !== "undefined") {
    window.localStorage.removeItem("kuntai_phone");
  }
}

export function setOnboardingPin(pin) {
  const storage = getStorage();

  if (storage) {
    storage.setItem(PIN_KEY, pin);
  }
}

export function getOnboardingPin() {
  const storage = getStorage();

  if (!storage) {
    return "";
  }

  return storage.getItem(PIN_KEY) || "";
}

export function clearOnboardingPin() {
  const storage = getStorage();

  if (storage) {
    storage.removeItem(PIN_KEY);
  }
}

export function setTransactionPinResetPhone(phone) {
  const storage = getStorage();

  if (storage) {
    storage.setItem(TRANSACTION_PIN_RESET_PHONE_KEY, phone);
  }
}

export function getTransactionPinResetPhone() {
  const storage = getStorage();

  if (!storage) {
    return "";
  }

  return storage.getItem(TRANSACTION_PIN_RESET_PHONE_KEY) || "";
}

export function clearTransactionPinResetPhone() {
  const storage = getStorage();

  if (storage) {
    storage.removeItem(TRANSACTION_PIN_RESET_PHONE_KEY);
  }
}

export function setOtpVerificationSession(session) {
  const storage = getStorage();

  if (storage) {
    storage.setItem(OTP_VERIFICATION_SESSION_KEY, JSON.stringify(session || {}));
  }
}

export function getOtpVerificationSession() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(OTP_VERIFICATION_SESSION_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function clearOtpVerificationSession() {
  const storage = getStorage();

  if (storage) {
    storage.removeItem(OTP_VERIFICATION_SESSION_KEY);
  }
}

export function setPendingRegistration(payload) {
  const storage = getStorage();

  if (storage) {
    storage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(payload || {}));
  }
}

export function getPendingRegistration() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(PENDING_REGISTRATION_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function clearPendingRegistration() {
  const storage = getStorage();

  if (storage) {
    storage.removeItem(PENDING_REGISTRATION_KEY);
  }
}
