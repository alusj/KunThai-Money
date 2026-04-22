import { useState } from "react";
import { Fingerprint, KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";

import ActionBanner from "../feedback/ActionBanner";

export default function HomeUnlockGate({
  profileName = "User",
  phone = "",
  biometricEnabled = false,
  biometricBusy = false,
  onVerifyBiometric,
  onVerifyPin,
  onSignOut,
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not verify your biometric identity."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-950 text-white shadow-lg">
            <ShieldCheck size={28} />
          </div>

          <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-400">
            Account Access
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Unlock your home</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Welcome back{profileName ? `, ${profileName}` : ""}. Use your biometrics or 6-digit
            transaction PIN to continue into KunTai Money.
          </p>
          {phone ? <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{phone}</p> : null}

          {error ? (
            <div className="mt-6">
              <ActionBanner tone="danger" title="Unlock unsuccessful">
                {error}
              </ActionBanner>
            </div>
          ) : null}

          {biometricEnabled ? (
            <button
              type="button"
              onClick={handleBiometric}
              disabled={biometricBusy || loading}
              className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-[24px] px-5 py-4 text-sm font-semibold text-white transition ${
                biometricBusy || loading ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
              }`}
            >
              {biometricBusy ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
              <span>{biometricBusy ? "Checking biometrics..." : "Use biometrics"}</span>
            </button>
          ) : null}

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                <KeyRound size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950">Use transaction PIN</p>
                <p className="text-sm text-slate-500">This protects returning access to your home screen.</p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Transaction PIN
              </span>
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
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[16px] text-slate-900 outline-none transition focus:border-slate-300"
              />
            </label>

            <button
              type="button"
              onClick={handlePinSubmit}
              disabled={loading || biometricBusy}
              className={`mt-5 inline-flex w-full items-center justify-center gap-3 rounded-[24px] px-5 py-4 text-sm font-semibold text-white transition ${
                loading || biometricBusy ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              <span>{loading ? "Verifying PIN..." : "Unlock with PIN"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <LogOut size={16} />
            <span>Sign out instead</span>
          </button>
        </div>
      </div>
    </div>
  );
}
