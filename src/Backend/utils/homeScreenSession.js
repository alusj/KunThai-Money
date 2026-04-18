const HOME_SCREEN_KEY = "kuntai-home-active-screen";
const HOME_SCREEN_LAST_ACTIVE_AT_KEY = "kuntai-home-last-active-at";
export const HOME_SCREEN_RESUME_WINDOW_MS = 5 * 60 * 1000;

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readStoredHomeScreen(persistedScreens, fallback = "dashboard") {
  if (!canUseStorage()) {
    return fallback;
  }

  const savedScreen = window.localStorage.getItem(HOME_SCREEN_KEY);
  const lastActiveAt = Number(window.localStorage.getItem(HOME_SCREEN_LAST_ACTIVE_AT_KEY) || 0);

  if (!persistedScreens.has(savedScreen)) {
    return fallback;
  }

  if (!lastActiveAt || Date.now() - lastActiveAt > HOME_SCREEN_RESUME_WINDOW_MS) {
    clearStoredHomeScreen();
    return fallback;
  }

  return savedScreen;
}

export function persistHomeScreen(screen, persistedScreens) {
  if (!canUseStorage() || !persistedScreens.has(screen)) {
    return;
  }

  window.localStorage.setItem(HOME_SCREEN_KEY, screen);
}

export function markHomeScreenActiveNow() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(HOME_SCREEN_LAST_ACTIVE_AT_KEY, String(Date.now()));
}

export function getHomeScreenLastActiveAt() {
  if (!canUseStorage()) {
    return 0;
  }

  return Number(window.localStorage.getItem(HOME_SCREEN_LAST_ACTIVE_AT_KEY) || 0);
}

export function clearStoredHomeScreen() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(HOME_SCREEN_KEY);
  window.localStorage.removeItem(HOME_SCREEN_LAST_ACTIVE_AT_KEY);
}
