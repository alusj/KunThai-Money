export function normalizeCurrencyCode(currency = "") {
  const normalizedCurrency = String(currency || "").trim().toUpperCase();

  if (!normalizedCurrency) {
    return "";
  }

  return normalizedCurrency === "SLE" ? "SLL" : normalizedCurrency;
}
