import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Hash,
  Loader2,
  ReceiptText,
  SendHorizonal,
  Share2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import ActionBanner from "../../../../feedback/ActionBanner";
import { useAppearance } from "../../../../AppearanceProvider";
import {
  createAccountTransfer,
  getAccountTransferRecipient,
} from "../../../../../Backend/services/transferService";
import { convertOwnAccounts } from "../../../../../Backend/services/walletConversionService";
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

function resolvePinBannerTitle(message = "") {
  if (
    /incorrect transaction pin/i.test(message) ||
    /transaction pin/i.test(message) ||
    /pin/i.test(message)
  ) {
    return "PIN check failed";
  }

  return "Transfer setup issue";
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

function formatExchangeNumber(value) {
  const numericValue = Number(value || 0);
  const absoluteValue = Math.abs(numericValue);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  if (absoluteValue === 0) {
    return "0";
  }

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

function adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, rate) {
  const numericRate = Number(rate);
  const normalizedBase = normalizeCurrencyCode(baseCurrency);
  const normalizedQuote = normalizeCurrencyCode(quoteCurrency);

  if (!Number.isFinite(numericRate)) {
    return null;
  }

  if (normalizedBase === "SLL" && normalizedQuote !== "SLL") {
    return numericRate * 1000;
  }

  if (normalizedBase !== "SLL" && normalizedQuote === "SLL") {
    return numericRate / 1000;
  }

  return numericRate;
}

async function fetchExchangeRate(baseCurrency, quoteCurrency) {
  if (!baseCurrency || !quoteCurrency) {
    throw new Error("Currency pair is incomplete.");
  }

  if (baseCurrency === quoteCurrency) {
    return 1;
  }

  const directProviders = [
    async () => {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const rate = data?.rates?.[quoteCurrency] || null;
      return adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, rate);
    },
    async () => {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${baseCurrency}&to=${quoteCurrency}`
      );
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const rate = data?.rates?.[quoteCurrency] || null;
      return adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, rate);
    },
  ];

  for (const provider of directProviders) {
    const rate = await provider();
    if (rate) {
      return Number(rate);
    }
  }

  const reverseProviders = [
    async () => {
      const response = await fetch(`https://open.er-api.com/v6/latest/${quoteCurrency}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const reverseRate = data?.rates?.[baseCurrency] || null;
      return reverseRate
        ? adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, 1 / Number(reverseRate))
        : null;
    },
    async () => {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${quoteCurrency}&to=${baseCurrency}`
      );
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const reverseRate = data?.rates?.[baseCurrency] || null;
      return reverseRate
        ? adjustLegacySierraLeoneRate(baseCurrency, quoteCurrency, 1 / Number(reverseRate))
        : null;
    },
  ];

  for (const provider of reverseProviders) {
    const rate = await provider();
    if (rate) {
      return Number(rate);
    }
  }

  throw new Error("Live conversion rate is unavailable right now.");
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

async function renderReceiptImage(receiptElement) {
  const rect = receiptElement.getBoundingClientRect();
  const clone = receiptElement.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(rect.width)}" height="${Math.ceil(rect.height)}">
      <foreignObject width="100%" height="100%">${markup}</foreignObject>
    </svg>
  `;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(rect.width * 2);
    canvas.height = Math.ceil(rect.height * 2);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not supported.");
    }

    context.scale(2, 2);
    context.drawImage(image, 0, 0, rect.width, rect.height);

    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!pngBlob) {
      throw new Error("Receipt image could not be generated.");
    }

    return pngBlob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function imageBlobToJpegData(imageBlob) {
  const url = URL.createObjectURL(imageBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not supported.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const jpegBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));

    if (!jpegBlob) {
      throw new Error("PDF image could not be prepared.");
    }

    return { blob: jpegBlob, width: image.width, height: image.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function concatUint8Arrays(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged;
}

function buildPdfBlobFromJpegBytes(jpegBytes, imageWidth, imageHeight) {
  const encoder = new TextEncoder();
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const ratio = Math.min(
    (pageWidth - margin * 2) / imageWidth,
    (pageHeight - margin * 2) / imageHeight
  );
  const renderWidth = imageWidth * ratio;
  const renderHeight = imageHeight * ratio;
  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;
  const contentStream = `q\n${renderWidth.toFixed(2)} 0 0 ${renderHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    null,
    `<< /Length ${encoder.encode(contentStream).length} >>\nstream\n${contentStream}\nendstream`,
  ];

  const chunks = [encoder.encode("%PDF-1.4\n")];
  const offsets = [0];
  let currentLength = chunks[0].length;

  objects.forEach((objectBody, index) => {
    offsets.push(currentLength);

    if (index === 3) {
      const header = encoder.encode(
        `${index + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
      );
      const footer = encoder.encode("\nendstream\nendobj\n");
      chunks.push(header, jpegBytes, footer);
      currentLength += header.length + jpegBytes.length + footer.length;
      return;
    }

    const body = encoder.encode(`${index + 1} 0 obj\n${objectBody}\nendobj\n`);
    chunks.push(body);
    currentLength += body.length;
  });

  const xrefOffset = currentLength;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  chunks.push(encoder.encode(xref), encoder.encode(trailer));

  return new Blob([concatUint8Arrays(chunks)], { type: "application/pdf" });
}

async function createReceiptPdfBlob(receiptElement) {
  const imageBlob = await renderReceiptImage(receiptElement);
  const jpegData = await imageBlobToJpegData(imageBlob);
  const jpegBytes = new Uint8Array(await jpegData.blob.arrayBuffer());
  return buildPdfBlobFromJpegBytes(jpegBytes, jpegData.width, jpegData.height);
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
}) {
  const { isDarkMode } = useAppearance();
  const currency = normalizeCurrencyCode(account?.currency) || "SLL";
  const availableBalance = Number(account?.balance || 0);
  const isConversionFlow = Boolean(conversionConfig?.targetAccount);
  const targetCurrency = normalizeCurrencyCode(conversionConfig?.targetAccount?.currency) || currency;
  const [step, setStep] = useState("form");
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    accountNumber:
      conversionConfig?.targetAccount?.account_number || initialValues?.accountNumber || "",
    amount: initialValues?.amount ? String(initialValues.amount) : "",
    reason: initialValues?.reason || "",
  }));
  const [error, setError] = useState("");
  const [isCheckingRecipient, setIsCheckingRecipient] = useState(false);
  const [isPreparingPin, setIsPreparingPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pin, setPin] = useState("");
  const [recipientLookup, setRecipientLookup] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [pendingSuccessTransfer, setPendingSuccessTransfer] = useState(null);
  const [sharePickerOpen, setSharePickerOpen] = useState(false);
  const [fxState, setFxState] = useState({
    loading: false,
    error: "",
    rate: null,
  });
  const receiptRef = useRef(null);
  const ownerName =
    profile?.first_name || profile?.last_name
      ? [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(" ")
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

  const numericAmount = Number(form.amount);
  const transactionFee = 0;
  const taxAmount = 0;
  const totalAmount = Number.isFinite(numericAmount) && numericAmount > 0 ? Number(numericAmount.toFixed(2)) : 0;
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
        recipient_account_number: conversionConfig?.targetAccount?.account_number || "",
        message: "Your destination account is ready for conversion.",
      }
    : recipientLookup;

  useEffect(() => {
    if (isConversionFlow) {
      setRecipientLookup(null);
      setIsCheckingRecipient(false);
      return undefined;
    }

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
  }, [form.accountNumber, account?.id, isConversionFlow]);

  useEffect(() => {
    if (!isConversionFlow) {
      setFxState({ loading: false, error: "", rate: null });
      return undefined;
    }

    if (!currency || !targetCurrency) {
      setFxState({ loading: false, error: "", rate: null });
      return undefined;
    }

    if (currency === targetCurrency) {
      setFxState({ loading: false, error: "", rate: 1 });
      return undefined;
    }

    let isActive = true;

    async function loadRate() {
      setFxState({ loading: true, error: "", rate: null });

      try {
        const rate = await fetchExchangeRate(currency, targetCurrency);

        if (isActive) {
          setFxState({ loading: false, error: "", rate: Number(rate) });
        }
      } catch (rateError) {
        if (isActive) {
          setFxState({
            loading: false,
            error: rateError.message || "Live conversion rate is unavailable right now.",
            rate: null,
          });
        }
      }
    }

    loadRate();

    return () => {
      isActive = false;
    };
  }, [currency, isConversionFlow, targetCurrency]);

  useEffect(() => {
    if (!pendingSuccessTransfer || step !== "receipt") {
      return;
    }

    let isActive = true;

    async function finalizeSuccessfulTransfer() {
      try {
        await refreshAccount?.();
        if (isActive) {
          await onTransferSuccess?.(pendingSuccessTransfer);
        }
      } finally {
        if (isActive) {
          setPendingSuccessTransfer(null);
        }
      }
    }

    finalizeSuccessfulTransfer();

    return () => {
      isActive = false;
    };
  }, [onTransferSuccess, pendingSuccessTransfer, refreshAccount, step]);

  const recipientStateIcon = useMemo(() => {
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
  }, [effectiveRecipientLookup, isCheckingRecipient]);

  const canVerify =
    Boolean(effectiveRecipientLookup?.is_valid) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    numericAmount <= availableBalance &&
    (!isConversionFlow || currency === targetCurrency || Boolean(fxState.rate));

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");

    if (field === "accountNumber") {
      setRecipientLookup(null);
    }
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
              recipient_name: effectiveRecipientLookup?.recipient_name || form.accountNumber.trim(),
              recipient_profile_image: effectiveRecipientLookup?.recipient_profile_image || "",
              recipient_account_number: form.accountNumber.trim(),
            },
          });

      setReceipt({
        status: transfer?.status || "completed",
        recipientName: transfer?.recipient_name || effectiveRecipientLookup?.recipient_name || form.accountNumber.trim(),
        recipientProfileImage: effectiveRecipientLookup?.recipient_profile_image || "",
        recipientAccountNumber: transfer?.recipient_account_number || transfer?.target_account_number || form.accountNumber.trim(),
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
        convertedAmount: Number(transfer?.converted_amount ?? convertedAmount),
        sourceCurrency: transfer?.source_currency || currency,
        targetCurrency: transfer?.target_currency || targetCurrency,
        exchangeRate: Number(transfer?.exchange_rate ?? fxState.rate ?? 1),
        isConversion: isConversionFlow,
      });
      setPin("");
      setStep("receipt");
      setPendingSuccessTransfer(transfer);
    } catch (submitError) {
      setError(resolveErrorMessage(submitError, "The transfer could not be completed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareReceiptFile = async (format) => {
    if (!receipt || !receiptRef.current) {
      return;
    }

    try {
      const blob =
        format === "pdf"
          ? await createReceiptPdfBlob(receiptRef.current)
          : await renderReceiptImage(receiptRef.current);
      const extension = format === "pdf" ? "pdf" : "png";
      const mimeType = format === "pdf" ? "application/pdf" : "image/png";
      const file = new File([blob], `receipt-${receipt.referenceNumber}.${extension}`, {
        type: mimeType,
      });

      setSharePickerOpen(false);

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Transaction Receipt",
          files: [file],
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      const fallbackText = [
        "KunThai Money Transaction Receipt",
        `Recipient: ${receipt.recipientName}`,
        `Amount: ${formatCurrency(receipt.amount, currency)}`,
        `Transaction ID: ${receipt.transactionId}`,
        `Reference Number: ${receipt.referenceNumber}`,
        `Status: ${receipt.status}`,
      ].join("\n");

      await navigator.clipboard?.writeText?.(fallbackText);
    }
  };

  const handleReset = () => {
    setStep("form");
    setForm({
      ...INITIAL_FORM,
      accountNumber:
        conversionConfig?.targetAccount?.account_number || initialValues?.accountNumber || "",
      amount: initialValues?.amount ? String(initialValues.amount) : "",
      reason: initialValues?.reason || "",
    });
    setPin("");
    setError("");
    setRecipientLookup(null);
    setReceipt(null);
    setPendingSuccessTransfer(null);
    setSharePickerOpen(false);
  };

  if (step === "receipt" && receipt) {
    return (
      <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"}`}>
        <div className="mb-4">
          <ActionBanner tone="success" title="Transaction Successful">
            Your cash out receipt is ready below.
          </ActionBanner>
        </div>

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

        <div ref={receiptRef} className="space-y-4">
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
              {receipt.isConversion ? (
                <ReceiptRow
                  label="Converted Amount"
                  value={`${receipt.targetCurrency} ${formatExchangeNumber(receipt.convertedAmount || 0)}`}
                />
              ) : null}
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
              {receipt.isConversion ? (
                <ReceiptRow
                  label="Exchange Rate"
                  value={`1 ${receipt.sourceCurrency} = ${formatExchangeNumber(receipt.exchangeRate || 1)} ${receipt.targetCurrency}`}
                />
              ) : null}
              <ReceiptRow label="Reference Number" value={receipt.referenceNumber} />
              <ReceiptRow label="Payment Method" value={receipt.paymentMethod} />
            </div>
          </section>

          {sharePickerOpen ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleShareReceiptFile("image")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Share2 size={16} />
                <span>Share as Image</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareReceiptFile("pdf")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ReceiptText size={16} />
                <span>Share as PDF</span>
              </button>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSharePickerOpen((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Share2 size={16} />
              <span>{sharePickerOpen ? "Close Share" : "Share"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "pin") {
    return (
      <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <button
            type="button"
            onClick={() => setStep("confirm")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            <span>{backLabel}</span>
          </button>

        <div className="mb-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Transaction PIN</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">Enter your PIN</h3>
          <p className="mt-2 text-sm text-slate-500">Enter the correct transaction PIN to complete this transfer securely.</p>
        </div>

        {error ? (
          <div className="mb-4">
            <ActionBanner tone="danger" title={resolvePinBannerTitle(error)}>
              {error}
            </ActionBanner>
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
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
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
      <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            <span>{backLabel}</span>
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
                name={effectiveRecipientLookup?.recipient_name || form.accountNumber.trim()}
                image={effectiveRecipientLookup?.recipient_profile_image}
              />
              <div>
                <p className="text-base font-semibold text-slate-950">{effectiveRecipientLookup?.recipient_name}</p>
                <p className="mt-1 text-sm text-slate-500">{form.accountNumber.trim()}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Transaction Details</p>
            <div className="mt-3 divide-y divide-slate-100">
              <ReceiptRow label="Amount" value={formatCurrency(numericAmount || 0, currency)} />
              {isConversionFlow ? (
                <ReceiptRow
                  label="Converted Amount"
                  value={`${targetCurrency} ${formatExchangeNumber(convertedAmount || 0)}`}
                />
              ) : null}
              <ReceiptRow label="Tax" value={formatCurrency(taxAmount, currency)} />
              <ReceiptRow label="Transaction Fee" value={formatCurrency(transactionFee, currency)} />
              {isConversionFlow ? (
                <ReceiptRow
                  label="Exchange Rate"
                  value={
                    fxState.rate
                      ? `1 ${currency} = ${formatExchangeNumber(fxState.rate)} ${targetCurrency}`
                      : "Loading live rate"
                  }
                />
              ) : null}
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
    <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"}`}>
      <div className={`mb-5 rounded-2xl border p-4 ${isDarkMode ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"}`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm ${isDarkMode ? "bg-slate-900 text-emerald-300" : "bg-white text-emerald-700"}`}>
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
          <ActionBanner tone="danger" title="Cash out unsuccessful">
            {error}
          </ActionBanner>
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
              disabled={isConversionFlow}
            className="w-full bg-transparent py-3 text-[16px] text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-500"
            />
            {recipientStateIcon}
          </div>
          {!isConversionFlow ? (
            <p className={`mt-2 text-xs ${effectiveRecipientLookup?.is_valid ? "text-emerald-600" : effectiveRecipientLookup ? "text-rose-600" : "text-slate-400"}`}>
              {effectiveRecipientLookup?.message || "We will validate the account number automatically."}
            </p>
          ) : null}
          {effectiveRecipientLookup?.is_valid && !isConversionFlow ? (
            <p className="mt-1 text-sm font-semibold text-slate-900">{effectiveRecipientLookup.recipient_name}</p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <ReceiptText size={14} />
            Amount
          </span>
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <span className="text-[16px] font-semibold text-slate-500">{currency}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => handleChange("amount", event.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent px-3 py-3 text-[16px] text-slate-900 outline-none"
            />
          </div>
        </label>

        {isConversionFlow ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Converted Amount
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {fxState.loading
                ? "Loading live conversion..."
                : fxState.rate
                  ? `${targetCurrency} ${formatExchangeNumber(convertedAmount || 0)}`
                  : "Conversion preview unavailable"}
            </p>
            <p className={`mt-2 text-xs ${fxState.error ? "text-rose-600" : "text-slate-500"}`}>
              {fxState.error ||
                (fxState.rate
                  ? `Live rate: 1 ${currency} = ${formatExchangeNumber(fxState.rate)} ${targetCurrency}`
                  : "We are fetching the latest conversion rate.")}
            </p>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason</span>
          <textarea
            rows="3"
            value={form.reason}
            onChange={(event) => handleChange("reason", event.target.value)}
            placeholder="Optional note for this transfer"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
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
