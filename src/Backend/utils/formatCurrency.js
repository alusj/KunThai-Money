import { normalizeCurrencyCode } from "./currency";

// ======================================================
// utils/formatCurrency.js
// Professional currency formatter for Kuntai
// ======================================================

export const formatCurrency = (amount, currency = "SLL") => {
  const normalizedCurrency = normalizeCurrencyCode(currency) || "SLL";

  try {

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 2
    }).format(amount);

  } catch (error) {

    // fallback
    return `${normalizedCurrency} ${amount}`;

  }

};
