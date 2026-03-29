import { useMemo, useState } from "react";

function maskAmount(amountText = "") {
  return amountText.replace(/[0-9]/g, "*");
}

export default function MainAccountStats({ account }) {
  const [isVisible, setIsVisible] = useState(false);

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

  const concealedBalance = useMemo(
    () => `${account.currency} ${maskAmount(formattedBalance)}`,
    [account.currency, formattedBalance]
  );

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Main Account Balance</p>

        <button
          onClick={() => setIsVisible((current) => !current)}
          className="rounded-full border border-emerald-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>

      <h2 className="text-3xl font-bold tracking-wide text-emerald-700 sm:text-4xl">
        {isVisible ? `${account.currency} ${formattedBalance}` : concealedBalance}
      </h2>
    </div>
  );
}
