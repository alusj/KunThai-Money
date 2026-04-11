import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  ReceiptText,
  Search,
  Share2,
  Wallet,
  X,
} from "lucide-react";

import { getTransactions, summarizeTransactions } from "../../../../Backend/services/transactionService";
import { normalizeCurrencyCode } from "../../../../Backend/utils/currency";
import { formatCurrency } from "../../../../Backend/utils/formatCurrency";
import TransactionsHeader from "./TransactionsHeader";

function formatDateTime(dateString) {
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

function formatDayLabel(dateString) {
  if (!dateString) {
    return "Unknown Day";
  }

  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const shortDate = date.toDateString();

  if (shortDate === today.toDateString()) {
    return "Today";
  }

  if (shortDate === yesterday.toDateString()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAmountCode(amount, currency = "SLL") {
  const normalizedCurrency = normalizeCurrencyCode(currency) || "SLL";
  const numericAmount = Number(amount || 0);

  return `${normalizedCurrency} ${numericAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function initialsFromName(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "KT"
  );
}

function resolveDirectionLabel(direction) {
  return direction === "credit" ? "Cash In" : "Cash Out";
}

function resolvePersonLabel(transaction) {
  return transaction.counterparty_name || transaction.description || transaction.transaction_type || "KunThai user";
}

function resolveReason(transaction) {
  return (
    transaction.metadata?.reason ||
    transaction.metadata?.note ||
    transaction.description ||
    "No note added"
  );
}

function resolveReference(transaction) {
  return (
    transaction.metadata?.reference_number ||
    transaction.metadata?.reference ||
    transaction.metadata?.transaction_reference ||
    transaction.id ||
    "Pending"
  );
}

function resolveTransactionId(transaction) {
  return (
    transaction.metadata?.transaction_id ||
    transaction.metadata?.sender_transaction_id ||
    transaction.metadata?.receiver_transaction_id ||
    transaction.id ||
    "Pending"
  );
}

function resolvePartyImage(transaction) {
  return (
    transaction.metadata?.counterparty_profile_image ||
    transaction.metadata?.sender_profile_image ||
    transaction.metadata?.recipient_profile_image ||
    ""
  );
}

function buildTransactionMessage(transaction) {
  const person = resolvePersonLabel(transaction);
  const amount = formatAmountCode(transaction.amount || 0, transaction.currency || "SLL");

  return transaction.direction === "credit"
    ? `You have received ${amount} from ${person}.`
    : `You have sent ${amount} to ${person}.`;
}

function deriveReceipt(transaction, account, profile) {
  const direction = transaction.direction === "credit" ? "credit" : "debit";
  const amount = Number(transaction.amount || 0);
  const currency = normalizeCurrencyCode(transaction.currency || account?.currency) || "SLL";
  const counterpartyName = resolvePersonLabel(transaction);
  const counterpartyAccount =
    transaction.counterparty_account ||
    transaction.metadata?.counterparty_account ||
    transaction.metadata?.sender_account_number ||
    transaction.metadata?.recipient_account_number ||
    "Unavailable";
  const transactionId = resolveTransactionId(transaction);
  const referenceId = resolveReference(transaction);
  const reason = resolveReason(transaction);
  const fee = Number(transaction.metadata?.transaction_fee || transaction.metadata?.fee || 0);
  const tax = Number(transaction.metadata?.tax_amount || transaction.metadata?.tax || 0);
  const netAmount = direction === "credit" ? amount : Math.max(amount + fee + tax, amount);
  const yourName =
    [
      profile?.first_name,
      profile?.middle_name,
      profile?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || "Your KunThai account";

  return {
    direction,
    receiptTitle: direction === "credit" ? "Cash In Receipt" : "Cash Out Receipt",
    introMessage: buildTransactionMessage(transaction),
    personName: counterpartyName,
    personImage: resolvePartyImage(transaction),
    personAccount: counterpartyAccount,
    amount,
    currency,
    dateTime: transaction.created_at,
    transactionId,
    referenceId,
    reason,
    fee,
    tax,
    netAmount,
    yourAccountNumber: account?.account_number || "Unavailable",
    yourName,
  };
}

function SummaryCard({ label, value, tone, caption }) {
  return (
    <div className={`rounded-[30px] border p-5 shadow-sm ${tone}`}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] opacity-70">{label}</p>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm opacity-75">{caption}</p>
    </div>
  );
}

function PartyAvatar({ name, image, tone = "slate" }) {
  if (image) {
    return <img src={image} alt={name} className="h-16 w-16 rounded-[24px] object-cover shadow-sm" />;
  }

  const tones =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-900 text-white";

  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-[24px] text-lg font-bold shadow-sm ${tones}`}>
      {initialsFromName(name)}
    </div>
  );
}

function ReceiptRow({ label, value, emphasized = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`max-w-[62%] text-right ${emphasized ? "text-lg font-bold text-slate-950" : "text-sm font-semibold text-slate-800"}`}>
        {value}
      </p>
    </div>
  );
}

function ReceiptSection({ eyebrow, title, children, tone = "bg-white border-slate-200" }) {
  return (
    <section className={`rounded-[28px] border p-5 ${tone}`}>
      {eyebrow ? <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p> : null}
      {title ? <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3> : null}
      <div className={title || eyebrow ? "mt-4" : ""}>{children}</div>
    </section>
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
    <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Transaction History</p>
      <h3 className="mt-4 text-2xl font-semibold text-slate-950">{label}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Every cash in and cash out receipt will appear here with a message preview, reference details, and time posted.
      </p>
    </div>
  );
}

function ReceiptView({ receipt, onBack }) {
  const handleShareReceipt = async () => {
    const shareText = [
      receipt.receiptTitle,
      receipt.introMessage,
      `Transaction ID: ${receipt.transactionId}`,
      `Reference ID: ${receipt.referenceId}`,
      `Date & Time: ${formatDateTime(receipt.dateTime)}`,
      `Reason: ${receipt.reason}`,
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: receipt.receiptTitle,
          text: shareText,
        });
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard?.writeText?.(shareText);
  };

  const handleDownloadReceipt = () => {
    const content = [
      receipt.receiptTitle,
      receipt.introMessage,
      `Amount: ${formatAmountCode(receipt.amount, receipt.currency)}`,
      `Date & Time: ${formatDateTime(receipt.dateTime)}`,
      `Transaction ID: ${receipt.transactionId}`,
      `Reference ID: ${receipt.referenceId}`,
      `Reason: ${receipt.reason}`,
      `Net Amount: ${formatAmountCode(receipt.netAmount, receipt.currency)}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt.receiptTitle.toLowerCase().replaceAll(" ", "-")}-${receipt.referenceId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
      <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            {resolveDirectionLabel(receipt.direction)}
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <ReceiptSection eyebrow="Top Section" title={receipt.receiptTitle} tone="border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#f8fafc_55%,#ffffff_100%)]">
              <div className="flex items-center gap-4">
                <PartyAvatar
                  name={receipt.personName}
                  image={receipt.personImage}
                  tone={receipt.direction === "credit" ? "emerald" : "slate"}
                />
                <div>
                  <p className="text-xl font-semibold text-slate-950">{receipt.personName}</p>
                  <p className="mt-1 text-sm text-slate-500">{receipt.personAccount}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{receipt.introMessage}</p>
                </div>
              </div>
            </ReceiptSection>

            <ReceiptSection eyebrow="Main Details" title="Receipt summary">
              <div className="divide-y divide-slate-100">
                <ReceiptRow
                  label={receipt.direction === "credit" ? "Amount received" : "Amount sent"}
                  value={formatAmountCode(receipt.amount, receipt.currency)}
                  emphasized
                />
                <ReceiptRow label="Date and time" value={formatDateTime(receipt.dateTime)} />
                <ReceiptRow label="Transaction ID" value={receipt.transactionId} />
                <ReceiptRow label="Reference ID" value={receipt.referenceId} />
              </div>
            </ReceiptSection>
          </div>

          <div className="space-y-5">
            <ReceiptSection eyebrow="Extra Details" title="Settlement breakdown" tone="border-slate-200 bg-slate-50">
              <div className="divide-y divide-slate-200">
                <ReceiptRow label="Reason / Note" value={receipt.reason} />
                <ReceiptRow label="Fee" value={formatAmountCode(receipt.fee, receipt.currency)} />
                <ReceiptRow label="Tax" value={formatAmountCode(receipt.tax, receipt.currency)} />
                <ReceiptRow
                  label={receipt.direction === "credit" ? "Net amount received" : "Net amount sent"}
                  value={formatAmountCode(receipt.netAmount, receipt.currency)}
                  emphasized
                />
              </div>
            </ReceiptSection>

            <ReceiptSection eyebrow="Account Context" title="Posting accounts">
              <div className="divide-y divide-slate-100">
                <ReceiptRow
                  label={receipt.direction === "credit" ? "Sender name" : "Recipient name"}
                  value={receipt.personName}
                />
                <ReceiptRow
                  label={receipt.direction === "credit" ? "Sender account" : "Recipient account"}
                  value={receipt.personAccount}
                />
                <ReceiptRow
                  label={receipt.direction === "credit" ? "Receiver account" : "Sender account"}
                  value={receipt.yourAccountNumber}
                />
              </div>
            </ReceiptSection>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleShareReceipt}
                className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Share2 size={16} />
                <span>Share receipt</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              <Download size={16} />
              <span>Download text copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsScreen({ setActiveScreen, account, profile }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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
          resolveReason(transaction),
          resolveReference(transaction),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm));

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search, transactions]);

  const summary = useMemo(() => summarizeTransactions(transactions), [transactions]);
  const selectedReceipt = useMemo(
    () => (selectedTransaction ? deriveReceipt(selectedTransaction, account, profile) : null),
    [selectedTransaction, account, profile]
  );
  const groupedTransactions = useMemo(() => {
    const groups = [];

    filteredTransactions.forEach((transaction) => {
      const label = formatDayLabel(transaction.created_at);
      const existingGroup = groups[groups.length - 1];

      if (existingGroup && existingGroup.label === label) {
        existingGroup.items.push(transaction);
        return;
      }

      groups.push({ label, items: [transaction] });
    });

    return groups;
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eefbf4_0%,#f8fafc_42%,#f8fafc_100%)]">
      <TransactionsHeader
        setActiveScreen={setActiveScreen}
        summaryLabel={selectedReceipt ? resolveDirectionLabel(selectedReceipt.direction) : `${summary.totalCount} posted`}
      />

      {selectedReceipt ? (
        <ReceiptView receipt={selectedReceipt} onBack={() => setSelectedTransaction(null)} />
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr_1.05fr]">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">History Tone</p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">Clear messages, cleaner receipts</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Each transaction now reads like a real notification. Open any row to see the full cash in or cash out receipt.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Cash In", "Cash Out", "Reference", "Shareable"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <SummaryCard
              label="Total Cash In"
              value={formatCurrency(summary.totalInflow, account?.currency || "SLL")}
              caption="All incoming transfers posted to this account."
              tone="border-emerald-200 bg-emerald-50 text-emerald-950"
            />
            <SummaryCard
              label="Total Cash Out"
              value={formatCurrency(summary.totalOutflow, account?.currency || "SLL")}
              caption="All outgoing transfers and wallet disbursements."
              tone="border-sky-200 bg-sky-50 text-sky-950"
            />
          </div>

          <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
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

              <label className="relative block w-full lg:max-w-md">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, note, account, transaction ID, or reference"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                />
              </label>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-28 animate-pulse rounded-[26px] bg-slate-100" />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
              ) : filteredTransactions.length === 0 ? (
                <EmptyState activeTab={activeTab} />
              ) : (
                <div className="space-y-6">
                  {groupedTransactions.map((group) => (
                    <div key={group.label}>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200" />
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                          {group.label}
                        </p>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>

                      <div className="space-y-3">
                        {group.items.map((transaction) => {
                          const isCashIn = transaction.direction === "credit";
                          const amount = formatAmountCode(transaction.amount || 0, transaction.currency || account?.currency || "SLL");
                          const note = resolveReason(transaction);
                          const reference = resolveReference(transaction);

                          return (
                            <button
                              key={transaction.id}
                              type="button"
                              onClick={() => setSelectedTransaction(transaction)}
                              className="block w-full rounded-[28px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex items-start gap-4">
                                  <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-[22px] ${
                                      isCashIn ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                                    }`}
                                  >
                                    {isCashIn ? <Wallet size={22} /> : <ArrowUpRight size={22} />}
                                  </div>

                                  <div className="max-w-2xl">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${
                                          isCashIn
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-sky-100 text-sky-700"
                                        }`}
                                      >
                                        {isCashIn ? "Cash In" : "Cash Out"}
                                      </span>
                                      <span className="rounded-full bg-slate-200 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                        Posted
                                      </span>
                                    </div>

                                    <h3 className="mt-3 text-lg font-semibold leading-7 text-slate-950">
                                      {buildTransactionMessage(transaction)}
                                    </h3>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                                      <span className="inline-flex items-center gap-2">
                                        <Clock3 size={14} />
                                        {formatDateTime(transaction.created_at)}
                                      </span>
                                      <span className="inline-flex items-center gap-2">
                                        <ReceiptText size={14} />
                                        Ref {String(reference).slice(0, 12)}
                                      </span>
                                      <span className="inline-flex items-center gap-2">
                                        <CheckCircle2 size={14} />
                                        Tap to open receipt
                                      </span>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-slate-500">
                                      {note}
                                    </p>
                                  </div>
                                </div>

                                <div className="shrink-0 text-left lg:text-right">
                                  <p className={`text-xl font-semibold ${isCashIn ? "text-emerald-700" : "text-slate-950"}`}>
                                    {isCashIn ? "+" : "-"}
                                    {amount}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">{resolvePersonLabel(transaction)}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
