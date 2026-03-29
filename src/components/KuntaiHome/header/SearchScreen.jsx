import { useMemo, useState } from "react";

import BackTab from "./Transactions/BackTab";

export default function SearchScreen({ transactions = [], onBack, onOpenTransactions, onOpenNotifications }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) {
      return [];
    }

    return transactions.filter((transaction) =>
      [
        transaction.transaction_type,
        transaction.description,
        transaction.counterparty_name,
        transaction.counterparty_account,
        transaction.id,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm))
    );
  }, [query, transactions]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-400">Search Center</p>
            <h1 className="mt-2 text-lg font-bold text-slate-950 md:text-xl">Find activity quickly</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Search</span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions by type, name, account, or reference"
              className="mt-3 w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </label>

          {!query.trim() ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                onClick={onOpenTransactions}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white"
              >
                <p className="text-lg font-semibold text-slate-950">Open transactions</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">View the full history of cash in and cash out activity.</p>
              </button>

              <button
                onClick={onOpenNotifications}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white"
              >
                <p className="text-lg font-semibold text-slate-950">Open notifications</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Check compliance, trust, and recent account updates.</p>
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {results.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  No matching results found.
                </div>
              ) : (
                results.map((transaction) => (
                  <button
                    key={transaction.id}
                    onClick={onOpenTransactions}
                    className="block w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <p className="text-base font-semibold text-slate-950">
                      {transaction.counterparty_name || transaction.description || transaction.transaction_type}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {transaction.transaction_type || "transaction"} | Ref {transaction.id?.slice?.(0, 8) || "N/A"}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
