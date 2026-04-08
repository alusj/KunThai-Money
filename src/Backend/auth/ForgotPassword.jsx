import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(ecowasCountries[0]);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prefillPhone = location.state?.phone;
    const prefillCountryCode = location.state?.countryCode;

    if (!prefillPhone || !prefillCountryCode) {
      return;
    }

    const matchedCountry = getCountryByCode(prefillCountryCode);

    if (matchedCountry) {
      setSelected(matchedCountry);
      setPhone(prefillPhone);
    }
  }, [location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validation = validateNationalPhone(selected, phone);

    if (!validation.valid) {
      setError(validation.reason);
      return;
    }

    setLoading(true);
    const fullPhone = buildInternationalPhone(selected, validation.digits);

    try {
      const phoneStatus = await getPhoneAuthStatus(fullPhone);

      if (!phoneStatus?.is_registered) {
        setError("We couldn't find an account for this phone number.");
        return;
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        throw otpError;
      }

      setOnboardingPhone(fullPhone);
      navigate("/verify", {
        state: {
          phone: fullPhone,
          intent: "reset-password",
        },
      });
    } catch (err) {
      const message = err.message?.toLowerCase?.() || "";

      if (message.includes("rate limit")) {
        setError("OTP sending is temporarily rate-limited. Please wait a moment and try again.");
      } else {
        setError(err.message || "Unable to send reset OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthShell
        eyebrow="Password Recovery"
        title="Forgot your password?"
        subtitle="Enter your registered phone number and we will send you a secure OTP to reset your password."
        footer={
          <button className="font-semibold text-cyan-200" onClick={() => navigate("/login")}>
            Return to sign in
          </button>
        }
      >
        <div className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex w-full items-center gap-2">
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
                }}
                placeholder={selected.format}
                className="h-12 min-w-0 flex-1 rounded-lg border px-2 text-sm focus:outline-none sm:px-3 sm:text-base"
              />
            </div>

            {error && (
              <AuthNotice tone="danger" title="Unable to continue">
                {error}
              </AuthNotice>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl py-3 font-semibold text-white transition ${
                loading ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
              }`}
            >
              {loading ? "Sending OTP..." : "Send reset OTP"}
            </button>
          </form>
        </div>
      </AuthShell>
    </PageTransition>
  );
}
