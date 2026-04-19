import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import ActionBanner from "../../../../../feedback/ActionBanner";
import { resolvePinBannerTitle } from "../accountNumber.utils.jsx";

export default function AccountNumberPin({
  isDarkMode,
  error,
  pin,
  backLabel,
  isSubmitting,
  onBack,
  onChangePin,
  onForgotPin,
  onSubmit,
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"}`}>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
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
        <span className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Transaction PIN
        </span>
        <input
          type="password"
          inputMode="numeric"
          maxLength="6"
          value={pin}
          onChange={(event) => onChangePin(event.target.value)}
          placeholder="Enter 6-digit PIN"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[16px] text-slate-900"
        />
      </label>

      <button
        type="button"
        onClick={onForgotPin}
        className="mt-4 w-full text-sm font-semibold text-slate-600"
      >
        Forgot transaction PIN?
      </button>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white ${
          isSubmitting ? "bg-slate-400" : "bg-slate-950"
        }`}
      >
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        <span>{isSubmitting ? "Processing..." : "Submit PIN"}</span>
      </button>
    </div>
  );
}