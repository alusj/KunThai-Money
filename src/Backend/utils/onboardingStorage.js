const PHONE_KEY = "kuntai_onboarding_phone";
const PIN_KEY = "kuntai_onboarding_pin";
const TRANSACTION_PIN_RESET_PHONE_KEY = "kuntai_transaction_pin_reset_phone";

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
