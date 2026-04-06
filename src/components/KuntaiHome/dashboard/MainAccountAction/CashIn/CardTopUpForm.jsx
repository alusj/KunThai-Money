import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import { closePaymentModal, useFlutterwave } from "flutterwave-react-v3";

import AuthNotice from "../../../../auth/AuthNotice";
import {
  createCardTopupIntent,
  verifyCardTopup,
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
  return account?.currency || "SLL";
}

export default function CardTopUpForm({ account, user, onBack }) {
  const defaultEmail = useMemo(() => resolveReceiptEmail(user), [user]);
  const flutterwavePublicKey = import.meta.env.VITE_FLW_PUBLIC_KEY;

  const [amount, setAmount] = useState("");
  const [receiptEmail, setReceiptEmail] = useState(defaultEmail);
  const [cardCategory, setCardCategory] = useState("Debit Card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const launchedCheckoutRef = useRef(null);

  const numericAmount = useMemo(() => {
    const parsed = Number(amount);
    return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : 0;
  }, [amount]);

  const flutterwaveConfig = useMemo(
    () => ({
      public_key: flutterwavePublicKey || "",
      tx_ref: pendingCheckout?.txRef || "preview-kuntai-card-topup",
      amount: pendingCheckout?.amount || numericAmount || 1,
      currency: resolveCurrency(account),
      payment_options: "card",
      customer: {
        email:
          pendingCheckout?.customer?.email ||
          receiptEmail.trim() ||
          defaultEmail ||
          "customer@example.com",
        phonenumber:
          pendingCheckout?.customer?.phone ||
          user?.phone ||
          user?.user_metadata?.phone ||
          user?.raw_user_meta_data?.phone ||
          "",
        name:
          pendingCheckout?.customer?.name ||
          user?.user_metadata?.full_name ||
          user?.raw_user_meta_data?.full_name ||
          "KunThai User",
      },
      customizations: {
        title: "KunThaiMoney Cash In",
        description: "Fund your wallet securely with card",
      },
    }),
    [
      account,
      defaultEmail,
      flutterwavePublicKey,
      numericAmount,
      pendingCheckout,
      receiptEmail,
      user,
    ]
  );

  const startFlutterwavePayment = useFlutterwave(flutterwaveConfig);

  useEffect(() => {
    if (!pendingCheckout) {
      launchedCheckoutRef.current = null;
      return;
    }

    if (launchedCheckoutRef.current === pendingCheckout.txRef) {
      return;
    }

    launchedCheckoutRef.current = pendingCheckout.txRef;

    startFlutterwavePayment({
      callback: async (response) => {
        try {
          const status = String(response?.status || "").toLowerCase();
          const returnedTxRef = response?.tx_ref || pendingCheckout.txRef;

          if (status && status !== "successful") {
            throw new Error("Flutterwave did not mark the card payment as successful.");
          }

          const verifyResult = await verifyCardTopup({
            paymentIntentId: pendingCheckout.paymentIntentId,
            txRef: returnedTxRef,
          });

          setSuccessMessage(verifyResult?.message || "Wallet funded successfully.");
          setError("");
        } catch (verifyError) {
          setError(
            verifyError instanceof Error
              ? verifyError.message
              : "Payment completed, but verification failed."
          );
        } finally {
          closePaymentModal();
          setPendingCheckout(null);
          setLoading(false);
        }
      },
      onClose: () => {
        setPendingCheckout(null);
        setLoading(false);
      },
    });
  }, [pendingCheckout, startFlutterwavePayment]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!flutterwavePublicKey) {
      setError("Missing VITE_FLW_PUBLIC_KEY in your Vercel frontend environment.");
      return;
    }

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
      const paymentIntentId = intentResult?.paymentIntentId;
      const customer = intentResult?.customer || {};

      if (!txRef || !paymentIntentId) {
        throw new Error("Backend did not return a payment reference.");
      }

      setPendingCheckout({
        paymentIntentId,
        txRef,
        amount: numericAmount,
        customer: {
          email: receiptEmail.trim(),
          phone: customer.phone || "",
          name: customer.name || "KunThai User",
        },
      });
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
                Card details stay inside Flutterwave checkout. KunThaiMoney only verifies the payment result and credits your wallet after server-side checks pass.
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
            : `Continue to Cash In${numericAmount ? ` ${resolveCurrency(account)} ${numericAmount.toFixed(2)}` : ""}`}
        </button>
      </form>
    </div>
  );
}
