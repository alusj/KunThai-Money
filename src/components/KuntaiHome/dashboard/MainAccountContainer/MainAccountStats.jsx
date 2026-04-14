import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeCurrencyCode } from "../../../../Backend/utils/currency";

function maskAmount(amountText = "") {
  return amountText.replace(/[0-9]/g, "*");
}

function formatExchangeNumber(value) {
  const numericValue = Number(value || 0);
  const absoluteValue = Math.abs(numericValue);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  if (absoluteValue === 0) {
    return "0";
  }

  if (absoluteValue >= 1) {
    return numericValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  if (absoluteValue >= 0.1) {
    return numericValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }

  return numericValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function formatCurrencyCodeAmount(value, currency) {
  const numericValue = Number(value || 0);
  const normalizedCurrency = normalizeCurrencyCode(currency) || "SLL";
  const absoluteValue = Math.abs(numericValue);

  if (!Number.isFinite(numericValue)) {
    return `${normalizedCurrency} 0`;
  }

  const maximumFractionDigits = absoluteValue > 0 && absoluteValue < 1 ? 4 : 2;

  return `${normalizedCurrency} ${numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })}`;
}

function adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, rate) {
  const numericRate = Number(rate);
  const normalizedBase = normalizeCurrencyCode(baseCurrency);
  const normalizedQuote = normalizeCurrencyCode(quoteCurrency);

  if (!Number.isFinite(numericRate)) {
    return null;
  }

  if (normalizedBase === "SLL" && normalizedQuote !== "SLL") {
    return numericRate * 1000;
  }

  if (normalizedBase !== "SLL" && normalizedQuote === "SLL") {
    return numericRate / 1000;
  }

  return numericRate;
}

function sanitizeAmountInput(value = "") {
  const sanitized = String(value).replace(/[^\d.]/g, "");
  const [whole = "", decimal = ""] = sanitized.split(".");

  if (sanitized.includes(".")) {
    return `${whole}.${decimal.slice(0, 4)}`;
  }

  return whole;
}

async function fetchExchangeRate(baseCurrency, quoteCurrency) {
  if (!baseCurrency || !quoteCurrency) {
    throw new Error("Currency pair is incomplete.");
  }

  if (baseCurrency === quoteCurrency) {
    return 1;
  }

  const directProviders = [
    async () => {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const rate = data?.rates?.[quoteCurrency] || null;
      return adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, rate);
    },
    async () => {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${baseCurrency}&to=${quoteCurrency}`
      );
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const rate = data?.rates?.[quoteCurrency] || null;
      return adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, rate);
    },
  ];

  for (const provider of directProviders) {
    const rate = await provider();
    if (rate) {
      return Number(rate);
    }
  }

  const reverseProviders = [
    async () => {
      const response = await fetch(`https://open.er-api.com/v6/latest/${quoteCurrency}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const reverseRate = data?.rates?.[baseCurrency] || null;
      return reverseRate
        ? adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, 1 / Number(reverseRate))
        : null;
    },
    async () => {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${quoteCurrency}&to=${baseCurrency}`
      );
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const reverseRate = data?.rates?.[baseCurrency] || null;
      return reverseRate
        ? adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, 1 / Number(reverseRate))
        : null;
    },
  ];

  for (const provider of reverseProviders) {
    const rate = await provider();
    if (rate) {
      return Number(rate);
    }
  }

  throw new Error("Rate unavailable right now.");
}

export default function MainAccountStats({ account }) {
  const [isVisible, setIsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFxModal, setShowFxModal] = useState(false);
  const [fxAmountInput, setFxAmountInput] = useState("1");
  const [fxState, setFxState] = useState({
    loading: false,
    error: "",
    data: null,
  });
  const menuRef = useRef(null);

  if (!account) {
    return (
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded bg-emerald-100" />
        <div className="h-8 w-40 animate-pulse rounded bg-emerald-200" />
      </div>
    );
  }

  const formattedBalance = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(account.balance || 0);
  const displayCurrency = normalizeCurrencyCode(account.currency) || "SLL";

  const concealedBalance = useMemo(
    () => `${displayCurrency} ${maskAmount(formattedBalance)}`,
    [displayCurrency, formattedBalance]
  );
  const fxQuoteCurrency = displayCurrency === "USD" ? "SLL" : "USD";
  const fxAmountValue = Number(fxAmountInput);
  const fxConvertedValue =
    fxState.data?.rate && Number.isFinite(fxAmountValue) && fxAmountValue >= 0
      ? fxAmountValue * fxState.data.rate
      : 0;

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!showFxModal) {
      return undefined;
    }

    let active = true;

    async function loadFxRate() {
      setFxState({ loading: true, error: "", data: null });

      try {
        const rate = await fetchExchangeRate(displayCurrency, fxQuoteCurrency);

        if (active) {
          setFxState({
            loading: false,
            error: "",
            data: {
              base: displayCurrency,
              quote: fxQuoteCurrency,
              rate,
              date: new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date()),
            },
          });
        }
      } catch (error) {
        if (active) {
          setFxState({
            loading: false,
            error: error.message || "Unable to load exchange rate right now.",
            data: null,
          });
        }
      }
    }

    loadFxRate();

    return () => {
      active = false;
    };
  }, [displayCurrency, fxQuoteCurrency, showFxModal]);

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Main Account Balance</p>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((current) => !current)}
            className="rounded-full border border-emerald-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            aria-expanded={menuOpen}
            aria-label="Open balance actions"
          >
            ...
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 min-w-[220px] rounded-3xl border border-emerald-100 bg-white p-2 shadow-2xl">
              <button
                onClick={() => {
                  setIsVisible((current) => !current);
                  setMenuOpen(false);
                }}
                className="flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
              >
                {isVisible ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => {
                  setShowFxModal(true);
                  setFxAmountInput("1");
                  setMenuOpen(false);
                }}
                className="flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
              >
                Foreign exchange rate
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="text-left"
      >
        <h2 className="text-3xl font-bold tracking-wide text-emerald-700 sm:text-4xl">
          {isVisible ? `${displayCurrency} ${formattedBalance}` : concealedBalance}
        </h2>
      </button>
      <p className="mt-2 text-xs text-emerald-700/70">Tap the balance to {isVisible ? "hide" : "show"} it.</p>

      {showFxModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-4 pb-6 pt-20 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-emerald-200/60 bg-[#141d35] p-5 text-white shadow-2xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Foreign Exchange Rate
            </p>
            {fxState.loading ? <p className="mt-4 text-sm text-slate-300">Loading latest rate...</p> : null}
            {fxState.error ? <p className="mt-4 text-sm text-rose-300">{fxState.error}</p> : null}
            {fxState.data ? (
              <>
                <p className="mt-4 text-lg font-semibold text-white">
                  1 {fxState.data.base} = {formatExchangeNumber(fxState.data.rate)} {fxState.data.quote}
                </p>
                <p className="mt-2 text-xs text-slate-300">Rate checked: {fxState.data.date}</p>
                <label className="mt-5 block">
                  <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Enter {fxState.data.base} amount
                  </span>
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-300">{fxState.data.base}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fxAmountInput}
                        onChange={(event) => setFxAmountInput(sanitizeAmountInput(event.target.value))}
                        placeholder="0"
                        className="w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </label>
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Converted Amount
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatCurrencyCodeAmount(fxConvertedValue, fxState.data.quote)}
                  </p>
                </div>
              </>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowFxModal(false)}
                className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowFxModal(false)}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
