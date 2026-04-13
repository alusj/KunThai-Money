import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, ReceiptText, SendHorizonal } from "lucide-react";

import ActionBanner from "../../../../feedback/ActionBanner";
import { createPaymentRequest } from "../../../../../Backend/services/paymentRequestService";
import { getAccountTransferRecipient } from "../../../../../Backend/services/transferService";
import { formatCurrency } from "../../../../../Backend/utils/formatCurrency";
import { normalizeCurrencyCode } from "../../../../../Backend/utils/currency";

function RequestPaymentScreen({ account, onBack, onCreated }) {
  const currency = normalizeCurrencyCode(account?.currency) || "SLL";
  const [form, setForm] = useState({
    accountNumber: "",
    amount: "",
    reason: "",
  });
  const [recipientLookup, setRecipientLookup] = useState(null);
  const [loadingRecipient, setLoadingRecipient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const numericAmount = useMemo(() => {
    const parsed = Number(form.amount);
    return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : 0;
  }, [form.amount]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");

    if (field === "accountNumber") {
      setRecipientLookup(null);
    }
  };

  const handleLookup = async () => {
    const recipientAccountNumber = form.accountNumber.trim();

    if (!recipientAccountNumber || recipientAccountNumber.length < 8 || !account?.id) {
      setError("Enter a valid account number.");
      return;
    }

    setLoadingRecipient(true);
    setError("");

    try {
      const lookup = await getAccountTransferRecipient({
        sourceAccountId: account.id,
        recipientAccountNumber,
      });

      setRecipientLookup(lookup);

      if (!lookup?.is_valid) {
        setError(lookup?.message || "Recipient account could not be verified.");
      }
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Recipient account could not be verified.");
    } finally {
      setLoadingRecipient(false);
    }
  };

  const handleSubmit = async () => {
    if (!recipientLookup?.is_valid) {
      setError("Verify the target account number first.");
      return;
    }

    if (!numericAmount) {
      setError("Enter the amount you want to request.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Enter the reason for this request.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const request = await createPaymentRequest({
        requesterAccountId: account?.id,
        recipientAccountNumber: form.accountNumber.trim(),
        amount: numericAmount,
        reason: form.reason.trim(),
      });

      setSuccess("Payment request sent successfully.");
      onCreated?.(request);
      setForm({ accountNumber: "", amount: "", reason: "" });
      setRecipientLookup(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Payment request could not be created.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white">
      <div className="mx-auto max-w-3xl px-4 py-5 md:px-8">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="text-center">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">Cash In</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950">Request Payment</h1>
          </div>

          <div className="w-16" />
        </div>

        <div className="mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm leading-6 text-slate-500">
            Enter the account number you want to request from, the amount requested, and the reason for the request.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Account Number
              </span>
              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.accountNumber}
                  onChange={(event) => handleChange("accountNumber", event.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="Enter account number"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={loadingRecipient}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {loadingRecipient ? "Checking..." : "Verify"}
                </button>
              </div>
              {recipientLookup?.is_valid ? (
                <div className="mt-3">
                  <ActionBanner tone="success" title="Account verified">
                    {recipientLookup.recipient_name} can receive this payment request.
                  </ActionBanner>
                </div>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Amount Requested
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
              <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <ReceiptText size={14} />
                Reason
              </span>
              <textarea
                rows="4"
                value={form.reason}
                onChange={(event) => handleChange("reason", event.target.value)}
                placeholder="Why are you requesting this payment?"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
          </div>

          {error ? (
            <div className="mt-5">
              <ActionBanner tone="danger" title="Payment request unsuccessful">
                {error}
              </ActionBanner>
            </div>
          ) : null}

          {success ? (
            <div className="mt-5">
              <ActionBanner tone="success" title="Payment request sent successfully">
                {recipientLookup?.recipient_name
                  ? `Your request has been delivered to ${recipientLookup.recipient_name}.`
                  : success}
              </ActionBanner>
            </div>
          ) : null}

          <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-emerald-700">Preview</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The target account owner will receive a payment requested form showing your name, your account number, the amount requested, and the reason for the request.
            </p>
            {numericAmount ? (
              <p className="mt-3 text-lg font-semibold text-slate-950">{formatCurrency(numericAmount, currency)}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[24px] px-4 py-3 text-sm font-semibold text-white transition ${
              submitting ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
            <span>{submitting ? "Requesting payment..." : "Request Payment"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RequestPayment({ account }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-950">Request Payment</p>
            <p className="mt-1 text-sm text-slate-500">Ask another account owner to send money to your wallet.</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Cash In
          </span>
        </div>
      </button>

      {open ? (
        <RequestPaymentScreen
          account={account}
          onBack={() => setOpen(false)}
          onCreated={() => {}}
        />
      ) : null}
    </>
  );
}
