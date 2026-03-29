const PHONE_KEY = "kuntai_onboarding_phone";

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
