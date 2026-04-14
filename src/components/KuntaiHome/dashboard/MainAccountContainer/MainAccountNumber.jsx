import { useEffect, useMemo, useRef, useState } from "react";
import { useAppearance } from "../../../AppearanceProvider";

function formatForDisplay(accountNumber = "") {
  if (!accountNumber) {
    return "";
  }

  const visibleStart = accountNumber.slice(0, 3);
  const visibleEnd = accountNumber.slice(-4);
  const hidden = "*".repeat(Math.max(accountNumber.length - 7, 0));
  return `${visibleStart}${hidden}${visibleEnd}`;
}

function fullyMask(accountNumber = "") {
  return "*".repeat(accountNumber.length || 12);
}

export default function MainAccountNumber({ account, onRemoveFromDashboard }) {
  const { isDarkMode } = useAppearance();
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const accountNumber = account?.account_number || "";
  const maskedAccountNumber = useMemo(() => formatForDisplay(accountNumber), [accountNumber]);
  const fullyMaskedAccountNumber = useMemo(() => fullyMask(accountNumber), [accountNumber]);

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

  if (!accountNumber) {
    return (
      <div
        className={`mb-8 rounded-[28px] border px-5 py-4 shadow-sm ${
          isDarkMode ? "border-slate-700 bg-slate-900/88" : "border-slate-200 bg-white/80"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Account Number</p>
        <div className="mt-3 h-5 w-40 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`mb-8 rounded-[28px] border px-5 py-4 ${
        isDarkMode
          ? "border-slate-700 bg-slate-900/92 shadow-[0_18px_40px_rgba(2,6,23,0.42)]"
          : "border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Account Number</p>
          <button
            type="button"
            onClick={() => setIsVisible((current) => !current)}
            className={`mt-2 break-all text-left font-mono text-base tracking-[0.4em] transition sm:text-lg ${isDarkMode ? "text-slate-100 hover:text-white" : "text-slate-800 hover:text-slate-950"}`}
          >
            {isVisible ? accountNumber : fullyMaskedAccountNumber || maskedAccountNumber}
          </button>
          <p className="mt-2 text-xs text-slate-400">Tap the number to {isVisible ? "hide" : "show"} it.</p>
        </div>

        <div className="relative self-end sm:self-auto" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              isDarkMode
                ? "border-slate-600 text-slate-100 hover:bg-slate-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            aria-expanded={menuOpen}
            aria-label="Open account number actions"
          >
            ...
          </button>

          {menuOpen && (
            <div
              className={`absolute right-0 top-12 z-20 min-w-[200px] rounded-3xl border p-2 shadow-2xl ${
                isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
              }`}
            >
              <button
                onClick={() => {
                  setIsVisible((current) => !current);
                  setMenuOpen(false);
                }}
                className={`flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isDarkMode ? "text-slate-100 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isVisible ? "Hide" : "Show"}
              </button>
              <button
                onClick={async () => {
                  await handleCopy();
                  setMenuOpen(false);
                }}
                className={`flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isDarkMode ? "text-slate-100 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => {
                  onRemoveFromDashboard?.();
                  setIsVisible(false);
                  setMenuOpen(false);
                }}
                className={`flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isDarkMode ? "text-rose-300 hover:bg-rose-950/40" : "text-rose-600 hover:bg-rose-50"
                }`}
              >
                Remove from dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
