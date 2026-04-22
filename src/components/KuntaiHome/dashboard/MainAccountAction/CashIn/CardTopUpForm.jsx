import { useMemo, useState } from "react";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";

import AuthNotice from "../../../../auth/AuthNotice";
import { normalizeCurrencyCode } from "../../../../../Backend/utils/currency";
import {
  createCardTopupIntent,
} from "../../../../../Backend/services/paymentService";

const CARD_CATEGORIES = [
  "Debit Card",
  "Credit Card",
  "Prepaid Card",
  "Virtual Card",
];

function resolveReceiptEmail(user) {
  return (
    user?.email ||
    user?.user_metadata?.email ||
    user?.raw_user_meta_data?.email ||
    ""
  );
}

function resolveCurrency(account) {
  return normalizeCurrencyCode(account?.currency) || "SLL";
}

export default function CardTopUpForm({ account, user, onBack }) {
  const defaultEmail = useMemo(() => resolveReceiptEmail(user), [user]);

  const [amount, setAmount] = useState("");
  const [receiptEmail, setReceiptEmail] = useState(defaultEmail);
  const [cardCategory, setCardCategory] = useState("Debit Card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const numericAmount = useMemo(() => {
    const parsed = Number(amount);
    return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : 0;
  }, [amount]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!account?.id) {
      setError("Your wallet account is still loading. Please try again in a moment.");
      return;
    }

    if (!numericAmount) {
      setError("Enter a valid cash in amount.");
      return;
    }

    if (!receiptEmail.trim()) {
      setError("Enter a valid receipt email address.");
      return;
    }

    setLoading(true);

    try {
      const intentResult = await createCardTopupIntent({
        accountId: account.id,
        amount: numericAmount,
        currency: resolveCurrency(account),
        cardCategory,
        receiptEmail: receiptEmail.trim(),
      });

      const txRef = intentResult?.txRef;
      const paymentLink = intentResult?.paymentLink;

      if (!txRef || !paymentLink) {
        throw new Error("Backend did not return a hosted payment link.");
      }

      window.location.assign(paymentLink);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to continue to card payment."
      );
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        onClick={onBack}
        type="button"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="mb-4 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
          <CreditCard size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Cash in with card</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Use Flutterwave to fund your wallet with a debit, credit, or prepaid card.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Amount
          </span>
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4">
            <span className="text-sm font-semibold text-slate-500">{resolveCurrency(account)}</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-2xl px-3 py-3 text-sm text-slate-900 outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Card Category
          </span>
          <select
            value={cardCategory}
            onChange={(event) => setCardCategory(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {CARD_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Receipt Email
          </span>
          <input
            type="email"
            value={receiptEmail}
            onChange={(event) => setReceiptEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-emerald-600">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Secure card checkout</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                  You will continue to a Flutterwave-hosted payment page. KunTaiMoney only credits your wallet after server-side verification succeeds.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <AuthNotice tone="danger" title="Card cash in could not continue">
            {error}
          </AuthNotice>
        ) : null}

        {successMessage ? (
          <AuthNotice tone="success" title="Cash in completed">
            {successMessage}
          </AuthNotice>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
            loading ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
          }`}
        >
          {loading
            ? "Opening Flutterwave checkout..."
            : `Continue to Cash In${numericAmount ? ` ${resolveCurrency(account)} ${numericAmount.toFixed(2)}` : ""}`}
        </button>
      </form>
    </div>
  );
}
