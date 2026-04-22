const STORAGE_PREFIX = "kuntai-home-unlocked";
const REFRESH_PRESERVE_PREFIX = "kuntai-home-unlocked-refresh";

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function getRefreshPreserveKey(userId) {
  return `${REFRESH_PRESERVE_PREFIX}:${userId}`;
}

function getNavigationType() {
  if (typeof window === "undefined" || typeof window.performance?.getEntriesByType !== "function") {
    return "";
  }

  const navigationEntry = window.performance.getEntriesByType("navigation")[0];
  return navigationEntry?.type || "";
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

export function preserveHomeUnlockForRefresh(userId, isUnlocked) {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  if (isUnlocked) {
    window.sessionStorage.setItem(getRefreshPreserveKey(userId), "true");
    return;
  }

  window.sessionStorage.removeItem(getRefreshPreserveKey(userId));
}

export function restoreHomeUnlockAfterRefresh(userId) {
  if (typeof window === "undefined" || !userId) {
    return false;
  }

  const preserveKey = getRefreshPreserveKey(userId);
  const shouldRestore = window.sessionStorage.getItem(preserveKey) === "true";
  const navigationType = getNavigationType();

  window.sessionStorage.removeItem(preserveKey);

  if (shouldRestore && navigationType === "reload") {
    markHomeUnlocked(userId);
    return true;
  }

  return isHomeUnlocked(userId);
}
