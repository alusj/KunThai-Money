import { useMemo, useState } from "react";

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

export default function MainAccountNumber({ account }) {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const accountNumber = account?.account_number || "";
  const maskedAccountNumber = useMemo(() => formatForDisplay(accountNumber), [accountNumber]);
  const fullyMaskedAccountNumber = useMemo(() => fullyMask(accountNumber), [accountNumber]);

  if (!accountNumber) {
    return (
      <div className="mb-8 rounded-[28px] border border-slate-200 bg-white/80 px-5 py-4 shadow-sm">
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
    <div className="mb-8 rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Account Number</p>
          <p className="mt-2 break-all font-mono text-base tracking-[0.4em] text-slate-800 sm:text-lg">
            {isVisible ? accountNumber : fullyMaskedAccountNumber || maskedAccountNumber}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIsVisible((current) => !current)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {isVisible ? "Hide" : "Show"}
          </button>

          <button
            onClick={handleCopy}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
