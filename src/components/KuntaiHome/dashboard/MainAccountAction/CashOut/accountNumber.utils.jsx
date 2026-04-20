import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export const INITIAL_FORM = {
  accountNumber: "",
  amount: "",
  reason: "",
};

export function paymentMethodLabel(accountType) {
  switch (accountType) {
    case "main":
      return "Main Account";
    case "business":
      return "Business Account";
    default:
      return "Wallet Account";
  }
}

export function resolveErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error || fallback;

  const message = error.message || error.error_description || error.details || fallback;

  if (/function\s+crypt\(text,\s*text\)\s+does\s+not\s+exist/i.test(message)) {
    return "PIN verification is not ready in this database yet. Run the PIN security SQL fix in Supabase, then try again.";
  }

  if (/function\s+gen_random_bytes\(integer\)\s+does\s+not\s+exist/i.test(message)) {
    return "Transfer reference generation is not ready in this database yet. Re-run the PIN security SQL fix in Supabase, then try again.";
  }

  if (/column\s+"?reference_number"?\s+does\s+not\s+exist/i.test(message)) {
    return "The transfer table in this database is missing the new reference fields. Run the account transfer schema repair SQL in Supabase, then try again.";
  }

  if (/column\s+"?balance"?\s+does\s+not\s+exist/i.test(message)) {
    return "Wallet conversion is not fully enabled in this database yet. Run the latest own-wallet conversion SQL in Supabase so other accounts get a balance column, then try again.";
  }

  if (/transactions_transaction_type_check/i.test(message) || /violates check constraint.*transaction_type/i.test(message)) {
    return "The transactions table in this database is using an older allowed-type list. Run the transactions schema repair SQL in Supabase, then try again.";
  }

  return message;
}

export function resolvePinBannerTitle(message = "") {
  if (
    /incorrect transaction pin/i.test(message) ||
    /transaction pin/i.test(message) ||
    /pin/i.test(message)
  ) {
    return "PIN check failed";
  }
  return "Transfer setup issue";
}

export function initialsFromName(name = "") {
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

export function formatExchangeNumber(value) {
  const numericValue = Number(value || 0);
  const absoluteValue = Math.abs(numericValue);

  if (!Number.isFinite(numericValue)) return "0";
  if (absoluteValue === 0) return "0";

  if (absoluteValue >= 1) {
    return numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  if (absoluteValue >= 0.1) {
    return numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export function ReceiptRow({ label, value, emphasized = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-right ${emphasized ? "text-lg font-bold text-slate-950" : "text-sm font-semibold text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

export function StatusBadge({ status }) {
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

export function RecipientAvatar({ name, image }) {
  if (image) {
    return <img src={image} alt={name} className="h-16 w-16 rounded-full object-cover" />;
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-lg font-bold text-white">
      {initialsFromName(name)}
    </div>
  );
}

export function getRecipientStateIcon({ isCheckingRecipient, effectiveRecipientLookup }) {
  if (isCheckingRecipient) {
    return <Loader2 size={18} className="animate-spin text-slate-400" />;
  }
  if (effectiveRecipientLookup?.is_valid) {
    return <CheckCircle2 size={18} className="text-emerald-600" />;
  }
  if (effectiveRecipientLookup && effectiveRecipientLookup.is_valid === false) {
    return <XCircle size={18} className="text-rose-600" />;
  }
  return null;
}
