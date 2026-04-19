import { useEffect, useState } from "react";
import { normalizeCurrencyCode } from "../../../../../../Backend/utils/currency";

function adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, rate) {
  const numericRate = Number(rate);
  const normalizedBase = normalizeCurrencyCode(baseCurrency);
  const normalizedQuote = normalizeCurrencyCode(quoteCurrency);

  if (!Number.isFinite(numericRate)) return null;
  if (normalizedBase === "SLL" && normalizedQuote !== "SLL") return numericRate * 1000;
  if (normalizedBase !== "SLL" && normalizedQuote === "SLL") return numericRate / 1000;
  return numericRate;
}

async function fetchExchangeRate(baseCurrency, quoteCurrency) {
  if (!baseCurrency || !quoteCurrency) throw new Error("Currency pair is incomplete.");
  if (baseCurrency === quoteCurrency) return 1;

  const directProviders = [
    async () => {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (!response.ok) return null;
      const data = await response.json();
      return adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, data?.rates?.[quoteCurrency]);
    },
    async () => {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}&to=${quoteCurrency}`);
      if (!response.ok) return null;
      const data = await response.json();
      return adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, data?.rates?.[quoteCurrency]);
    },
  ];

  for (const provider of directProviders) {
    const rate = await provider();
    if (rate) return Number(rate);
  }

  throw new Error("Live conversion rate is unavailable right now.");
}

export function useConversionRate({ isConversionFlow, currency, targetCurrency }) {
  const [fxState, setFxState] = useState({
    loading: false,
    error: "",
    rate: null,
  });

  useEffect(() => {
    if (!isConversionFlow) {
      setFxState({ loading: false, error: "", rate: null });
      return;
    }

    if (!currency || !targetCurrency) {
      setFxState({ loading: false, error: "", rate: null });
      return;
    }

    if (currency === targetCurrency) {
      setFxState({ loading: false, error: "", rate: 1 });
      return;
    }

    let isActive = true;

    async function loadRate() {
      setFxState({ loading: true, error: "", rate: null });

      try {
        const rate = await fetchExchangeRate(currency, targetCurrency);
        if (isActive) {
          setFxState({ loading: false, error: "", rate: Number(rate) });
        }
      } catch (rateError) {
        if (isActive) {
          setFxState({
            loading: false,
            error: rateError.message || "Live conversion rate is unavailable right now.",
            rate: null,
          });
        }
      }
    }

    loadRate();

    return () => {
      isActive = false;
    };
  }, [currency, isConversionFlow, targetCurrency]);

  return { fxState };
}