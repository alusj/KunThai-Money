import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kuntai-appearance-theme";
const LANGUAGE_STORAGE_KEY = "kuntai-language-preference";
const TEXT_SIZE_STORAGE_KEY = "kuntai-text-size";
const ACCENT_STORAGE_KEY = "kuntai-accent-color";
const AppearanceContext = createContext(null);
const SUPPORTED_LANGUAGES = [
  { value: "system", label: "Device default" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "ar", label: "Arabic" },
];
const THEME_COLORS = [
  { value: "default", label: "Default" },
  { value: "black", label: "Black" },
  { value: "ocean", label: "Ocean" },
  { value: "emerald", label: "Emerald" },
  { value: "violet", label: "Violet" },
  { value: "amber", label: "Amber" },
  { value: "rose", label: "Rose" },
];

function resolveSystemLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  const deviceLanguage = (window.navigator?.language || "en").toLowerCase();

  if (deviceLanguage.startsWith("fr")) {
    return "fr";
  }

  if (deviceLanguage.startsWith("ar")) {
    return "ar";
  }

  return "en";
}

function resolveInitialLanguage() {
  if (typeof window === "undefined") {
    return "system";
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const isSupported = SUPPORTED_LANGUAGES.some((item) => item.value === savedLanguage);

  return isSupported ? savedLanguage : "system";
}

function resolveInitialTextSize() {
  if (typeof window === "undefined") {
    return "medium";
  }

  const savedTextSize = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
  return savedTextSize === "small" || savedTextSize === "large" || savedTextSize === "medium"
    ? savedTextSize
    : "medium";
}

function resolveInitialAccentColor() {
  if (typeof window === "undefined") {
    return "black";
  }

  const savedAccent = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return THEME_COLORS.some((item) => item.value === savedAccent) ? savedAccent : "black";
}

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function resolveInitialMode() {
  if (typeof window === "undefined") {
    return "system";
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (savedTheme === "dark" || savedTheme === "light" || savedTheme === "system") {
    return savedTheme;
  }

  return "system";
}

export function AppearanceProvider({ children }) {
  const [appearanceMode, setAppearanceMode] = useState(resolveInitialMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const [language, setLanguage] = useState(resolveInitialLanguage);
  const [textSize, setTextSize] = useState(resolveInitialTextSize);
  const [accentColor, setAccentColor] = useState(resolveInitialAccentColor);
  const theme = appearanceMode === "system" ? systemTheme : appearanceMode;
  const resolvedLanguage = language === "system" ? resolveSystemLanguage() : language;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.textSize = textSize;
    document.documentElement.dataset.accent = accentColor;
    document.documentElement.lang = resolvedLanguage;
    document.body.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, appearanceMode);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, textSize);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accentColor);
  }, [accentColor, appearanceMode, language, resolvedLanguage, textSize, theme]);

  const resolvedLanguageLabel =
    SUPPORTED_LANGUAGES.find((item) => item.value === resolvedLanguage)?.label || "English";

  const value = useMemo(
    () => ({
      theme,
      appearanceMode,
      isDarkMode: theme === "dark",
      systemTheme,
      language,
      resolvedLanguage,
      resolvedLanguageLabel,
      availableLanguages: SUPPORTED_LANGUAGES,
      textSize,
      accentColor,
      availableThemeColors: THEME_COLORS,
      setTheme: (nextTheme) => setAppearanceMode(nextTheme === "dark" ? "dark" : "light"),
      setAppearanceMode,
      setLanguage,
      setTextSize,
      setAccentColor,
      toggleTheme: () =>
        setAppearanceMode((current) => {
          const resolvedCurrentTheme = current === "system" ? systemTheme : current;
          return resolvedCurrentTheme === "dark" ? "light" : "dark";
        }),
    }),
    [
      accentColor,
      appearanceMode,
      language,
      resolvedLanguage,
      resolvedLanguageLabel,
      systemTheme,
      textSize,
      theme,
    ]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used within an AppearanceProvider.");
  }

  return context;
}
