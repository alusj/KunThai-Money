import { useState } from "react";

import supabase from "../../../Backend/lib/supabaseClient";
import BackTab from "./Transactions/BackTab";

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
    return "Transaction PIN setup is not ready in this database yet. Run the PIN security SQL fix in Supabase, then try again.";
  }

  return message;
}

export default function ChangePinScreen({ user, onBack }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }

    if (!/^\d{6}$/.test(newPin)) {
      setError("Your new PIN must be exactly 6 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setError("PIN and confirmation do not match.");
      return;
    }

    if (!user?.phone) {
      setError("This account does not have a phone number available for password verification.");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone: user.phone,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Your current password is incorrect.");
      }

      const { error: pinError } = await supabase.rpc("set_user_pin", {
        p_pin: newPin,
      });

      if (pinError) {
        throw pinError;
      }

      setSuccess("PIN updated successfully.");
      window.setTimeout(() => onBack?.(), 700);
    } catch (err) {
      setError(resolveErrorMessage(err, "Unable to update your PIN."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Security
            </p>
            <h1 className="mt-2 text-lg font-bold text-slate-950 md:text-xl">Change PIN</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          {error ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="space-y-4">
            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Login Password
              </span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
              <p className="mt-2 text-sm text-slate-500">
                Enter the password you use to sign in. This screen does not use your old transaction PIN for verification.
              </p>
            </label>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                New PIN
              </span>
              <input
                type="password"
                inputMode="numeric"
                maxLength="6"
                value={newPin}
                onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Confirm New PIN
              </span>
              <input
                type="password"
                inputMode="numeric"
                maxLength="6"
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`mt-8 w-full rounded-[24px] px-5 py-4 text-sm font-semibold text-white transition ${
              loading ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {loading ? "Saving PIN..." : "Save PIN"}
          </button>
        </div>
      </div>
    </div>
  );
}
