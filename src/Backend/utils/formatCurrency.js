// ======================================================
// utils/formatCurrency.js
// Professional currency formatter for Kuntai
// ======================================================

export const formatCurrency = (amount, currency = "SLE") => {

  try {

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);

  } catch (error) {

    // fallback
    return `${currency} ${amount}`;

  }

};