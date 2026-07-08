import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Clock3, ReceiptText, Search, Share2, Wallet, X } from "lucide-react";

import { getTransactions, summarizeTransactions } from "../../../../Backend/services/transactionService";
import { normalizeCurrencyCode } from "../../../../Backend/utils/currency";
import { formatCurrency } from "../../../../Backend/utils/formatCurrency";
import {
  buildServiceReceiptModel,
  getTransactionSubject,
  resolveServiceCounterpartyName,
  resolveTransactionReason,
} from "../../../../Backend/utils/serviceTransactions";
import {
  createReceiptPdfBlob,
  renderReceiptImage,
} from "../../dashboard/MainAccountAction/CashOut/receiptExport";
import TransactionsHeader from "./TransactionsHeader";

const ALL_ENTRIES_ONLY_FLOWS = new Set([
  "merchant_payment",
  "agent_transfer",
  "hotel_payment",
  "school_payment",
  "restaurant_payment",
  "supermarket_payment",
  "pharmacy_payment",
  "insurance_payment",
  "donation_payment",
]);

function isAllEntriesOnlyTransaction(transaction) {
  return ALL_ENTRIES_ONLY_FLOWS.has(transaction?.metadata?.flow);
}

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

function resolveProfileName(profile) {
  const fullName = [profile?.first_name, profile?.middle_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "";
}

function resolvePersonLabel(transaction, account, profile) {
  const profileName = resolveProfileName(profile);

  if (transaction.direction === "credit") {
    return (
      transaction.metadata?.sender_name ||
      transaction.counterparty_name ||
      profileName ||
      transaction.description ||
      transaction.transaction_type ||
                      "KunTai user"
    );
  }

  return (
    transaction.metadata?.recipient_name ||
    transaction.counterparty_name ||
    profileName ||
    transaction.description ||
    transaction.transaction_type ||
                      "KunTai user"
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
    transaction.metadata?.payment_reference ||
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

function resolvePartyImage(transaction, profile) {
  if (transaction.direction === "credit") {
    return (
      transaction.metadata?.sender_profile_image ||
      transaction.metadata?.counterparty_profile_image ||
      profile?.profile_image ||
      ""
    );
  }

  return (
    transaction.metadata?.recipient_profile_image ||
    transaction.metadata?.counterparty_profile_image ||
    profile?.profile_image ||
    ""
  );
}

function resolvePartyAccount(transaction, account) {
  if (transaction.direction === "credit") {
    return (
      transaction.metadata?.sender_account_number ||
      transaction.counterparty_account ||
      transaction.metadata?.counterparty_account ||
      account?.account_number ||
      "Unavailable"
    );
  }

  return (
      transaction.metadata?.recipient_account_number ||
      transaction.counterparty_account ||
      transaction.metadata?.counterparty_account ||
      account?.account_number ||
      "Unavailable"
    );
}

function buildTransactionMessage(transaction, account, profile) {
  const subject = getTransactionSubject(transaction);
  if (subject) {
    const party = resolveServiceCounterpartyName(transaction) || resolvePersonLabel(transaction, account, profile);
    const amount = formatAmountCode(transaction.amount || 0, transaction.currency || "SLL");
    return `${subject} with ${party} for ${amount}.`;
  }

  const person = resolvePersonLabel(transaction, account, profile);
  const amount = formatAmountCode(transaction.amount || 0, transaction.currency || "SLL");

  return transaction.direction === "credit"
    ? `You have received ${amount} from ${person}.`
    : `You have sent ${amount} to ${person}.`;
}

function deriveReceipt(transaction, account, profile) {
  const serviceReceipt = buildServiceReceiptModel(transaction, {
    personName: resolvePersonLabel(transaction, account, profile),
    personImage: resolvePartyImage(transaction, profile),
    personAccount: resolvePartyAccount(transaction, account),
  });

  if (getTransactionSubject(transaction)) {
    return serviceReceipt;
  }

  const direction = transaction.direction === "credit" ? "credit" : "debit";
  const amount = Number(transaction.amount || 0);
  const currency = normalizeCurrencyCode(transaction.currency || account?.currency) || "SLL";

  return {
    ...serviceReceipt,
    direction,
    title: direction === "credit" ? "Cash In Receipt" : "Cash Out Receipt",
    subject: direction === "credit" ? "Cash In Transaction" : "Cash Out Transaction",
    amount,
    currency,
    reason: resolveReason(transaction),
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
  const [sharePickerOpen, setSharePickerOpen] = useState(false);

  const fileBaseName = `${receipt.title.toLowerCase().replaceAll(" ", "-").replaceAll(":", "")}-${receipt.referenceId}`;

  const saveReceiptFile = (blob, extension) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBaseName}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildReceiptFile = async (format) => {
    const blob =
      format === "pdf"
        ? await createReceiptPdfBlob(receiptRef.current)
        : await renderReceiptImage(receiptRef.current);
    const extension = format === "pdf" ? "pdf" : "png";
    const mimeType = format === "pdf" ? "application/pdf" : "image/png";

    return {
      blob,
      extension,
      file: new File([blob], `${fileBaseName}.${extension}`, { type: mimeType }),
    };
  };

  const handleShareReceipt = async () => {
    if (!receiptRef.current) {
      return;
    }

    try {
      const [imageAsset, pdfAsset] = await Promise.all([
        buildReceiptFile("image"),
        buildReceiptFile("pdf"),
      ]);

      const shareFiles = [imageAsset.file, pdfAsset.file];

      if (navigator.share && navigator.canShare?.({ files: shareFiles })) {
        await navigator.share({
          title: receipt.title,
          files: shareFiles,
        });
        setSharePickerOpen(false);
        return;
      }
    } catch {
      // Fall through to manual save options below.
    }

    setSharePickerOpen(true);
  };

  const handleShareReceiptFile = async (format) => {
    if (!receiptRef.current) {
      return;
    }

    try {
      const { blob, extension, file } = await buildReceiptFile(format);

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: receipt.title,
          files: [file],
        });
        setSharePickerOpen(false);
        return;
      }

      saveReceiptFile(blob, extension);
      setSharePickerOpen(false);
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
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">{receipt.subject}</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">{receipt.title}</h2>

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
              label={receipt.direction === "credit" ? "Amount Received:" : "Amount Sent:"}
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

      {sharePickerOpen ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleShareReceiptFile("image")}
            className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Share2 size={16} />
            <span>Share as Image</span>
          </button>
          <button
            type="button"
            onClick={() => handleShareReceiptFile("pdf")}
            className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ReceiptText size={16} />
            <span>Share as PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setSharePickerOpen(false)}
            className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            <X size={16} />
            <span>Close Share</span>
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
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

export default function TransactionsScreen({
  setActiveScreen,
  account,
  profile,
  initialSelectedTransactionId = null,
  onReceiptOpened,
}) {
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
      const matchesTab =
        activeTab === "all" ||
        (transaction.direction === activeTab && !isAllEntriesOnlyTransaction(transaction));
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
      transactions.filter(
        (transaction) =>
          new Date(transaction.created_at).toDateString() === today && !isAllEntriesOnlyTransaction(transaction)
      )
    );
  }, [transactions]);
  const selectedReceipt = useMemo(
    () => (selectedTransaction ? deriveReceipt(selectedTransaction, account, profile) : null),
    [selectedTransaction, account, profile]
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

  useEffect(() => {
    if (!initialSelectedTransactionId || !transactions.length) {
      return;
    }

    const matchingTransaction = transactions.find(
      (transaction) => String(transaction.id) === String(initialSelectedTransactionId)
    );

    if (matchingTransaction) {
      setSelectedTransaction(matchingTransaction);
      onReceiptOpened?.();
    }
  }, [initialSelectedTransactionId, onReceiptOpened, transactions]);

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
              <div className="grid w-full grid-cols-3 gap-2 lg:max-w-xl">
                {[
                  { key: "all", label: "All Entries" },
                  { key: "credit", label: "Cash In" },
                  { key: "debit", label: "Cash Out" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full rounded-full px-2 py-3 text-center text-sm font-semibold transition ${
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
                                      {buildTransactionMessage(transaction, account, profile)}
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
