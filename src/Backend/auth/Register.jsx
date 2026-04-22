import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronDown } from "lucide-react";

import {
  buildInternationalPhone,
  ecowasCountries,
  formatPhoneInput,
  getCountryByCode,
  validateNationalPhone,
} from "../utils/ecowasCountries";
import { getPhoneAuthStatus } from "../services/authPhoneService";
import { sendOtpCode } from "../services/authOtpService";
import {
  clearOtpVerificationSession,
  setOnboardingPhone,
  setPendingRegistration,
} from "../utils/onboardingStorage";
import PageTransition from "../../components/animations/PageTransition";
import AuthNotice from "../../components/auth/AuthNotice";
import AuthShell from "../../components/auth/AuthShell";
import FlagIcon from "../../components/FlagIcon";

export default function Register() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(ecowasCountries[0]);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingPhone, setExistingPhone] = useState("");

  const passwordChecks = [
    {
      label: "At least 8 characters",
      passed: password.length >= 8,
    },
    {
      label: "Include an uppercase letter",
      passed: /[A-Z]/.test(password),
    },
    {
      label: "Include a lowercase letter",
      passed: /[a-z]/.test(password),
    },
    {
      label: "Include a number",
      passed: /\d/.test(password),
    },
  ];

  const passedPasswordChecks = passwordChecks.filter((item) => item.passed).length;
  const passwordRecommendation =
    password.length === 0
      ? "Password should be at least 8 characters. Mixing uppercase, lowercase, and numbers is recommended for stronger protection."
      : password.length < 8
        ? "Too short. Add more characters until your password reaches at least 8."
        : passedPasswordChecks <= 2
          ? "Password length is valid. You can still make it stronger by mixing letters and numbers."
          : "Good password. The extra mix makes your account safer.";
  const passwordRecommendationTone =
    password.length === 0
      ? "text-slate-300"
      : password.length < 8
        ? "text-amber-300"
        : passedPasswordChecks <= 2
          ? "text-sky-300"
          : "text-emerald-300";

  const handleVerify = async () => {
    const validation = validateNationalPhone(selected, phone);

    if (!validation.valid) {
      setError(validation.reason);
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }

    setLoading(true);
    setError("");

    const fullPhone = buildInternationalPhone(selected, validation.digits);

    try {
      const phoneStatus = await getPhoneAuthStatus(fullPhone);

      if (phoneStatus?.is_registered) {
        setExistingPhone(fullPhone);
        setError("An account with this phone number already exists. Please sign in instead.");
        return;
      }

      setPendingRegistration({
        phone: fullPhone,
        password,
      });
      clearOtpVerificationSession();
      await sendOtpCode({ phone: fullPhone });
      setOnboardingPhone(fullPhone);
      navigate("/verify", { state: { phone: fullPhone, intent: "register" } });
    } catch (err) {
      const normalizedMessage = err.message?.toLowerCase?.() || "";

      if (normalizedMessage.includes("get_phone_auth_status")) {
        setError("The phone-check SQL is not installed yet. Run `auth_phone_guard.sql` in Supabase first.");
      } else if (normalizedMessage.includes("rate limit")) {
        setError("OTP sending is temporarily rate-limited. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    if (!existingPhone) {
      navigate("/login");
      return;
    }

    const matchedCountry =
      ecowasCountries.find((country) => existingPhone.startsWith(country.code)) ||
      getCountryByCode(selected.code) ||
      ecowasCountries[0];

    const nationalDigits = existingPhone.slice(matchedCountry.code.length);

    navigate("/login", {
      state: {
        phone: formatPhoneInput(nationalDigits, matchedCountry.format),
        countryCode: matchedCountry.code,
      },
    });
  };

  return (
    <PageTransition>
      <AuthShell
        eyebrow="New Customer"
        title="Create your account"
        subtitle="Register with your mobile number and a secure password, then verify your phone with OTP to start onboarding."
        footer={
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 py-2 text-slate-200 shadow-[0_12px_30px_rgba(2,6,18,0.25)] backdrop-blur-xl">
            <span>Already registered?</span>
            <button
              className="font-semibold text-white underline decoration-sky-300/80 underline-offset-4 transition hover:text-sky-200"
              onClick={() => navigate("/login")}
            >
              Sign in here
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="mb-6 flex w-full items-center gap-2">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex h-12 w-16 items-center justify-center gap-1 rounded-xl border border-[#28456f] bg-[#10213f] px-2 text-slate-100"
              >
                <FlagIcon code={selected.flag} className="h-5 w-7 rounded-[4px] shadow-sm" />
                <ChevronDown size={14} />
              </button>

              {open && (
                <div className="absolute left-0 top-14 z-30 max-h-60 w-56 overflow-y-auto rounded-2xl border border-[#28456f] bg-[#0d1b34] shadow-2xl">
                  {ecowasCountries.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => {
                        setSelected(country);
                        setOpen(false);
                        setPhone("");
                        setError("");
                      }}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/5"
                    >
                      <FlagIcon code={country.flag} className="h-4 w-6 rounded-[3px] shadow-sm" />
                      <span>{country.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex h-12 min-w-[65px] flex-shrink-0 items-center justify-center rounded-xl border border-[#28456f] bg-[#10213f] px-2 text-sm text-slate-100">
              {selected.code}
            </div>

            <input
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(formatPhoneInput(event.target.value, selected.format));
                setError("");
                setExistingPhone("");
              }}
              placeholder={selected.format}
              className="h-12 min-w-0 flex-1 rounded-xl border border-[#28456f] bg-[#10213f] px-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 sm:px-3 sm:text-base"
            />
          </div>

          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
              setExistingPhone("");
            }}
            placeholder="Create password"
            className="h-12 w-full rounded-xl border border-[#28456f] bg-[#10213f] px-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 sm:text-base"
          />

          <div className="rounded-2xl border border-[#28456f] bg-[#10213f] px-4 py-3">
            <p className="text-sm font-semibold text-slate-100">Password should be at least 8 characters</p>
            <p className={`mt-2 text-sm leading-6 ${passwordRecommendationTone}`}>{passwordRecommendation}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {passwordChecks.map((item) => (
                <div key={item.label} className="inline-flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      item.passed ? "bg-emerald-400/20 text-emerald-300" : "bg-white/8 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 size={14} />
                  </span>
                  <span className={item.passed ? "text-emerald-200" : "text-slate-400"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError("");
              setExistingPhone("");
            }}
            placeholder="Confirm password"
            className="h-12 w-full rounded-xl border border-[#28456f] bg-[#10213f] px-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 sm:text-base"
          />

          {error && (
            <div className="space-y-3">
              <AuthNotice tone="danger" title="Registration unavailable">
                {error}
              </AuthNotice>
              {existingPhone && (
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="w-full rounded-2xl border border-[#31507f] bg-[#10213f] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-[#14284d]"
                >
                  Sign in instead
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading}
            className={`w-full rounded-2xl py-3 font-semibold text-white transition ${
              loading ? "bg-[#31507f]" : "bg-[#2563eb] hover:bg-[#3b82f6]"
            }`}
          >
            {loading ? "Sending OTP..." : "Create Account"}
          </button>
        </div>
      </AuthShell>
    </PageTransition>
  );
}
