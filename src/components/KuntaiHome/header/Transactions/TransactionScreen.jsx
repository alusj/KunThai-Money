import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Clock3, Download, Search, Share2, Wallet, X } from "lucide-react";

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

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
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

function resolvePersonLabel(transaction) {
  if (transaction.direction === "credit") {
    return (
      transaction.metadata?.sender_name ||
      transaction.counterparty_name ||
      transaction.description ||
      transaction.transaction_type ||
      "KunThai user"
    );
  }

  return (
    transaction.metadata?.recipient_name ||
    transaction.counterparty_name ||
    transaction.description ||
    transaction.transaction_type ||
    "KunThai user"
  );
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
  if (transaction.direction === "credit") {
    return (
      transaction.metadata?.sender_profile_image ||
      transaction.metadata?.counterparty_profile_image ||
      ""
    );
  }

  return (
    transaction.metadata?.recipient_profile_image ||
    transaction.metadata?.counterparty_profile_image ||
    ""
  );
}

function resolvePartyAccount(transaction) {
  if (transaction.direction === "credit") {
    return (
      transaction.metadata?.sender_account_number ||
      transaction.counterparty_account ||
      transaction.metadata?.counterparty_account ||
      "Unavailable"
    );
  }

  return (
    transaction.metadata?.recipient_account_number ||
    transaction.counterparty_account ||
    transaction.metadata?.counterparty_account ||
    "Unavailable"
  );
}

function buildTransactionMessage(transaction) {
  const person = resolvePersonLabel(transaction);
  const amount = formatAmountCode(transaction.amount || 0, transaction.currency || "SLL");

  return transaction.direction === "credit"
    ? `You have received ${amount} from ${person}.`
    : `You have sent ${amount} to ${person}.`;
}

function deriveReceipt(transaction, account) {
  const direction = transaction.direction === "credit" ? "credit" : "debit";
  const amount = Number(transaction.amount || 0);
  const currency = normalizeCurrencyCode(transaction.currency || account?.currency) || "SLL";

  return {
    direction,
    title: direction === "credit" ? "Cash in Receipt:" : "Cash Out Receipt:",
    personName: resolvePersonLabel(transaction),
    personImage: resolvePartyImage(transaction),
    personAccount: resolvePartyAccount(transaction),
    amount,
    currency,
    dateTime: transaction.created_at,
    transactionId: resolveTransactionId(transaction),
    referenceId: resolveReference(transaction),
    reason: resolveReason(transaction),
    fee: Number(transaction.metadata?.transaction_fee || transaction.metadata?.fee || 0),
    tax: Number(transaction.metadata?.tax_amount || transaction.metadata?.tax || 0),
    totalSent:
      direction === "debit"
        ? Number(transaction.metadata?.total_amount || amount + Number(transaction.metadata?.transaction_fee || 0) + Number(transaction.metadata?.tax_amount || 0))
        : amount,
  };
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
        Your cash in and cash out records will appear here with time, amount, and receipt details.
      </p>
    </div>
  );
}

function ReceiptAvatar({ name, image, direction }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (image && !imageFailed) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setImageFailed(true)}
        className="h-16 w-16 rounded-[22px] object-cover shadow-sm"
      />
    );
  }

  return (
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-[22px] text-xl font-bold shadow-sm ${
        direction === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-slate-950 text-white"
      }`}
    >
      {initialsFromName(name)}
    </div>
  );
}

async function renderReceiptImage(receiptElement) {
  const rect = receiptElement.getBoundingClientRect();
  const clone = receiptElement.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(rect.width)}" height="${Math.ceil(rect.height)}">
      <foreignObject width="100%" height="100%">${markup}</foreignObject>
    </svg>
  `;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(rect.width * 2);
    canvas.height = Math.ceil(rect.height * 2);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not supported.");
    }

    context.scale(2, 2);
    context.drawImage(image, 0, 0, rect.width, rect.height);

    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!pngBlob) {
      throw new Error("Receipt image could not be generated.");
    }

    return pngBlob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ReceiptRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`max-w-[64%] text-right ${strong ? "text-lg font-bold text-slate-950" : "text-sm font-semibold text-slate-950"}`}>
        {value}
      </p>
    </div>
  );
}

function ReceiptDivider() {
  return <div className="h-px bg-slate-200" />;
}

function ReceiptView({ receipt, onBack }) {
  const receiptRef = useRef(null);

  const handleShareReceipt = async () => {
    if (!receiptRef.current) {
      return;
    }

    try {
      const imageBlob = await renderReceiptImage(receiptRef.current);
      const file = new File(
        [imageBlob],
        `${receipt.title.toLowerCase().replaceAll(" ", "-").replaceAll(":", "")}-${receipt.referenceId}.png`,
        { type: "image/png" }
      );

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: receipt.title,
          files: [file],
        });
        return;
      }

      const url = URL.createObjectURL(imageBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      await navigator.clipboard?.writeText?.(
        [
          receipt.title,
          `Amount: ${formatAmountCode(receipt.amount, receipt.currency)}`,
          `Date: ${formatDateTime(receipt.dateTime)}`,
          `Reference: ${receipt.referenceId}`,
        ].join("\n")
      );
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) {
      return;
    }

    const imageBlob = await renderReceiptImage(receiptRef.current);
    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt.title.toLowerCase().replaceAll(" ", "-").replaceAll(":", "")}-${receipt.referenceId}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
      <div
        ref={receiptRef}
        className={`rounded-[34px] border p-5 shadow-sm md:p-7 ${
          receipt.direction === "credit"
            ? "border-emerald-200 bg-[linear-gradient(180deg,#f3fdf7_0%,#ffffff_58%)]"
            : "border-sky-200 bg-[linear-gradient(180deg,#f4faff_0%,#ffffff_58%)]"
        }`}
      >
        <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 md:p-6">
          <h2 className="text-3xl font-semibold text-slate-950">{receipt.title}</h2>

          <div className="mt-6 flex items-center gap-4">
            <ReceiptAvatar name={receipt.personName} image={receipt.personImage} direction={receipt.direction} />
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-slate-950">{receipt.personName}</p>
              <p className="mt-1 text-base font-semibold text-slate-950">{receipt.personAccount}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <ReceiptDivider />
            <ReceiptRow
              label={receipt.direction === "credit" ? "Amount Received:" : "Amount sent:"}
              value={formatAmountCode(receipt.amount, receipt.currency)}
              strong
            />
            <ReceiptRow label="Date and Time:" value={formatDateTime(receipt.dateTime)} />
            <ReceiptRow label="Transaction ID:" value={receipt.transactionId} />
            <ReceiptRow label="Reference ID:" value={receipt.referenceId} />
            <ReceiptRow label="Note/Reason:" value={receipt.reason} />

            {receipt.direction === "debit" ? (
              <>
                <ReceiptDivider />
                <ReceiptRow label="Transaction Fees:" value={formatAmountCode(receipt.fee, receipt.currency)} />
                <ReceiptRow label="Tax:" value={formatAmountCode(receipt.tax, receipt.currency)} />
                <ReceiptDivider />
                <ReceiptRow label="Total Sent:" value={formatAmountCode(receipt.totalSent, receipt.currency)} strong />
              </>
            ) : null}

            <ReceiptDivider />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={handleShareReceipt}
          className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadReceipt}
          className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
        >
          <Download size={16} />
          <span>Download</span>
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <X size={16} />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
}

export default function TransactionsScreen({ setActiveScreen, account }) {
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
          resolveReference(transaction),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm));

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search, transactions]);

  const summary = useMemo(() => summarizeTransactions(transactions), [transactions]);
  const todaySummary = useMemo(() => {
    const today = new Date().toDateString();

    return summarizeTransactions(
      transactions.filter((transaction) => new Date(transaction.created_at).toDateString() === today)
    );
  }, [transactions]);
  const selectedReceipt = useMemo(
    () => (selectedTransaction ? deriveReceipt(selectedTransaction, account) : null),
    [selectedTransaction, account]
  );

  const groupedTransactions = useMemo(() => {
    const groups = [];

    filteredTransactions.forEach((transaction) => {
      const label = formatDayLabel(transaction.created_at);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.label === label) {
        lastGroup.items.push(transaction);
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
        summaryLabel={selectedReceipt ? (selectedReceipt.direction === "credit" ? "Cash In" : "Cash Out") : `${summary.totalCount} posted`}
      />

      {selectedReceipt ? (
        <ReceiptView receipt={selectedReceipt} onBack={() => setSelectedTransaction(null)} />
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] opacity-70">Total Cash In Today</p>
              <p className="mt-4 text-3xl font-semibold">+{formatCurrency(todaySummary.totalInflow, account?.currency || "SLL")}</p>
            </div>
            <div className="rounded-[30px] border border-sky-200 bg-sky-50 p-5 text-sky-950 shadow-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] opacity-70">Total Cash Out Today</p>
              <p className="mt-4 text-3xl font-semibold">-{formatCurrency(todaySummary.totalOutflow, account?.currency || "SLL")}</p>
            </div>
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
                  placeholder="Search by name, account, transaction ID, or reference"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                />
              </label>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-[26px] bg-slate-100" />
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
                          const signedAmount = `${isCashIn ? "+" : "-"}${formatAmountCode(
                            transaction.amount || 0,
                            transaction.currency || account?.currency || "SLL"
                          )}`;

                          return (
                            <button
                              key={transaction.id}
                              type="button"
                              onClick={() => setSelectedTransaction(transaction)}
                              className="block w-full rounded-[28px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-start gap-4">
                                  <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${
                                      isCashIn ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                                    }`}
                                  >
                                    {isCashIn ? <Wallet size={20} /> : <ArrowUpRight size={20} />}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-base font-semibold leading-7 text-slate-950">
                                      {buildTransactionMessage(transaction)}
                                    </p>
                                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                                      <Clock3 size={14} />
                                      {formatDateTime(transaction.created_at)}
                                    </p>
                                  </div>
                                </div>

                                <p className={`shrink-0 text-lg font-semibold ${isCashIn ? "text-emerald-700" : "text-slate-950"}`}>
                                  {signedAmount}
                                </p>
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
