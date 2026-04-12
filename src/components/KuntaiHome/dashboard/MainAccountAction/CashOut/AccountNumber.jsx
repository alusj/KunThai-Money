import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Hash,
  Loader2,
  ReceiptText,
  SendHorizonal,
  Share2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import AuthNotice from "../../../../auth/AuthNotice";
import {
  createAccountTransfer,
  getAccountTransferRecipient,
} from "../../../../../Backend/services/transferService";
import { formatCurrency } from "../../../../../Backend/utils/formatCurrency";
import { normalizeCurrencyCode } from "../../../../../Backend/utils/currency";

const INITIAL_FORM = {
  accountNumber: "",
  amount: "",
  reason: "",
};

function paymentMethodLabel(accountType) {
  switch (accountType) {
    case "main":
      return "Main Account";
    case "business":
      return "Business Account";
    default:
      return "Wallet Account";
  }
}

function resolveErrorMessage(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string") {
    return error || fallback;
  }

  const message = error.message || error.error_description || error.details || fallback;

  if (/function\s+crypt\(text,\s*text\)\s+does\s+not\s+exist/i.test(message)) {
    return "Transaction PIN verification is not ready in this database yet. Run the PIN security SQL fix in Supabase, then try again.";
  }

  if (/function\s+gen_random_bytes\(integer\)\s+does\s+not\s+exist/i.test(message)) {
    return "Transfer reference generation is not ready in this database yet. Re-run the PIN security SQL fix in Supabase, then try again.";
  }

  return message;
}

function initialsFromName(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "RC"
  );
}

function ReceiptRow({ label, value, emphasized = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-right ${emphasized ? "text-lg font-bold text-slate-950" : "text-sm font-semibold text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "processing" || status === "pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  const label =
    status === "completed"
      ? "Success"
      : status === "processing" || status === "pending"
        ? "Pending"
        : "Failed";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}>{label}</span>;
}

function RecipientAvatar({ name, image }) {
  if (image) {
    return <img src={image} alt={name} className="h-16 w-16 rounded-full object-cover" />;
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-lg font-bold text-white">
      {initialsFromName(name)}
    </div>
  );
}

export default function AccountNumber({ account, onClose, refreshAccount }) {
  const currency = normalizeCurrencyCode(account?.currency) || "SLL";
  const availableBalance = Number(account?.balance || 0);
  const [step, setStep] = useState("form");
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [isCheckingRecipient, setIsCheckingRecipient] = useState(false);
  const [isPreparingPin, setIsPreparingPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pin, setPin] = useState("");
  const [recipientLookup, setRecipientLookup] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const numericAmount = Number(form.amount);
  const transactionFee = 0;
  const taxAmount = 0;
  const totalAmount = Number.isFinite(numericAmount) && numericAmount > 0 ? Number(numericAmount.toFixed(2)) : 0;

  useEffect(() => {
    const trimmedAccountNumber = form.accountNumber.trim();

    if (!trimmedAccountNumber || trimmedAccountNumber.length < 8 || !account?.id) {
      setRecipientLookup(null);
      setIsCheckingRecipient(false);
      return undefined;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setIsCheckingRecipient(true);

      try {
        const result = await getAccountTransferRecipient({
          sourceAccountId: account.id,
          recipientAccountNumber: trimmedAccountNumber,
        });

        if (isActive) {
          setRecipientLookup(result);
        }
      } catch (lookupError) {
        if (isActive) {
          setRecipientLookup({
            is_valid: false,
            message:
              lookupError instanceof Error ? lookupError.message : "Recipient account could not be verified.",
          });
        }
      } finally {
        if (isActive) {
          setIsCheckingRecipient(false);
        }
      }
    }, 450);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.accountNumber, account?.id]);

  const recipientStateIcon = useMemo(() => {
    if (isCheckingRecipient) {
      return <Loader2 size={18} className="animate-spin text-slate-400" />;
    }

    if (recipientLookup?.is_valid) {
      return <CheckCircle2 size={18} className="text-emerald-600" />;
    }

    if (recipientLookup && recipientLookup.is_valid === false) {
      return <XCircle size={18} className="text-rose-600" />;
    }

    return null;
  }, [isCheckingRecipient, recipientLookup]);

  const canVerify =
    Boolean(recipientLookup?.is_valid) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    numericAmount <= availableBalance;

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");

    if (field === "accountNumber") {
      setRecipientLookup(null);
    }
  };

  const handleVerify = () => {
    if (!recipientLookup?.is_valid) {
      setError("Enter a valid recipient account number.");
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid transfer amount.");
      return;
    }

    if (numericAmount > availableBalance) {
      setError("Amount exceeds your available balance.");
      return;
    }

    setStep("confirm");
  };

  const handleConfirm = async () => {
    setIsPreparingPin(true);
    setError("");

    await new Promise((resolve) => window.setTimeout(resolve, 350));

    setIsPreparingPin(false);
    setStep("pin");
  };

  const handlePinSubmit = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError("Enter your 6-digit transaction PIN.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const transfer = await createAccountTransfer({
        sourceAccountId: account?.id,
        recipientAccountNumber: form.accountNumber.trim(),
        amount: numericAmount,
        reason: form.reason.trim(),
        pin,
        metadata: {
          flow: "dashboard_account_number_transfer",
        },
      });

      await refreshAccount?.();

      setReceipt({
        status: transfer?.status || "completed",
        recipientName: transfer?.recipient_name || recipientLookup?.recipient_name || form.accountNumber.trim(),
        recipientProfileImage: recipientLookup?.recipient_profile_image || "",
        recipientAccountNumber: transfer?.recipient_account_number || form.accountNumber.trim(),
        transactionId: transfer?.sender_transaction_id || transfer?.id || "Pending",
        referenceNumber: transfer?.reference_number || transfer?.id || "Pending",
        amount: Number(transfer?.amount ?? numericAmount),
        taxAmount: Number(transfer?.tax_amount ?? taxAmount),
        transactionFee: Number(transfer?.transaction_fee ?? transactionFee),
        totalAmount: Number(transfer?.total_amount ?? totalAmount),
        reason: transfer?.reason || form.reason.trim() || "No note added",
        createdAt: transfer?.completed_at || transfer?.created_at || new Date().toISOString(),
        senderAccountNumber: transfer?.source_account_number || account?.account_number || "Pending",
        paymentMethod: paymentMethodLabel(transfer?.source_account_type || account?.account_type),
      });
      setStep("receipt");
      setPin("");
    } catch (submitError) {
      setError(resolveErrorMessage(submitError, "The transfer could not be completed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!receipt) {
      return;
    }

    const content = [
      "KunThai Money Transaction Receipt",
      `Status: ${receipt.status}`,
      `Recipient: ${receipt.recipientName}`,
      `Account Number: ${receipt.recipientAccountNumber}`,
      `Transaction ID: ${receipt.transactionId}`,
      `Reference Number: ${receipt.referenceNumber}`,
      `Amount: ${formatCurrency(receipt.amount, currency)}`,
      `Tax: ${formatCurrency(receipt.taxAmount, currency)}`,
      `Fee: ${formatCurrency(receipt.transactionFee, currency)}`,
      `Total: ${formatCurrency(receipt.totalAmount, currency)}`,
      `Reason: ${receipt.reason}`,
      `Date & Time: ${new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(receipt.createdAt))}`,
      `Sender Account: ${receipt.senderAccountNumber}`,
      `Payment Method: ${receipt.paymentMethod}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${receipt.referenceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareReceipt = async () => {
    if (!receipt) {
      return;
    }

    const shareText = [
      "KunThai Money Transaction Receipt",
      `Recipient: ${receipt.recipientName}`,
      `Amount: ${formatCurrency(receipt.amount, currency)}`,
      `Transaction ID: ${receipt.transactionId}`,
      `Reference Number: ${receipt.referenceNumber}`,
      `Status: ${receipt.status}`,
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Transaction Receipt",
          text: shareText,
        });
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard?.writeText?.(shareText);
  };

  const handleReset = () => {
    setStep("form");
    setForm(INITIAL_FORM);
    setPin("");
    setError("");
    setRecipientLookup(null);
    setReceipt(null);
  };

  if (step === "receipt" && receipt) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Transaction Receipt</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold text-slate-950">Receipt details</h3>
            <StatusBadge status={receipt.status} />
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-4">
              <RecipientAvatar name={receipt.recipientName} image={receipt.recipientProfileImage} />
              <div>
                <p className="text-base font-semibold text-slate-950">{receipt.recipientName}</p>
                <p className="mt-1 text-sm text-slate-500">{receipt.recipientAccountNumber}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="divide-y divide-slate-100">
              <ReceiptRow label="Transaction ID" value={receipt.transactionId} />
              <ReceiptRow label="Amount" value={formatCurrency(receipt.amount, currency)} />
              <ReceiptRow label="Tax" value={formatCurrency(receipt.taxAmount, currency)} />
              <ReceiptRow label="Fee" value={formatCurrency(receipt.transactionFee, currency)} />
              <ReceiptRow label="Reason" value={receipt.reason} />
              <ReceiptRow label="TOTAL" value={formatCurrency(receipt.totalAmount, currency)} emphasized />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Extra Details</p>
            <div className="mt-3 divide-y divide-slate-200">
              <ReceiptRow
                label="Date & Time"
                value={new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(receipt.createdAt))}
              />
              <ReceiptRow label="Sender Account" value={receipt.senderAccountNumber} />
              <ReceiptRow label="Reference Number" value={receipt.referenceNumber} />
              <ReceiptRow label="Payment Method" value={receipt.paymentMethod} />
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handleShareReceipt}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Share2 size={16} />
              <span>Share Receipt</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "pin") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setStep("confirm")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="mb-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Transaction PIN</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">Enter your PIN</h3>
          <p className="mt-2 text-sm text-slate-500">Enter the correct transaction PIN to complete this transfer securely.</p>
        </div>

        {error ? (
          <div className="mb-4">
            <AuthNotice tone="danger" title="PIN check failed">
              {error}
            </AuthNotice>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Transaction PIN</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength="6"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
            placeholder="Enter 6-digit PIN"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          />
        </label>

        <button
          type="button"
          onClick={handlePinSubmit}
          disabled={isSubmitting}
          className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
            isSubmitting ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
          }`}
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>{isSubmitting ? "Processing..." : "Submit PIN"}</span>
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>

        <div className="mb-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Confirm Transaction</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">Review before you continue</h3>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Recipient Details</p>
            <div className="mt-4 flex items-center gap-4">
              <RecipientAvatar
                name={recipientLookup?.recipient_name || form.accountNumber.trim()}
                image={recipientLookup?.recipient_profile_image}
              />
              <div>
                <p className="text-base font-semibold text-slate-950">{recipientLookup?.recipient_name}</p>
                <p className="mt-1 text-sm text-slate-500">{form.accountNumber.trim()}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Transaction Details</p>
            <div className="mt-3 divide-y divide-slate-100">
              <ReceiptRow label="Amount" value={formatCurrency(numericAmount || 0, currency)} />
              <ReceiptRow label="Tax" value={formatCurrency(taxAmount, currency)} />
              <ReceiptRow label="Transaction Fee" value={formatCurrency(transactionFee, currency)} />
              <ReceiptRow label="Reason" value={form.reason.trim() || "No note added"} />
              <ReceiptRow label="TOTAL" value={formatCurrency(totalAmount, currency)} emphasized />
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPreparingPin}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                isPreparingPin ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
              }`}
            >
              {isPreparingPin ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>{isPreparingPin ? "Opening PIN..." : "Confirm"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
            <Wallet size={18} />
          </span>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">Available Balance</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(availableBalance, currency)}</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4">
          <AuthNotice tone="danger" title="Transfer could not continue">
            {error}
          </AuthNotice>
        </div>
      ) : null}

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <Hash size={14} />
            Account Number
          </span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <input
              type="text"
              inputMode="numeric"
              value={form.accountNumber}
              onChange={(event) => handleChange("accountNumber", event.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="Enter recipient account number"
              className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
            />
            {recipientStateIcon}
          </div>
          <p className={`mt-2 text-xs ${recipientLookup?.is_valid ? "text-emerald-600" : recipientLookup ? "text-rose-600" : "text-slate-400"}`}>
            {recipientLookup?.message || "We will validate the account number automatically."}
          </p>
          {recipientLookup?.is_valid ? (
            <p className="mt-1 text-sm font-semibold text-slate-900">{recipientLookup.recipient_name}</p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <ReceiptText size={14} />
            Amount
          </span>
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <span className="text-sm font-semibold text-slate-500">{currency}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => handleChange("amount", event.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason</span>
          <textarea
            rows="3"
            value={form.reason}
            onChange={(event) => handleChange("reason", event.target.value)}
            placeholder="Optional note for this transfer"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          />
        </label>

        <button
          type="button"
          onClick={handleVerify}
          disabled={!canVerify}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
            canVerify ? "bg-slate-950 hover:bg-slate-800" : "bg-slate-400"
          }`}
        >
          <SendHorizonal size={16} />
          <span>Verify</span>
        </button>
      </div>
    </div>
  );
}
