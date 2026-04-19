// src/components/KuntaiHome/dashboard/MainAccountAction/CashOut/components/AccountNumberForm.jsx

import { AlertCircle, ArrowRight, Wallet } from "lucide-react";
import { formatCurrency } from "../../../../../../Backend/utils/formatCurrency";
import ActionBanner from "../../../../../feedback/ActionBanner";
import { formatExchangeNumber } from "../accountNumber.utils.jsx";

export default function AccountNumberForm({
  isDarkMode,
  error,
  errorTitle,
  availableBalance,
  currency,
  form,
  onChange,
  recipientStateIcon,
  recipientLookup,
  isConversionFlow,
  convertedAmount,
  targetCurrency,
  fxState,
  canVerify,
  onVerify,
  disableAccountNumber,
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        isDarkMode
          ? "border-slate-700 bg-slate-950"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className="mb-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Account Number Transfer
        </p>

        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
          Enter recipient details
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Enter the recipient account number, transfer amount and reason.
        </p>
      </div>

      {/* Error Banner */}
      {error ? (
        <div className="mb-5">
          <ActionBanner tone="danger" title={errorTitle}>
            {error}
          </ActionBanner>
        </div>
      ) : null}

      {/* Balance Card */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <Wallet size={20} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Available Balance
            </p>

            <p className="mt-1 text-xl font-bold text-slate-950">
              {formatCurrency(availableBalance, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Account Number */}
      <label className="mb-5 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Recipient Account Number
        </span>

        <div className="relative">
          <input
            type="text"
            value={form.accountNumber}
            disabled={disableAccountNumber}
            onChange={(e) =>
              onChange(
                "accountNumber",
                e.target.value.replace(/\D/g, "").slice(0, 14)
              )
            }
            placeholder="Enter account number"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-[16px] text-slate-900 outline-none"
          />

          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {recipientStateIcon}
          </div>
        </div>

        {recipientLookup?.message ? (
          <p
            className={`mt-2 text-sm ${
              recipientLookup?.is_valid
                ? "text-emerald-600"
                : "text-rose-500"
            }`}
          >
            {recipientLookup.message}
          </p>
        ) : null}
      </label>

      {/* Amount */}
      <label className="mb-5 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Amount
        </span>

        <input
          type="number"
          inputMode="decimal"
          value={form.amount}
          onChange={(e) => onChange("amount", e.target.value)}
          placeholder={`Enter amount in ${currency}`}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] text-slate-900 outline-none"
        />

        {/* Conversion Display */}
        {isConversionFlow && Number(form.amount) > 0 ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {fxState.loading ? (
              <p className="text-sm text-slate-500">
                Loading conversion rate...
              </p>
            ) : fxState.error ? (
              <p className="text-sm text-rose-500">{fxState.error}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700">
                  Converted Amount
                </p>

                <p className="mt-1 text-lg font-bold text-slate-950">
                  {targetCurrency}{" "}
                  {formatExchangeNumber(convertedAmount || 0)}
                </p>
              </>
            )}
          </div>
        ) : null}
      </label>

      {/* Reason */}
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Reason
        </span>

        <textarea
          rows="4"
          value={form.reason}
          onChange={(e) => onChange("reason", e.target.value)}
          placeholder="Enter reason for transfer"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] text-slate-900 outline-none resize-none"
        />
      </label>

      {/* Verify Button */}
      <button
        type="button"
        onClick={onVerify}
        disabled={!canVerify}
        className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
          canVerify
            ? "bg-slate-950 hover:opacity-90"
            : "bg-slate-400 cursor-not-allowed"
        }`}
      >
        <span>Verify Recipient</span>
        <ArrowRight size={16} />
      </button>

      {/* Validation hint */}
      {!canVerify ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <AlertCircle
            size={16}
            className="mt-0.5 text-amber-600 shrink-0"
          />

          <p className="text-sm text-amber-700">
            Please ensure recipient account is valid and amount is within your
            balance.
          </p>
        </div>
      ) : null}
    </div>
  );
}