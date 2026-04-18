import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import supabase from "../../Backend/lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import {
  clearTransactionPinResetPhone,
  getOnboardingPhone,
} from "../utils/onboardingStorage";
import { maskPhoneNumber } from "../utils/maskPhoneNumber";
import PageTransition from "../../components/animations/PageTransition";
import AuthNotice from "../../components/auth/AuthNotice";
import AuthShell from "../../components/auth/AuthShell";

export default function SecuritySetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isPinReset = location.state?.resetReason === "transaction-pin";
  const [phone, setPhone] = useState(location.state?.phone || getOnboardingPhone() || "");
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorAnim, setErrorAnim] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    let isMounted = true;

    const resolvePhone = async () => {
      if (phone) {
        return;
      }

      if (user?.phone && isMounted) {
        setPhone(user.phone);
        return;
      }

      if (!user?.id) {
        return;
      }

      const { data: profile } = await supabase
        .from("kuntai_profiles")
        .select("phone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.phone && isMounted) {
        setPhone(profile.phone);
      }
    };

    resolvePhone();

    return () => {
      isMounted = false;
    };
  }, [phone, user?.id, user?.phone]);

  const handleChange = (value, index, type) => {
    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    setErrorMessage("");
    const target = type === "pin" ? [...pin] : [...confirmPin];
    target[index] = value;

    if (type === "pin") {
      setPin(target);
    } else {
      setConfirmPin(target);
    }

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key !== "Backspace" || index <= 0) {
      return;
    }

    const activeDigits = step === 1 ? pin : confirmPin;

    if (!activeDigits[index]) {
      inputs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (step === 1 && pin.join("").length === 6) {
      const timeoutId = window.setTimeout(() => setStep(2), 300);
      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [pin, step]);

  const savePin = async () => {
    const firstPin = pin.join("");
    const secondPin = confirmPin.join("");

    if (secondPin.length < 6) {
      return;
    }

    if (firstPin !== secondPin) {
      setErrorAnim(true);

      window.setTimeout(() => {
        setErrorAnim(false);
        setConfirmPin(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      }, 500);

      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const { error } = await supabase.rpc("set_user_pin", {
        p_pin: firstPin,
      });

      if (error) {
        if (
          error.message?.includes("function public.set_user_pin") ||
          error.message?.includes("gen_salt") ||
          error.message?.toLowerCase?.().includes("pgcrypto")
        ) {
          throw new Error("PIN setup requires the new server function. Run the Supabase hardening SQL first.");
        }

        throw error;
      }

      const returnTo = location.state?.returnTo;

      if (returnTo) {
        if (location.state?.resetReason === "transaction-pin") {
          clearTransactionPinResetPhone();
        }
        navigate(returnTo, { replace: true });
        return;
      }

      if (location.state?.resetReason === "transaction-pin") {
        clearTransactionPinResetPhone();
      }
      navigate("/create-profile", { replace: true });
    } catch (err) {
      setErrorMessage(err.message || "Failed to secure your PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthShell
        eyebrow="Account Protection"
        title={
          step === 1
            ? isPinReset
              ? "Create your new transaction PIN"
              : "Create your transaction PIN"
            : isPinReset
              ? "Confirm your new transaction PIN"
              : "Confirm your transaction PIN"
        }
        subtitle={
          isPinReset
            ? "Set a fresh 6-digit transaction PIN for transfers and other protected money actions."
            : "This 6-digit PIN protects sensitive account actions and keeps your wallet secure."
        }
      >
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold text-slate-50 sm:text-2xl">
            {step === 1 ? "Create PIN" : "Confirm PIN"}
          </h1>
          <p className="mb-6 text-sm text-slate-300">
            {isPinReset
              ? "Create a new 6-digit PIN for transaction approval"
              : "Secure your account with a 6-digit PIN"}
          </p>

          {errorMessage && (
            <AuthNotice tone="danger" title="PIN setup incomplete">
              {errorMessage}
            </AuthNotice>
          )}

          <div className="rounded-2xl border border-[#28456f] bg-[#0f1f3b] p-6 shadow-[0_18px_48px_rgba(3,8,20,0.24)]">
            <div className="mb-4 text-sm text-slate-300">
              {phone ? maskPhoneNumber(phone) : "Secure onboarding in progress"}
            </div>

            <div className={`mb-6 flex justify-between ${errorAnim ? "animate-shake" : ""}`}>
              {(step === 1 ? pin : confirmPin).map((digit, index) => (
                <div
                  key={index}
                    className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#31507f] bg-[#10213f] transition"
                >
                  <div className={`h-3 w-3 rounded-full ${digit ? "bg-sky-400" : "bg-slate-500"}`} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    ref={(element) => {
                      inputs.current[index] = element;
                    }}
                    onChange={(event) =>
                      handleChange(event.target.value, index, step === 1 ? "pin" : "confirm")
                    }
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    className="absolute h-12 w-12 cursor-pointer opacity-0"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={step === 2 ? savePin : undefined}
              disabled={loading}
              className={`w-full rounded-2xl py-3 font-semibold text-white transition ${
                loading ? "bg-[#31507f]" : "bg-[#2563eb] hover:bg-[#3b82f6]"
              }`}
            >
              {step === 1 ? "Continue" : loading ? "Saving..." : "Finish Setup"}
            </button>
          </div>
        </div>
      </AuthShell>
    </PageTransition>
  );
}
