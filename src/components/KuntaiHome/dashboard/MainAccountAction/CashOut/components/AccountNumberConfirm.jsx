// src/components/KuntaiHome/dashboard/MainAccountAction/CashOut/components/AccountNumberConfirm.jsx

import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { formatCurrency } from "../../../../../../Backend/utils/formatCurrency";
import {
  ReceiptRow,
  RecipientAvatar,
  formatExchangeNumber,
} from "../accountNumber.utils";

export default function AccountNumberConfirm({
  isDarkMode,
  backLabel,
  disableFormEditing,
  startStep,
  onClose,
  onBack,
  onConfirm,
  isPreparingPin,
  recipientLookup,
  form,
  currency,
  numericAmount,
  targetCurrency,
  convertedAmount,
  taxAmount,
  transactionFee,
  totalAmount,
  isConversionFlow,
  fxState,
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        isDarkMode
          ? "border-slate-700 bg-slate-950"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Top Back */}
      <button
        type="button"
        onClick={
          disableFormEditing && startStep === "confirm"
            ? onClose
            : onBack
        }
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={16} />
        <span>{backLabel}</span>
      </button>

      {/* Header */}
      <div className="mb-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Confirm Transfer
        </p>

        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
          Review transaction details
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Confirm all information before proceeding to PIN verification.
        </p>
      </div>

      {/* Recipient Card */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-4">
          <RecipientAvatar
            name={recipientLookup?.recipient_name}
            image={recipientLookup?.recipient_profile_image}
          />

          <div>
            <p className="text-base font-semibold text-slate-950">
              {recipientLookup?.recipient_name || "Recipient"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {recipientLookup?.recipient_account_number ||
                form.accountNumber}
            </p>
          </div>
        </div>
      </section>

      {/* Transaction Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="divide-y divide-slate-100">
          <ReceiptRow
            label="Amount"
            value={formatCurrency(numericAmount, currency)}
          />

          {isConversionFlow ? (
            <>
              <ReceiptRow
                label="Exchange Rate"
                value={`1 ${currency} = ${formatExchangeNumber(
                  fxState?.rate || 1
                )} ${targetCurrency}`}
              />

              <ReceiptRow
                label="Converted Amount"
                value={`${targetCurrency} ${formatExchangeNumber(
                  convertedAmount || 0
                )}`}
              />
            </>
          ) : null}

          <ReceiptRow
            label="Tax"
            value={formatCurrency(taxAmount, currency)}
          />

          <ReceiptRow
            label="Transaction Fee"
            value={formatCurrency(transactionFee, currency)}
          />

          <ReceiptRow
            label="Reason"
            value={form.reason || "No note added"}
          />

          <ReceiptRow
            label="TOTAL"
            value={formatCurrency(totalAmount, currency)}
            emphasized
          />
        </div>
      </section>

      {/* Confirm Button */}
      <button
        type="button"
        onClick={onConfirm}
        disabled={isPreparingPin}
        className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white ${
          isPreparingPin
            ? "bg-slate-400"
            : "bg-slate-950 hover:opacity-90"
        }`}
      >
        {isPreparingPin ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle2 size={16} />
        )}

        <span>
          {isPreparingPin ? "Preparing PIN..." : "Continue to PIN"}
        </span>
      </button>
    </div>
  );
}