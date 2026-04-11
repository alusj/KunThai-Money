export function normalizeCurrencyCode(currency = "") {
  const normalizedCurrency = String(currency || "").trim().toUpperCase();

  if (!normalizedCurrency) {
    return "";
  }

  return normalizedCurrency === "SLE" ? "SLL" : normalizedCurrency;
}

export function normalizeCurrencyRecord(record) {
  if (!record) {
    return record;
  }

  return {
    ...record,
    currency: normalizeCurrencyCode(record.currency),
  };
}
