const STORAGE_PREFIX = "kuntai-home-unlocked";

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function isHomeUnlocked(userId) {
  if (typeof window === "undefined" || !userId) {
    return false;
  }

  return window.sessionStorage.getItem(getStorageKey(userId)) === "true";
}

export function markHomeUnlocked(userId) {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  window.sessionStorage.setItem(getStorageKey(userId), "true");
}

export function clearHomeUnlocked(userId) {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  window.sessionStorage.removeItem(getStorageKey(userId));
}
