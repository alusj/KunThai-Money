import { useNavigate } from "react-router-dom";
import { ArrowRight, BadgeDollarSign, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";

import PageTransition from "../../components/animations/PageTransition";

export default function RegisterAgreement() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1f4f95_0%,#122b56_32%,#09172d_68%,#06111f_100%)] px-3 py-4 text-white sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-sm flex-col">
          <div className="flex flex-1 items-center justify-center">
            <div className="mx-auto flex w-full max-w-[17.25rem] flex-col items-center text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full border border-sky-200/10 bg-white/[0.06] px-5 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-sky-100/75 shadow-[0_10px_26px_rgba(0,0,0,0.18)]">
                Secure account agreement
              </div>

              <div className="relative mb-4 flex h-[5.3rem] w-[7.45rem] items-center justify-center">
                <div className="absolute inset-x-4 top-2 h-10 rounded-full bg-[radial-gradient(circle,rgba(25,212,132,0.34),rgba(25,212,132,0.03))] blur-2xl" />
                <div className="absolute left-0 top-5 h-8 w-8 rounded-[0.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(19,201,184,0.95),rgba(12,162,148,0.95))] shadow-[0_14px_22px_rgba(11,170,156,0.26)]" />
                <div className="absolute right-1 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-[#8dff8c]/30 bg-[linear-gradient(180deg,#c8ff91,#93ee67)] text-[#13210c] shadow-[0_12px_22px_rgba(147,238,103,0.24)]">
                  <BadgeDollarSign size={15} strokeWidth={2.1} />
                </div>
                <div className="absolute bottom-0 right-4 flex h-8 w-8 items-center justify-center rounded-[0.9rem] bg-[#14cf68] text-[#04110a] shadow-[0_12px_20px_rgba(20,207,104,0.22)]">
                  <LockKeyhole size={13} strokeWidth={2.2} />
                </div>
                <div className="relative w-[6.15rem] rounded-[1.35rem] border border-[#d9ffc0]/10 bg-[linear-gradient(160deg,#f4ffd8_0%,#dbf4ab_54%,#caf089_100%)] px-3 py-2.5 text-left text-[#18230d] shadow-[0_18px_34px_rgba(0,0,0,0.32)] before:absolute before:inset-0 before:rounded-[1.35rem] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.26),transparent_55%)] before:content-['']">
                  <div className="relative flex items-center justify-between">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14bf6f]" />
                    <span className="flex h-6 w-6 items-center justify-center rounded-[0.7rem] bg-white/40 text-[#1b2b10]">
                      <CreditCard size={11} strokeWidth={2.2} />
                    </span>
                  </div>
                  <div className="relative mt-3 space-y-1.5">
                    <div className="h-[2px] w-8 rounded-full bg-[#314120]/60" />
                    <div className="h-[2px] w-10 rounded-full bg-[#314120]/46" />
                    <div className="h-[2px] w-6 rounded-full bg-[#314120]/34" />
                  </div>
                </div>
              </div>

              <h1 className="mt-1 text-[1.65rem] font-bold leading-none tracking-[-0.06em] text-white sm:text-[1.9rem]">
                    KunTaiMoney
              </h1>

              <p className="mt-2.5 max-w-[16.5rem] text-[0.92rem] leading-6 text-white/52">
                Please review the documents below before creating your account.
              </p>

              <div className="mt-4 grid w-full gap-2.5 text-left">
                <button
                  type="button"
                  onClick={() => navigate("/legal/privacy")}
                  className="flex items-center justify-between rounded-[1.2rem] border border-[#31507f] bg-[linear-gradient(180deg,rgba(16,33,63,0.96),rgba(12,25,48,0.94))] px-4 py-3 transition hover:border-sky-400/45 hover:bg-[#14284d]"
                >
                  <span className="pr-3">
                    <span className="block text-[0.96rem] font-semibold text-white">Privacy Policy</span>
                  </span>
                  <ArrowRight size={17} className="shrink-0 text-sky-300" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/legal/service")}
                  className="flex items-center justify-between rounded-[1.2rem] border border-[#31507f] bg-[linear-gradient(180deg,rgba(16,33,63,0.96),rgba(12,25,48,0.94))] px-4 py-3 transition hover:border-sky-400/45 hover:bg-[#14284d]"
                >
                  <span className="pr-3">
                    <span className="block text-[0.96rem] font-semibold text-white">Terms of Service</span>
                  </span>
                  <ArrowRight size={17} className="shrink-0 text-sky-300" />
                </button>
              </div>

              <div className="mt-6 w-full">
                <button
                  type="button"
                  onClick={() => navigate("/register/details")}
                  className="w-full rounded-[1.35rem] bg-[#2563eb] px-6 py-3.5 text-[1rem] font-bold text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] transition hover:bg-[#3b82f6]"
                >
                  Agree and continue
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-4 w-full text-sm font-medium text-white/50 transition hover:text-white/80"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
