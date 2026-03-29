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
  const [error, setError] = useState("");
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

    return null;
  }, [location.search]);

  const handlePhoneChange = (event) => {
    setPhone(formatPhoneInput(event.target.value, selected.format));
    setError("");
  };

  const handleCountrySelect = (country) => {
    setSelected(country);
    setOpen(false);
    setPhone("");
    setError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const validation = validateNationalPhone(selected, phone);

    if (!validation.valid) {
      setError(validation.reason);
      return;
    }

    setLoading(true);
    setError("");

    const fullPhone = buildInternationalPhone(selected, validation.digits);

    try {
      const phoneStatus = await getPhoneAuthStatus(fullPhone);

      if (!phoneStatus?.is_registered) {
        setError("We couldn't find an account for this phone number. Please create your account first.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          shouldCreateUser: false,
        },
      });

      if (signInError) {
        const normalizedMessage = signInError.message?.toLowerCase?.() || "";

        if (
          normalizedMessage.includes("signups not allowed") ||
          normalizedMessage.includes("user not found") ||
          normalizedMessage.includes("invalid phone number")
        ) {
          setError("We couldn't find an account for this phone number. Please create your account first.");
          return;
        }

        if (normalizedMessage.includes("rate limit")) {
          setError("OTP sending is temporarily rate-limited. Please wait a moment and try again.");
          return;
        }

        throw signInError;
      }

      setOnboardingPhone(fullPhone);
      navigate("/verify", { state: { phone: fullPhone, intent: "login" } });
    } catch (err) {
      const normalizedMessage = err.message?.toLowerCase?.() || "";

      if (normalizedMessage.includes("get_phone_auth_status")) {
        setError("The phone-check SQL is not installed yet. Run `auth_phone_guard.sql` in Supabase first.");
      } else if (normalizedMessage.includes("sms") || normalizedMessage.includes("twilio")) {
        setError("The OTP provider did not confirm SMS delivery. Check your Supabase phone auth provider and try again.");
      } else {
        setError(err.message || "Failed to send OTP");
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
        subtitle="Use your registered phone number to receive a secure one-time code and continue to your account."
        footer={
          <>
            Don&apos;t have an account?{" "}
            <button className="font-semibold text-cyan-200" onClick={() => navigate("/register")}>
              Create one now
            </button>
          </>
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
                          onClick={() => handleCountrySelect(country)}
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
                  onChange={handlePhoneChange}
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
                {loading ? "Sending OTP..." : "Sign In"}
              </button>
            </form>
            </div>
      </AuthShell>
    </PageTransition>
  );
}

