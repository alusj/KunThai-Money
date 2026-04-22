import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { resetPasswordWithOtp } from "../services/authOtpService";
import { maskPhoneNumber } from "../utils/maskPhoneNumber";
import {
  clearOtpVerificationSession,
  getOnboardingPhone,
  getOtpVerificationSession,
} from "../utils/onboardingStorage";
import PageTransition from "../../components/animations/PageTransition";
import AuthNotice from "../../components/auth/AuthNotice";
import AuthShell from "../../components/auth/AuthShell";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = useMemo(
    () => location.state?.phone || getOnboardingPhone() || "",
    [location.state?.phone]
  );
  const verificationToken = useMemo(
    () => location.state?.verificationToken || getOtpVerificationSession()?.verificationToken || "",
    [location.state?.verificationToken]
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }

    setLoading(true);

    try {
      if (!verificationToken) {
        throw new Error("Your reset session expired. Request another OTP and try again.");
      }

      await resetPasswordWithOtp({
        phone,
        password: newPassword,
        verificationToken,
      });

      clearOtpVerificationSession();
      setSuccess("Password updated successfully. Redirecting you to sign in...");

      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: phone ? { phone } : undefined,
        });
      }, 900);
    } catch (err) {
      setError(err.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthShell
        eyebrow="Password Recovery"
        title="Create a new password"
        subtitle={
          phone
            ? `Your identity has been verified for ${maskPhoneNumber(phone)}. Create a new password to continue.`
            : "Your identity has been verified. Create a new password to continue."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <AuthNotice tone="danger" title="Reset incomplete">
              {error}
            </AuthNotice>
          )}

          {success && (
            <AuthNotice tone="success" title="Password updated">
              {success}
            </AuthNotice>
          )}

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              New Password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#28456f] bg-[#10213f] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              Confirm New Password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#28456f] bg-[#10213f] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-2xl py-3 font-semibold text-white transition ${
              loading ? "bg-[#31507f]" : "bg-[#2563eb] hover:bg-[#3b82f6]"
            }`}
          >
            {loading ? "Saving new password..." : "Save new password"}
          </button>
        </form>
      </AuthShell>
    </PageTransition>
  );
}
