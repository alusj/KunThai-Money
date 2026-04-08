import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import supabase from "../../Backend/lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { maskPhoneNumber } from "../utils/maskPhoneNumber";
import { getOnboardingPhone, setOnboardingPhone } from "../utils/onboardingStorage";
import PageTransition from "../../components/animations/PageTransition";
import AuthNotice from "../../components/auth/AuthNotice";
import AuthShell from "../../components/auth/AuthShell";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const phone = location.state?.phone || getOnboardingPhone();
  const intent = location.state?.intent || "register";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [timerCycle, setTimerCycle] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorAnim, setErrorAnim] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputs = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!phone) {
      navigate(session ? "/welcome-loader" : "/register", { replace: true });
      return;
    }

    setOnboardingPhone(phone);
  }, [navigate, phone, session]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimer(60);

    intervalRef.current = setInterval(() => {
      setTimer((previousTimer) => {
        if (previousTimer <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }

        return previousTimer - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [phone, timerCycle]);

  const handleChange = (value, index) => {
    setErrorMessage("");

    if (/^[0-9]{6}$/.test(value)) {
      const digits = value.split("");
      setOtp(digits);
      inputs.current[5]?.focus();
      return;
    }

    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasteData = event.clipboardData.getData("text").trim();

    if (/^[0-9]{6}$/.test(pasteData)) {
      const digits = pasteData.split("");
      setOtp(digits);
      inputs.current[5]?.focus();
    }
  };

  const verifyOtp = useCallback(
    async (code) => {
      if (loading || code.length !== 6) {
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: code,
          type: "sms",
        });

        if (error) {
          throw error;
        }

        setSuccess(true);

        window.setTimeout(() => {
          if (intent === "reset-password") {
            navigate("/reset-password", {
              replace: true,
              state: { phone },
            });
            return;
          }

          navigate("/security-setup", {
            replace: true,
            state: { phone },
          });
        }, 800);
      } catch (err) {
        setErrorMessage(err.message || "Invalid or expired verification code");
        setErrorAnim(true);

        window.setTimeout(() => {
          setErrorAnim(false);
          setOtp(["", "", "", "", "", ""]);
          inputs.current[0]?.focus();
        }, 500);
      } finally {
        setLoading(false);
      }
    },
    [intent, loading, navigate, phone]
  );

  useEffect(() => {
    const code = otp.join("");

    if (code.length === 6) {
      verifyOtp(code);
    }
  }, [otp, verifyOtp]);

  const resendOtp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: intent === "reset-password" ? { shouldCreateUser: false } : undefined,
      });

      if (error) {
        throw error;
      }

      setTimerCycle((current) => current + 1);
      setErrorMessage("");
    } catch (err) {
      const normalizedMessage = err.message?.toLowerCase?.() || "";

      if (normalizedMessage.includes("rate limit")) {
        setErrorMessage("OTP sending is temporarily rate-limited. Please wait a moment before requesting another code.");
      } else if (normalizedMessage.includes("sms") || normalizedMessage.includes("twilio")) {
        setErrorMessage("The OTP provider did not confirm SMS delivery. Check your Supabase phone auth provider and try again.");
      } else {
        setErrorMessage(err.message || "Failed to resend OTP");
      }
    }
  };

  return (
    <PageTransition>
      <AuthShell
        eyebrow={intent === "reset-password" ? "Password Recovery" : "Verify Identity"}
        title="Enter your secure code"
        subtitle={`We sent a 6-digit code to ${maskPhoneNumber(phone)}. Enter it below to continue securely.`}
      >
        <div className="space-y-4 text-center">
          {errorMessage && (
            <AuthNotice tone="danger" title="Verification failed">
              {errorMessage}
            </AuthNotice>
          )}

          <div
            onPaste={handlePaste}
            className={`mb-6 flex justify-between gap-2 ${errorAnim ? "animate-shake" : ""}`}
          >
            {otp.map((digit, index) => (
              <div key={index} className="flex flex-1 items-center justify-center">
                <span className="text-lg text-gray-400">[</span>
                <input
                  ref={(element) => {
                    inputs.current[index] = element;
                  }}
                  value={digit}
                  onChange={(event) => handleChange(event.target.value, index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full border-b-2 border-gray-300 bg-transparent text-center text-xl font-semibold transition focus:scale-110 focus:border-blue-600 focus:outline-none"
                />
                <span className="text-lg text-gray-400">]</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => verifyOtp(otp.join(""))}
            disabled={loading}
            className={`w-full rounded-2xl py-3 font-semibold text-white transition ${
              loading ? "bg-slate-400" : success ? "bg-green-500" : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {loading ? "Verifying..." : success ? "Verified" : "Verify Code"}
          </button>

          <p className="mt-4 text-sm text-slate-500">
            {timer > 0 ? (
              <span>Resend code in {timer}s</span>
            ) : (
              <span onClick={resendOtp} className="cursor-pointer font-medium text-blue-600">
                Resend Code
              </span>
            )}
          </p>
        </div>
      </AuthShell>
    </PageTransition>
  );
}
