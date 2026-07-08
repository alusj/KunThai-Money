import { useEffect, useState } from "react";
import { Fingerprint, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";

import ActionBanner from "../feedback/ActionBanner";

export default function HomeUnlockGate({
  profileName = "User",
  biometricEnabled = false,
  biometricBusy = false,
  notice = null,
  onVerifyBiometric,
  onVerifyPin,
  onForgotPin,
  onSignOut,
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricFailureCount, setBiometricFailureCount] = useState(0);
  const [showPinEntry, setShowPinEntry] = useState(!biometricEnabled);

  useEffect(() => {
    setBiometricFailureCount(0);
    setShowPinEntry(!biometricEnabled);
    setPin("");
    setError("");
  }, [biometricEnabled, notice?.message, notice?.title]);

  const handlePinSubmit = async () => {
    setError("");

    if (!/^\d{6}$/.test(pin)) {
      setError("Enter your 6-digit transaction PIN.");
      return;
    }

    setLoading(true);

    try {
      await onVerifyPin?.(pin);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "We could not verify your PIN."
      );
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    setError("");

    try {
      await onVerifyBiometric?.();
      setBiometricFailureCount(0);
    } catch (submitError) {
      setBiometricFailureCount((current) => current + 1);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not verify your biometric identity."
      );
    }
  };

  const canUsePinFallback = !biometricEnabled || biometricFailureCount >= 2;
  const firstName = (profileName || "").trim().split(/\s+/)[0] || "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(110,231,255,0.14),transparent_30%),linear-gradient(180deg,#030712_0%,#071632_44%,#0b2152_78%,#041126_100%)] px-6 py-10 text-center text-white">
      <div className="w-full max-w-sm">
        {notice?.message ? (
          <div className="mb-8 text-left">
            <ActionBanner tone={notice.tone || "info"} title={notice.title || "Security update"}>
              {notice.message}
            </ActionBanner>
          </div>
        ) : null}

        <div className="relative mx-auto h-20 w-20">
          <div className="absolute inset-0 rounded-[26px] bg-sky-400/25 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] border border-sky-200/25 bg-[linear-gradient(160deg,#1d4ed8,#2563eb_55%,#38bdf8)] text-4xl font-bold shadow-[0_18px_50px_rgba(37,99,235,0.4)]">
            K
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#0b1a38] text-sky-200 shadow-lg">
            <Lock size={14} />
          </div>
        </div>

        <h1 className="mt-7 text-3xl font-bold tracking-tight">KunTai Money</h1>
        <p className="mt-2 text-sm text-slate-300/90">
          Locked{firstName ? ` · ${firstName}` : ""}
        </p>

        {error ? (
          <div className="mt-6 text-left">
            <ActionBanner tone="danger" title="Unlock unsuccessful">
              {error}
            </ActionBanner>
          </div>
        ) : null}

        <div className="mt-9">
          {biometricEnabled ? (
            <button
              type="button"
              onClick={handleBiometric}
              disabled={biometricBusy || loading}
              className={`inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-sm font-semibold text-white transition ${
                biometricBusy || loading
                  ? "bg-slate-600"
                  : "bg-[#2563eb] shadow-[0_16px_44px_rgba(37,99,235,0.35)] hover:bg-[#3b82f6]"
              }`}
            >
              {biometricBusy ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
              <span>{biometricBusy ? "Checking biometrics..." : "Unlock with biometrics"}</span>
            </button>
          ) : null}

          {showPinEntry ? (
            <div className={biometricEnabled ? "mt-5" : ""}>
              <input
                type="password"
                inputMode="numeric"
                maxLength="6"
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handlePinSubmit();
                  }
                }}
                placeholder="6-digit PIN"
                aria-label="Transaction PIN"
                className="w-full rounded-full border border-white/12 bg-white/[0.06] px-6 py-4 text-center text-[16px] font-semibold tracking-[0.5em] text-white outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-sky-300/40 focus:bg-white/[0.09]"
              />

              <button
                type="button"
                onClick={handlePinSubmit}
                disabled={loading || biometricBusy}
                className={`mt-4 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-sm font-semibold text-white transition ${
                  loading || biometricBusy
                    ? "bg-slate-600"
                    : "bg-[#2563eb] shadow-[0_16px_44px_rgba(37,99,235,0.35)] hover:bg-[#3b82f6]"
                }`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                <span>{loading ? "Verifying..." : "Unlock with PIN"}</span>
              </button>
            </div>
          ) : canUsePinFallback ? (
            <button
              type="button"
              onClick={() => {
                setShowPinEntry(true);
                setError("");
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.09]"
            >
              <KeyRound size={16} />
              <span>Use transaction PIN</span>
            </button>
          ) : null}
        </div>

        <div className="mt-9 flex items-center justify-center gap-6 text-sm">
          <button
            type="button"
            onClick={onForgotPin}
            className="font-semibold text-slate-300 transition hover:text-white"
          >
            Forgot PIN?
          </button>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <button
            type="button"
            onClick={onSignOut}
            className="font-semibold text-slate-300 transition hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
