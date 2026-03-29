import { useEffect, useMemo, useState } from "react";

import { getTransactions, summarizeTransactions } from "../../../../Backend/services/transactionService";
import { formatCurrency } from "../../../../Backend/utils/formatCurrency";
import TransactionsHeader from "./TransactionsHeader";

function formatDate(dateString) {
  if (!dateString) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function getTransactionTitle(transaction) {
  return transaction.counterparty_name || transaction.description || transaction.transaction_type || "Transaction";
}

function getTransactionSubtitle(transaction) {
  return [
    transaction.transaction_type?.replaceAll("_", " "),
    transaction.counterparty_account,
    `Ref ${transaction.id?.slice?.(0, 8) || "N/A"}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className={`rounded-[26px] border p-5 ${tone}`}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] opacity-70">{label}</p>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ activeTab }) {
  const label =
    activeTab === "credit"
      ? "No cash in history yet."
      : activeTab === "debit"
        ? "No cash out history yet."
        : "No transactions recorded yet.";

  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Transaction History</p>
      <h3 className="mt-4 text-2xl font-semibold text-slate-950">{label}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Every posted cash in and cash out entry will appear here with amount, direction, reference details, and posting time.
      </p>
    </div>
  );
}

export default function TransactionsScreen({ setActiveScreen, account }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTransactions = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getTransactions();

        if (isMounted) {
          setTransactions(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load transaction history");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesTab = activeTab === "all" || transaction.direction === activeTab;
      const matchesSearch =
        !searchTerm ||
        [
          transaction.transaction_type,
          transaction.description,
          transaction.counterparty_name,
          transaction.counterparty_account,
          transaction.id,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchTerm));

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search, transactions]);

  const summary = useMemo(() => summarizeTransactions(transactions), [transactions]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TransactionsHeader
        setActiveScreen={setActiveScreen}
        summaryLabel={`${summary.totalCount} posted`}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            label="Total Cash In"
            value={formatCurrency(summary.totalInflow, account?.currency || "USD")}
            tone="border-emerald-200 bg-emerald-50 text-emerald-950"
          />
          <SummaryCard
            label="Total Cash Out"
            value={formatCurrency(summary.totalOutflow, account?.currency || "USD")}
            tone="border-rose-200 bg-rose-50 text-rose-950"
          />
        </div>

        <div className="mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Entries" },
                { key: "credit", label: "Cash In" },
                { key: "debit", label: "Cash Out" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                S
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by reference, type, name, or account"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-[24px] bg-slate-100" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
            ) : filteredTransactions.length === 0 ? (
              <EmptyState activeTab={activeTab} />
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                            transaction.direction === "credit"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {transaction.direction === "credit" ? "IN" : "OUT"}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-950">
                              {getTransactionTitle(transaction)}
                            </h3>
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-600">
                              Posted
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{getTransactionSubtitle(transaction)}</p>
                          <p className="mt-2 text-sm text-slate-500">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>

                      <div className="text-left lg:text-right">
                        <p
                          className={`text-lg font-semibold ${
                            transaction.direction === "credit" ? "text-emerald-700" : "text-slate-950"
                          }`}
                        >
                          {transaction.direction === "credit" ? "+" : "-"}
                          {formatCurrency(transaction.amount || 0, transaction.currency || account?.currency || "USD")}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {transaction.direction === "credit" ? "Cash in entry" : "Cash out entry"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
