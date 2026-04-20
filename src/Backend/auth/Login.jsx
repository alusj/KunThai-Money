import { useEffect, useMemo, useState } from "react";
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
import { clearStoredHomeScreen } from "../utils/homeScreenSession";
import { getPhoneAuthStatus } from "../services/authPhoneService";
import { setOnboardingPhone } from "../utils/onboardingStorage";
import PageTransition from "../../components/animations/PageTransition";
import AuthNotice from "../../components/auth/AuthNotice";
import AuthShell from "../../components/auth/AuthShell";
import FlagIcon from "../../components/FlagIcon";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(ecowasCountries[0]);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

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

  const notice = useMemo(() => {
    const reason = new URLSearchParams(location.search).get("reason");

    if (reason === "signed-out") {
      return {
        tone: "info",
        title: "Signed out securely",
        body: "Your session has ended successfully. Sign in again whenever you're ready.",
      };
    }

    if (reason === "session-expired") {
      return {
        tone: "warning",
        title: "Session expired",
        body: "For your security, your session ended. Sign in again to continue.",
      };
    }

    if (reason === "pin-reset") {
      return {
        tone: "info",
        title: "Reset your transaction PIN",
        body: "Sign in with your password to create a new transaction PIN before returning to your account.",
      };
    }

    return null;
  }, [location.search]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    const validation = validateNationalPhone(selected, phone);

    if (!validation.valid) {
      setError(validation.reason);
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    const fullPhone = buildInternationalPhone(selected, validation.digits);

    try {
      const phoneStatus = await getPhoneAuthStatus(fullPhone);

      if (!phoneStatus?.is_registered) {
        setError("We couldn't find an account for this phone number. Please create your account first.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone: fullPhone,
        password,
      });

      if (signInError) {
        const normalizedMessage = signInError.message?.toLowerCase?.() || "";

        if (
          normalizedMessage.includes("invalid login credentials") ||
          normalizedMessage.includes("invalid credentials")
        ) {
          const nextFailedAttempts = failedAttempts + 1;
          setFailedAttempts(nextFailedAttempts);
          setError(
            nextFailedAttempts >= 3
              ? "Incorrect phone number or password. Forgot password? Reset it with OTP below."
              : "Incorrect phone number or password."
          );
          return;
        }

        if (
          normalizedMessage.includes("email not confirmed") ||
          normalizedMessage.includes("phone not confirmed")
        ) {
          setError("Your phone number is not verified yet. Complete OTP verification first.");
          return;
        }

        throw signInError;
      }

      setOnboardingPhone(fullPhone);
      clearStoredHomeScreen();
      setFailedAttempts(0);
      navigate("/welcome-loader", { replace: true });
    } catch (err) {
      const normalizedMessage = err.message?.toLowerCase?.() || "";

      if (normalizedMessage.includes("get_phone_auth_status")) {
        setError("The phone-check SQL is not installed yet. Run `auth_phone_guard.sql` in Supabase first.");
      } else {
        setError(err.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthShell
        eyebrow="Returning Customer"
        title="Sign in to KunThai Money"
        subtitle="Use your registered phone number and password to continue securely to your account."
        footer={
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 py-2 text-slate-200 shadow-[0_12px_30px_rgba(2,6,18,0.25)] backdrop-blur-xl">
            <span>Don&apos;t have an account?</span>
            <button
              className="font-semibold text-white underline decoration-sky-300/80 underline-offset-4 transition hover:text-sky-200"
              onClick={() => navigate("/register")}
            >
              Create one now
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {notice && (
            <AuthNotice tone={notice.tone} title={notice.title}>
              {notice.body}
            </AuthNotice>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex w-full items-center gap-2">
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
                  setFailedAttempts(0);
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
              }}
              placeholder="Password"
              className="h-12 w-full rounded-xl border border-[#28456f] bg-[#10213f] px-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 sm:text-base"
            />

            {error && (
              <AuthNotice tone="danger" title="Unable to continue">
              {error}
            </AuthNotice>
          )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl py-3 font-semibold text-white transition ${
                loading ? "bg-[#31507f]" : "bg-[#2563eb] hover:bg-[#3b82f6]"
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/forgot-password", {
                  state: {
                    phone,
                    countryCode: selected.code,
                  },
                })
              }
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(2,6,18,0.22)] transition hover:border-sky-300/30 hover:bg-white/[0.09] hover:text-sky-100"
            >
              {failedAttempts >= 3 ? "Forgot password? Request OTP" : "Forgot password?"}
            </button>
          </form>
        </div>
      </AuthShell>
    </PageTransition>
  );
}
