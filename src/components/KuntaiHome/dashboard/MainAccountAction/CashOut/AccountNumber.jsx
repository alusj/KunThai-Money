import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAccountTransfer } from "../../../../../Backend/services/transferService";
import { convertOwnAccounts } from "../../../../../Backend/services/walletConversionService";
import { normalizeCurrencyCode } from "../../../../../Backend/utils/currency";
import { useAppearance } from "../../../../AppearanceProvider";

import {
  INITIAL_FORM,
  paymentMethodLabel,
  resolveErrorMessage,
} from "./accountNumber.utils.jsx";

import { useRecipientLookup } from "./hooks/useRecipientLookup";
import { useConversionRate } from "./hooks/useConversionRate";

import AccountNumberForm from "./components/AccountNumberForm";
import AccountNumberConfirm from "./components/AccountNumberConfirm";
import AccountNumberPin from "./components/AccountNumberPin";
import AccountNumberReceipt from "./components/AccountNumberReceipt";

function ForgotPinModal({ isOpen, onClose, onOpenChangePin }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
      >
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">Transaction PIN Help</p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-950">Change your transaction PIN</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          To change your PIN, go to settings, scroll down to security, and tap{" "}
          <button
            type="button"
            onClick={onOpenChangePin}
            className="font-semibold text-sky-600 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-700"
          >
            Change PIN
          </button>{" "}
          to create another PIN before making more transactions.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onOpenChangePin}
            className="flex-1 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Change PIN
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountNumber({
  account,
  user,
  profile,
  onClose,
  refreshAccount,
  initialValues = null,
  onTransferSuccess,
  backLabel = "Back",
  conversionConfig = null,
  startStep = "form",
  prefilledRecipientLookup = null,
  disableFormEditing = false,
  transferMetadata = null,
  receiptOverrides = null,
  successBanner = null,
  errorTitle = "Cash out unsuccessful",
}) {
  const navigate = useNavigate();
  const { isDarkMode } = useAppearance();

  const currency = normalizeCurrencyCode(account?.currency) || "SLL";
  const availableBalance = Number(account?.balance || 0);
  const isConversionFlow = Boolean(conversionConfig?.targetAccount);
  const targetCurrency =
    normalizeCurrencyCode(conversionConfig?.targetAccount?.currency) || currency;

  const [step, setStep] = useState(startStep);
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    accountNumber:
      conversionConfig?.targetAccount?.account_number ||
      initialValues?.accountNumber ||
      "",
    amount: initialValues?.amount ? String(initialValues.amount) : "",
    reason: initialValues?.reason || "",
  }));
  const [error, setError] = useState("");
  const [isPreparingPin, setIsPreparingPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pin, setPin] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [successfulTransfer, setSuccessfulTransfer] = useState(null);
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);

  const ownerName =
    profile?.first_name || profile?.last_name
      ? [profile?.first_name, profile?.middle_name, profile?.last_name]
          .filter(Boolean)
          .join(" ")
      : user?.user_metadata?.full_name ||
        user?.user_metadata?.display_name ||
        user?.user_metadata?.name ||
        account?.account_name ||
        "KunThai user";

  const ownerProfileImage =
    profile?.profile_image ||
    user?.user_metadata?.profile_image ||
    user?.raw_user_meta_data?.profile_image ||
    "";

  const {
    recipientLookup,
    recipientStateIcon,
  } = useRecipientLookup({
    formAccountNumber: form.accountNumber,
    accountId: account?.id,
    isConversionFlow,
    disableFormEditing,
    prefilledRecipientLookup,
    conversionConfig,
  });

  const { fxState } = useConversionRate({
    isConversionFlow,
    currency,
    targetCurrency,
  });

  const numericAmount = Number(form.amount);
  const transactionFee = 0;
  const taxAmount = 0;
  const totalAmount =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? Number(numericAmount.toFixed(2))
      : 0;

  const convertedAmountRaw =
    isConversionFlow && fxState.rate && Number.isFinite(numericAmount) && numericAmount > 0
      ? numericAmount * fxState.rate
      : 0;

  const convertedAmount =
    isConversionFlow && convertedAmountRaw > 0
      ? Number(convertedAmountRaw.toFixed(convertedAmountRaw >= 1 ? 2 : 6))
      : 0;

  const effectiveRecipientLookup = isConversionFlow
    ? {
        is_valid: true,
        recipient_name:
          conversionConfig?.targetAccount?.account_name ||
          conversionConfig?.targetLabel ||
          "Conversion destination",
        recipient_profile_image: "",
        recipient_account_number:
          conversionConfig?.targetAccount?.account_number || "",
        message: "Your destination account is ready for conversion.",
      }
    : prefilledRecipientLookup || recipientLookup;

  const canVerify =
    Boolean(effectiveRecipientLookup?.is_valid) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    numericAmount <= availableBalance &&
    (!isConversionFlow || currency === targetCurrency || Boolean(fxState.rate));

  const resolvedTransferMetadata =
    typeof transferMetadata === "function"
      ? transferMetadata({
          account,
          user,
          profile,
          form,
          ownerName,
          ownerProfileImage,
          recipientLookup: effectiveRecipientLookup,
          currency,
          amount: numericAmount,
        })
      : transferMetadata || {};

  const resolvedReceiptOverrides =
    typeof receiptOverrides === "function"
      ? receiptOverrides({
          account,
          user,
          profile,
          form,
          ownerName,
          ownerProfileImage,
          recipientLookup: effectiveRecipientLookup,
          currency,
          amount: numericAmount,
        })
      : receiptOverrides || {};

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const handleVerify = () => {
    if (!effectiveRecipientLookup?.is_valid) {
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

    if (isConversionFlow && currency !== targetCurrency && !fxState.rate) {
      setError("Live conversion rate is not ready yet.");
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
      const transfer = isConversionFlow
        ? await convertOwnAccounts({
            sourceAccountId: account?.id,
            targetAccountNumber: form.accountNumber.trim(),
            amount: numericAmount,
            convertedAmount: convertedAmount || numericAmount,
            exchangeRate: fxState.rate || 1,
            reason: form.reason.trim(),
            pin,
            metadata: {
              flow: conversionConfig?.flow || "wallet_conversion",
              sender_name: ownerName,
              sender_profile_image: ownerProfileImage,
              sender_account_number: account?.account_number || "",
              recipient_name:
                conversionConfig?.targetAccount?.account_name ||
                effectiveRecipientLookup?.recipient_name ||
                form.accountNumber.trim(),
              recipient_account_number: form.accountNumber.trim(),
              conversion_source_currency: currency,
              conversion_target_currency: targetCurrency,
            },
          })
        : await createAccountTransfer({
            sourceAccountId: account?.id,
            recipientAccountNumber: form.accountNumber.trim(),
            amount: numericAmount,
            reason: form.reason.trim(),
            pin,
            metadata: {
              flow: "dashboard_account_number_transfer",
              sender_name: ownerName,
              sender_profile_image: ownerProfileImage,
              sender_account_number: account?.account_number || "",
              recipient_name:
                effectiveRecipientLookup?.recipient_name || form.accountNumber.trim(),
              recipient_profile_image:
                effectiveRecipientLookup?.recipient_profile_image || "",
              recipient_account_number: form.accountNumber.trim(),
              ...resolvedTransferMetadata,
            },
          });

      const nextReceipt = {
        status: transfer?.status || "completed",
        recipientName:
          transfer?.recipient_name ||
          effectiveRecipientLookup?.recipient_name ||
          form.accountNumber.trim(),
        recipientProfileImage:
          effectiveRecipientLookup?.recipient_profile_image || "",
        recipientAccountNumber:
          transfer?.recipient_account_number ||
          transfer?.target_account_number ||
          form.accountNumber.trim(),
        transactionId: transfer?.sender_transaction_id || transfer?.id || "Pending",
        referenceNumber: transfer?.reference_number || transfer?.id || "Pending",
        amount: Number(transfer?.amount ?? numericAmount),
        taxAmount: Number(transfer?.tax_amount ?? taxAmount),
        transactionFee: Number(transfer?.transaction_fee ?? transactionFee),
        totalAmount: Number(transfer?.total_amount ?? totalAmount),
        reason: transfer?.reason || form.reason.trim() || "No note added",
        createdAt:
          transfer?.completed_at || transfer?.created_at || new Date().toISOString(),
        senderAccountNumber:
          transfer?.source_account_number || account?.account_number || "Pending",
        paymentMethod: paymentMethodLabel(
          transfer?.source_account_type || account?.account_type
        ),
        convertedAmount: Number(transfer?.converted_amount ?? convertedAmount),
        sourceCurrency: transfer?.source_currency || currency,
        targetCurrency: transfer?.target_currency || targetCurrency,
        exchangeRate: Number(transfer?.exchange_rate ?? fxState.rate ?? 1),
        isConversion: isConversionFlow,
        ...resolvedReceiptOverrides,
      };

      setReceipt(nextReceipt);
      setSuccessfulTransfer(transfer);
      setPin("");
      setStep("receipt");
    } catch (submitError) {
      setError(resolveErrorMessage(submitError, "The transfer could not be completed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep("form");
    setForm({
      ...INITIAL_FORM,
      accountNumber:
        conversionConfig?.targetAccount?.account_number ||
        initialValues?.accountNumber ||
        "",
      amount: initialValues?.amount ? String(initialValues.amount) : "",
      reason: initialValues?.reason || "",
    });
    setPin("");
    setError("");
    setReceipt(null);
    setSuccessfulTransfer(null);
  };

  const handleForgotPin = async () => {
    setShowForgotPinModal(true);
  };

  if (step === "receipt" && receipt) {
    return (
      <AccountNumberReceipt
        receipt={receipt}
        currency={currency}
        isDarkMode={isDarkMode}
        successBanner={successBanner}
        onBack={async () => {
          await refreshAccount?.();
          handleReset();
          onClose?.();
        }}
        onDone={async () => {
          await refreshAccount?.();
          await onTransferSuccess?.(successfulTransfer || receipt);
          handleReset();
          onClose?.();
        }}
      />
    );
  }

  if (step === "pin") {
    return (
      <>
        <AccountNumberPin
          isDarkMode={isDarkMode}
          error={error}
          pin={pin}
          backLabel={backLabel}
          isSubmitting={isSubmitting}
          onBack={() => setStep("confirm")}
          onChangePin={(value) => {
            setPin(value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          onForgotPin={handleForgotPin}
          onSubmit={handlePinSubmit}
        />

        <ForgotPinModal
          isOpen={showForgotPinModal}
          onClose={() => setShowForgotPinModal(false)}
          onOpenChangePin={() => {
            setShowForgotPinModal(false);
            onClose?.();
            navigate("/home", {
              replace: true,
              state: {
                openScreen: "change-pin",
              },
            });
          }}
        />
      </>
    );
  }

  if (step === "confirm") {
    return (
      <AccountNumberConfirm
        isDarkMode={isDarkMode}
        backLabel={backLabel}
        disableFormEditing={disableFormEditing}
        startStep={startStep}
        onClose={onClose}
        onBack={() => setStep("form")}
        onConfirm={handleConfirm}
        isPreparingPin={isPreparingPin}
        recipientLookup={effectiveRecipientLookup}
        form={form}
        currency={currency}
        numericAmount={numericAmount}
        targetCurrency={targetCurrency}
        convertedAmount={convertedAmount}
        taxAmount={taxAmount}
        transactionFee={transactionFee}
        totalAmount={totalAmount}
        isConversionFlow={isConversionFlow}
        fxState={fxState}
      />
    );
  }

  return (
    <>
      <AccountNumberForm
        isDarkMode={isDarkMode}
        error={error}
        errorTitle={errorTitle}
        availableBalance={availableBalance}
        currency={currency}
        form={form}
        onChange={handleChange}
      recipientStateIcon={recipientStateIcon}
      recipientLookup={effectiveRecipientLookup}
      isConversionFlow={isConversionFlow}
      convertedAmount={convertedAmount}
        targetCurrency={targetCurrency}
        fxState={fxState}
        canVerify={canVerify}
        onVerify={handleVerify}
        disableAccountNumber={isConversionFlow}
      />

      <ForgotPinModal
        isOpen={showForgotPinModal}
        onClose={() => setShowForgotPinModal(false)}
        onOpenChangePin={() => {
          setShowForgotPinModal(false);
          onClose?.();
          navigate("/home", {
            replace: true,
            state: {
              openScreen: "change-pin",
            },
          });
        }}
      />
    </>
  );
}
