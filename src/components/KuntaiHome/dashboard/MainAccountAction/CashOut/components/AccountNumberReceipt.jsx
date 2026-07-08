import { useRef, useState } from "react";
import { ArrowLeft, ReceiptText, Share2 } from "lucide-react";
import { formatCurrency } from "../../../../../../Backend/utils/formatCurrency";
import {
  formatExchangeNumber,
  ReceiptRow,
  RecipientAvatar,
  StatusBadge,
} from "../accountNumber.utils";
import {
  createReceiptPdfBlob,
  renderReceiptImage,
} from "../receiptExport";

export default function AccountNumberReceipt({
  receipt,
  currency,
  isDarkMode,
  successBanner,
  onBack,
  onDone,
}) {
  const [sharePickerOpen, setSharePickerOpen] = useState(false);
  const receiptRef = useRef(null);

  const buildReceiptFile = async (format) => {
    const blob =
      format === "pdf"
        ? await createReceiptPdfBlob(receiptRef.current)
        : await renderReceiptImage(receiptRef.current);

    const extension = format === "pdf" ? "pdf" : "png";
    const mimeType = format === "pdf" ? "application/pdf" : "image/png";

    return {
      blob,
      extension,
      file: new File([blob], `receipt-${receipt.referenceNumber}.${extension}`, {
        type: mimeType,
      }),
    };
  };

  const handleShareReceipt = async () => {
    if (!receipt || !receiptRef.current) return;

    try {
      const [imageAsset, pdfAsset] = await Promise.all([
        buildReceiptFile("image"),
        buildReceiptFile("pdf"),
      ]);
      const shareFiles = [imageAsset.file, pdfAsset.file];

      if (navigator.share && navigator.canShare?.({ files: shareFiles })) {
        await navigator.share({
          title: receipt.title || "Transaction Receipt",
          files: shareFiles,
        });
        return;
      }
    } catch (error) {
      console.error("Native share failed:", error);
    }

    setSharePickerOpen(true);
  };

  const handleShareReceiptFile = async (format) => {
    if (!receipt || !receiptRef.current) return;

    try {
      const { blob, file } = await buildReceiptFile(format);
      setSharePickerOpen(false);

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Transaction Receipt",
      text: "KunTai Money receipt",
          files: [file],
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const isiPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isiPhone) {
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return;
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Receipt export failed:", error);
    }
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"}`}>
      <div className="mb-4 rounded-xl bg-emerald-50 p-4 text-emerald-800">
        <p className="font-semibold">
          {successBanner?.title || "Transaction Successful"}
        </p>
        <p className="text-sm">
          {successBanner?.message || "Your cash out receipt is ready below."}
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
        >
          Done
        </button>
      </div>

      <div className="mb-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
          {receipt.subject || receipt.transactionSubject || "Transaction"}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-slate-950">{receipt.title || "Receipt details"}</h3>
          <StatusBadge status={receipt.status} />
        </div>
      </div>

      <div ref={receiptRef} className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-4">
            <RecipientAvatar
              name={receipt.recipientName}
              image={receipt.recipientProfileImage}
            />
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
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Extra Details
          </p>
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
                value={`1 ${receipt.sourceCurrency} = ${formatExchangeNumber(
                  receipt.exchangeRate || 1
                )} ${receipt.targetCurrency}`}
              />
            ) : null}
            <ReceiptRow label="Reference Number" value={receipt.referenceNumber} />
            <ReceiptRow label="Payment Method" value={receipt.paymentMethod} />
          </div>
        </section>
      </div>

      <div className="mt-4 space-y-3">
        {sharePickerOpen ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleShareReceiptFile("image")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <Share2 size={16} />
              <span>Share as Image</span>
            </button>
            <button
              type="button"
              onClick={() => handleShareReceiptFile("pdf")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <ReceiptText size={16} />
              <span>Share as PDF</span>
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShareReceipt}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
