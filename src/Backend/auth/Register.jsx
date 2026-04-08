import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import supabase from "../../Backend/lib/supabaseClient";
import {
  buildInternationalPhone,
  ecowasCountries,
  formatPhoneInput,
  getCountryByCode,
  validateNationalPhone,
} from "../utils/ecowasCountries";
import { getPhoneAuthStatus } from "../services/authPhoneService";
import { setOnboardingPhone } from "../utils/onboardingStorage";
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

      const { error: signUpError } = await supabase.auth.signUp({
        phone: fullPhone,
        password,
        options: {
          channel: "sms",
        },
      });

      if (signUpError) {
        throw signUpError;
      }

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
        subtitle="Register with your mobile number and password, then verify your phone with OTP to start onboarding."
        footer={
          <>
            Already registered?{" "}
            <button className="font-semibold text-cyan-200" onClick={() => navigate("/login")}>
              Sign in here
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="mb-6 flex w-full items-center gap-2">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex h-12 w-16 items-center justify-center gap-1 rounded-lg border bg-white px-2"
              >
                <FlagIcon code={selected.flag} className="h-5 w-7 rounded-[4px] shadow-sm" />
                <ChevronDown size={14} />
              </button>

              {open && (
                <div className="absolute left-0 top-14 z-30 max-h-60 w-56 overflow-y-auto rounded-lg bg-white shadow-xl">
                  {ecowasCountries.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => {
                        setSelected(country);
                        setOpen(false);
                        setPhone("");
                        setError("");
                      }}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      <FlagIcon code={country.flag} className="h-4 w-6 rounded-[3px] shadow-sm" />
                      <span>{country.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex h-12 min-w-[65px] flex-shrink-0 items-center justify-center rounded-lg border px-2 text-sm">
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
              className="h-12 min-w-0 flex-1 rounded-lg border px-2 text-sm focus:outline-none sm:px-3 sm:text-base"
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
            className="h-12 w-full rounded-lg border px-3 text-sm focus:outline-none sm:text-base"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError("");
              setExistingPhone("");
            }}
            placeholder="Confirm password"
            className="h-12 w-full rounded-lg border px-3 text-sm focus:outline-none sm:text-base"
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
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
              loading ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {loading ? "Sending OTP..." : "Create Account"}
          </button>
        </div>
      </AuthShell>
    </PageTransition>
  );
}
