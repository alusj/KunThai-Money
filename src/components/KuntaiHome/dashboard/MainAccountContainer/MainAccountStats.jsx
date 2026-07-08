import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown } from "lucide-react";
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
  const [fxSwapped, setFxSwapped] = useState(false);
  const [fxState, setFxState] = useState({
    loading: false,
    error: "",
    data: null,
  });
  const menuRef = useRef(null);

  // Freeze the page while the exchange-rate card is open.
  useEffect(() => {
    if (!showFxModal) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showFxModal]);

  const formattedBalance = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(account?.balance || 0);
  const displayCurrency = normalizeCurrencyCode(account?.currency) || "SLL";

  const concealedBalance = useMemo(
    () => `${displayCurrency} ${maskAmount(formattedBalance)}`,
    [displayCurrency, formattedBalance]
  );
  const fxQuoteCurrency = displayCurrency === "USD" ? "SLL" : "USD";
  const fxAmountValue = Number(fxAmountInput);
  // Swapping inverts the pair locally, so either currency can be the input.
  const fxInputCurrency = fxSwapped ? fxState.data?.quote : fxState.data?.base;
  const fxOutputCurrency = fxSwapped ? fxState.data?.base : fxState.data?.quote;
  const fxEffectiveRate = fxState.data?.rate
    ? fxSwapped
      ? 1 / fxState.data.rate
      : fxState.data.rate
    : null;
  const fxConvertedValue =
    fxEffectiveRate && Number.isFinite(fxAmountValue) && fxAmountValue >= 0
      ? fxAmountValue * fxEffectiveRate
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

  if (!account) {
    return (
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded bg-emerald-100" />
        <div className="h-8 w-40 animate-pulse rounded bg-emerald-200" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Main Account Balance</p>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((current) => !current)}
            className="accent-chip rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:brightness-95"
            aria-expanded={menuOpen}
            aria-label="Open balance actions"
          >
            ...
          </button>

          {menuOpen && (
            <div className="accent-ring absolute right-0 top-12 z-20 min-w-[220px] rounded-3xl border bg-white p-2 shadow-2xl">
              <button
                onClick={() => {
                  setIsVisible((current) => !current);
                  setMenuOpen(false);
                }}
                className="accent-text flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-slate-50"
              >
                {isVisible ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => {
                  setShowFxModal(true);
                  setFxAmountInput("1");
                  setFxSwapped(false);
                  setMenuOpen(false);
                }}
                className="accent-text flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-slate-50"
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
        <h2 className="accent-text text-3xl font-bold tracking-wide sm:text-4xl">
          {isVisible ? `${displayCurrency} ${formattedBalance}` : concealedBalance}
        </h2>
      </button>
      <p className="accent-text mt-2 text-xs opacity-70">Tap the balance to {isVisible ? "hide" : "show"} it.</p>

      <AnimatePresence>
        {showFxModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onClick={() => setShowFxModal(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-[28px] border border-emerald-200/60 bg-[#141d35] p-5 text-white shadow-2xl"
            >
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-400)]">
              Foreign Exchange Rate
            </p>
            {fxState.loading ? <p className="mt-4 text-sm text-slate-300">Loading latest rate...</p> : null}
            {fxState.error ? <p className="mt-4 text-sm text-rose-300">{fxState.error}</p> : null}
            {fxState.data ? (
              <>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      1 {fxInputCurrency} = {formatExchangeNumber(fxEffectiveRate)} {fxOutputCurrency}
                    </p>
                    <p className="mt-2 text-xs text-slate-300">Rate checked: {fxState.data.date}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFxSwapped((current) => !current);
                      setFxAmountInput("1");
                    }}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-950/40 text-slate-100 transition hover:border-slate-400 hover:bg-slate-800/70"
                    aria-label={`Switch to converting ${fxOutputCurrency} to ${fxInputCurrency}`}
                    title="Swap currencies"
                  >
                    <ArrowUpDown size={18} />
                  </button>
                </div>
                <label className="mt-5 block">
                  <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Enter {fxInputCurrency} amount
                  </span>
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-300">{fxInputCurrency}</span>
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
                <div className="mt-4 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--accent-soft-border)", background: "var(--accent-soft-bg)" }}>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent-300)" }}>
                    Converted Amount
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatCurrencyCodeAmount(fxConvertedValue, fxOutputCurrency)}
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
