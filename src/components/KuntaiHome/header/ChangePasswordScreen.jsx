import { useState } from "react";

import supabase from "../../../Backend/lib/supabaseClient";
import BackTab from "./Transactions/BackTab";

export default function ChangePasswordScreen({ user, onBack }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
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

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess("Password updated successfully.");
      window.setTimeout(() => onBack?.(), 700);
    } catch (err) {
      setError(err.message || "Unable to update your password.");
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
            <h1 className="mt-2 text-lg font-bold text-slate-950 md:text-xl">Change password</h1>
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
                Current Password
              </span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                New Password
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Confirm New Password
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
            {loading ? "Saving password..." : "Save password"}
          </button>
        </div>
      </div>
    </div>
  );
}
