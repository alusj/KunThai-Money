import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import { closePaymentModal, useFlutterwave } from "flutterwave-react-v3";

import AuthNotice from "../../../../auth/AuthNotice";
import {
  createCardCashInIntent,
  verifyCardCashIn,
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
    user?.user_metadata?.receipt_email ||
    user?.raw_user_meta_data?.email ||
    ""
  );
}

export default function CardTopUpForm({ account, user, onBack }) {
  const defaultEmail = useMemo(() => resolveReceiptEmail(user), [user]);
  const launchedTxRefRef = useRef("");

  const [amount, setAmount] = useState("");
  const [receiptEmail, setReceiptEmail] = useState(defaultEmail);
  const [cardCategory, setCardCategory] = useState("Debit Card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [checkoutSession, setCheckoutSession] = useState(null);

  const numericAmount = useMemo(() => {
    const parsed = Number(amount);
    return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : 0;
  }, [amount]);

  const flutterwaveConfig = useMemo(
    () => ({
      public_key: import.meta.env.VITE_FLW_PUBLIC_KEY || "",
      tx_ref: checkoutSession?.txRef || "kuntai-cashin-preview",
      amount: checkoutSession?.amount ?? numericAmount,
      currency: checkoutSession?.currency || account?.currency || "SLL",
      payment_options: "card",
      customer: {
        email:
          checkoutSession?.receiptEmail ||
          receiptEmail.trim() ||
          defaultEmail ||
          "customer@example.com",
        phone_number: checkoutSession?.customer?.phone || "",
        name: checkoutSession?.customer?.name || "KunTai User",
      },
      customizations: {
        title: "KunThaiMoney Cash In",
        description: "Fund your wallet securely with card",
        logo: "/logo.png",
      },
    }),
    [account?.currency, checkoutSession, defaultEmail, numericAmount, receiptEmail]
  );

  const startPayment = useFlutterwave(flutterwaveConfig);

  useEffect(() => {
    if (!checkoutSession?.txRef) {
      return;
    }

    if (launchedTxRefRef.current === checkoutSession.txRef) {
      return;
    }

    launchedTxRefRef.current = checkoutSession.txRef;

    startPayment({
      callback: async function () {
        try {
          const verifyResult = await verifyCardCashIn({
            paymentIntentId: checkoutSession.paymentIntent.id,
            txRef: checkoutSession.txRef,
          });

          setSuccessMessage(
            verifyResult?.message || "Wallet funded successfully."
          );
          setError("");
        } catch (verifyError) {
          setError(
            verifyError.message ||
              "Payment was started, but verification failed. Please contact support if your card was charged."
          );
        } finally {
          closePaymentModal();
          setCheckoutSession(null);
          setLoading(false);
        }
      },
      onClose: function () {
        setCheckoutSession(null);
        setLoading(false);
      },
    });
  }, [checkoutSession, startPayment]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!account?.id) {
      setError("Your account is still loading. Please try again in a moment.");
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

    if (!import.meta.env.VITE_FLW_PUBLIC_KEY) {
      setError("Flutterwave public key is missing in the frontend environment.");
      return;
    }

    setLoading(true);

    try {
      const { paymentIntent, txRef, customer } = await createCardCashInIntent({
        accountId: account.id,
        amount: numericAmount,
        currency: account.currency || "SLL",
        cardCategory,
      });
      setCheckoutSession({
        paymentIntent,
        txRef,
        amount: numericAmount,
        currency: account.currency || "SLL",
        receiptEmail: receiptEmail.trim(),
        customer,
      });
    } catch (submitError) {
      setError(submitError.message || "Unable to continue to card payment.");
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
            Use your card to securely fund your wallet through Flutterwave.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Amount
          </span>
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4">
            <span className="text-sm font-semibold text-slate-500">
              {account?.currency || "SLL"}
            </span>
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
                Card number, expiry date, and CVV are collected in Flutterwave’s secure payment flow. KunThaiMoney does not store raw card details.
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
            ? "Processing card payment..."
            : `Continue to Cash In${numericAmount ? ` ${account?.currency || "SLL"} ${numericAmount.toFixed(2)}` : ""}`}
        </button>
      </form>
    </div>
  );
}
