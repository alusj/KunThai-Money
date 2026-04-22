import { useNavigate } from "react-router-dom";

import FloatingCurrencyBackground from "../components/animations/FloatingCurrencyBackground";
import PageTransition from "../components/animations/PageTransition";
import Logo3DGlow from "../components/Logo3DGlow";

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#1f4f95_0%,#122b56_32%,#09172d_68%,#06111f_100%)] px-6 py-10 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-sky-400/18 blur-3xl" />
          <div className="absolute bottom-[-14%] right-[-10%] h-80 w-80 rounded-full bg-blue-500/18 blur-3xl" />
          <div className="absolute right-[12%] top-[18%] h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_42%,rgba(96,165,250,0.08)_100%)]" />
        </div>

        <FloatingCurrencyBackground />

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,24,45,0.9),rgba(8,18,35,0.96))] px-6 py-8 text-center shadow-[0_24px_80px_rgba(4,12,24,0.46)] backdrop-blur-xl sm:px-7 sm:py-9">
            <p className="mb-3 inline-flex rounded-full border border-sky-200/15 bg-white/8 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-100">
              Beyond Borders
            </p>

          <h1 className="text-4xl font-bold tracking-tight text-white">KunTai Money</h1>

            <div className="mt-8 flex justify-center">
              <Logo3DGlow />
            </div>

            <p className="mx-auto mt-8 max-w-xs text-sm leading-6 text-slate-200/90 sm:text-base">
              Move money confidently with a secure wallet built for cross-border payments.
            </p>

            <div className="mt-8 space-y-4">
              <button
                onClick={() => navigate("/register")}
                className="w-full rounded-2xl bg-[#2563eb] py-3.5 font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] transition hover:bg-[#3b82f6] active:scale-[0.99]"
              >
                Register
              </button>

              <button
                onClick={() => navigate("/login")}
                className="w-full rounded-2xl border border-[#31507f] bg-[#10213f] py-3.5 font-semibold text-slate-100 transition hover:bg-[#14284d] active:scale-[0.99]"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
