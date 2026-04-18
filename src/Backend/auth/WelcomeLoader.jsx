import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import supabase from "../../Backend/lib/supabaseClient";
import FlagIcon from "../../components/FlagIcon";
import { fetchOnboardingStatus } from "../hooks/useOnboardingStatus";
import { ecowasCountries } from "../utils/ecowasCountries";
import {
  clearTransactionPinResetPhone,
  getTransactionPinResetPhone,
} from "../utils/onboardingStorage";
import { getGreetingName } from "../utils/profileName";

function getCircularPosition(index, total, radius) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

const TIMINGS = {
  intro: 300,
  line1: 800,
  line2: 1450,
  line3: 2200,
  line4: 2950,
  loaderHold: 5100,
  flagsStatic: 6200,
  flagsOrbit: 7800,
  redirect: 10200,
};

export default function WelcomeLoader() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("message");
  const [name, setName] = useState("User");
  const [visibleLines, setVisibleLines] = useState(0);
  const flags = useMemo(
    () =>
      ecowasCountries.map((country) => ({
        code: country.flag,
        name: country.name,
      })),
    []
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: profile } = await supabase
        .from("kuntai_profiles")
        .select("first_name,middle_name,last_name")
        .eq("user_id", user.id)
        .maybeSingle();

      setName(getGreetingName(profile));
    };

    getUser();
  }, []);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setVisibleLines(1), TIMINGS.intro),
      window.setTimeout(() => setVisibleLines(2), TIMINGS.line1),
      window.setTimeout(() => setVisibleLines(3), TIMINGS.line2),
      window.setTimeout(() => setVisibleLines(4), TIMINGS.line3),
      window.setTimeout(() => setVisibleLines(5), TIMINGS.line4),
      window.setTimeout(() => setPhase("transition"), TIMINGS.loaderHold),
      window.setTimeout(() => setPhase("flags-static"), TIMINGS.flagsStatic),
      window.setTimeout(() => setPhase("flags-orbit"), TIMINGS.flagsOrbit),
      window.setTimeout(async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            navigate("/login?reason=session-expired", { replace: true });
            return;
          }

          const pendingPinResetPhone = getTransactionPinResetPhone();
          if (pendingPinResetPhone) {
            if (pendingPinResetPhone === user.phone) {
              navigate("/security-setup", {
                replace: true,
                state: {
                  phone: user.phone,
                  returnTo: "/home",
                  resetReason: "transaction-pin",
                },
              });
              return;
            }

            clearTransactionPinResetPhone();
          }

          const status = await fetchOnboardingStatus(user.id);
          navigate(status.recommendedPath, { replace: true });
        } catch {
          navigate("/home", { replace: true });
        }
      }, TIMINGS.redirect),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [navigate]);

  const showMessage = phase === "message" || phase === "transition";
  const showFlags = phase === "flags-static" || phase === "flags-orbit";
  const lines = [
    `Hi ${name}`,
    "Welcome to KunThai Money",
    "Preparing your beyond-border transactions",
    "Account successfully created",
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(110,231,255,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.18),transparent_24%),linear-gradient(180deg,#030712_0%,#071632_36%,#0b2152_68%,#041126_100%)] px-6 text-white">
      <style>
        {`
          @keyframes kuntai-pulse-glow {
            0%, 100% { transform: scale(0.96); opacity: 0.55; }
            50% { transform: scale(1.06); opacity: 1; }
          }

          @keyframes kuntai-shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }

          @keyframes kuntai-float {
            0%, 100% { transform: translate3d(0, 0, 0); }
            50% { transform: translate3d(0, -12px, 0); }
          }

          @keyframes kuntai-orbit {
            from { transform: rotate(0deg) scale(0.76); }
            to { transform: rotate(360deg) scale(0.76); }
          }

          @keyframes kuntai-loader-bar {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(220%); }
          }

          @keyframes kuntai-reveal-line {
            0% { opacity: 0; transform: translateY(16px); filter: blur(10px); }
            100% { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
        `}
      </style>

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl"
          style={{ animation: "kuntai-pulse-glow 5.4s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[12%] left-[12%] h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"
          style={{ animation: "kuntai-pulse-glow 6.2s ease-in-out infinite" }}
        />
        <div
          className="absolute right-[10%] top-[24%] h-40 w-40 rounded-full bg-sky-300/10 blur-3xl"
          style={{ animation: "kuntai-pulse-glow 5.8s ease-in-out infinite" }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center">
        <div className="relative flex min-h-[31rem] w-full flex-col items-center justify-center">
          <div
            className={`absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center transition-all duration-700 ${
              showMessage ? "opacity-100" : "pointer-events-none opacity-0"
            } ${
              phase === "transition" ? "scale-[0.985]" : "scale-100"
            }`}
          >
            <div className="rounded-full border border-cyan-300/16 bg-white/8 px-5 py-2 backdrop-blur-xl">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-cyan-100/80">
                Creating Account
              </span>
            </div>

            <div className="mt-8 w-full max-w-3xl text-center">
              <div className="space-y-4 sm:space-y-5">
                {lines.map((line, index) => {
                  const isVisible = visibleLines > index;
                  const isHeadline = index === 1;

                  return (
                    <p
                      key={line}
                      className={`transition-opacity duration-500 ${
                        isHeadline
                          ? "text-4xl font-semibold tracking-[0.02em] text-white sm:text-6xl"
                          : "text-lg font-medium tracking-[0.08em] text-cyan-100/90 sm:text-2xl"
                      } ${isVisible ? "opacity-100" : "opacity-0"}`}
                      style={isVisible ? { animation: "kuntai-reveal-line 700ms ease forwards" } : undefined}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>

              <div className="mx-auto mt-8 w-56 overflow-hidden rounded-full border border-white/12 bg-white/8 p-1 shadow-[0_20px_60px_rgba(8,15,40,0.26)]">
                <div className="relative h-2 rounded-full bg-white/8">
                  <div
                    className="absolute inset-y-0 w-20 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0),rgba(165,243,252,0.95),rgba(59,130,246,0))]"
                    style={{ animation: "kuntai-loader-bar 1.45s ease-in-out infinite" }}
                  />
                </div>
              </div>
              <p className="mt-6 text-sm font-medium uppercase tracking-[0.28em] text-cyan-100/70 sm:text-base">
                Finalizing your account environment
              </p>
            </div>
          </div>

          <div
            className={`absolute left-1/2 top-1/2 transition-all duration-[1200ms] ${
              showFlags ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{
              transform:
                phase === "flags-orbit"
                  ? "translate(-50%, -50%) scale(0.92)"
                  : "translate(-50%, -50%) scale(1)",
            }}
          >
            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-3xl" />

            <div
              className="relative h-[21rem] w-[21rem] sm:h-[24rem] sm:w-[24rem]"
              style={{
                animation: phase === "flags-orbit" ? "kuntai-orbit 7.2s linear infinite" : "none",
              }}
            >
              {flags.map((flag, index) => {
                const { x, y } = getCircularPosition(index, flags.length, 132);

                return (
                  <div
                    key={flag.code}
                    className="absolute left-1/2 top-1/2 transition-all duration-[1200ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
                    style={{
                      transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${
                        phase === "flags-orbit" ? 0.94 : 1
                      })`,
                    }}
                  >
                    <div className="rounded-[1.35rem] border border-white/18 bg-white/10 p-1.5 shadow-[0_24px_60px_rgba(2,8,23,0.34)] backdrop-blur-2xl">
                      <FlagIcon code={flag.code} className="h-12 w-16 rounded-[0.95rem] sm:h-14 sm:w-[4.5rem]" />
                    </div>
                  </div>
                );
              })}

              <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/20 bg-[radial-gradient(circle,rgba(255,255,255,0.22),rgba(255,255,255,0.04))] shadow-[0_30px_90px_rgba(34,211,238,0.18)] backdrop-blur-2xl sm:h-32 sm:w-32">
                <div className="text-center">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.42em] text-cyan-100/70 sm:text-[0.65rem]">
                    KunThai
                  </p>
                  <p className="mt-2 text-lg font-semibold sm:text-xl">Money</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

