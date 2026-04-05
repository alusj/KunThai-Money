import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function CardTopupCallback() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const status = (searchParams.get("status") || "").toLowerCase();
  const provider = searchParams.get("provider") || "";

  const content = useMemo(() => {
    if (status === "success") {
      return {
        title: "Card payment received",
        body: "We have received the card authorization. Your wallet balance will update as soon as the payment verification and credit step completes.",
        tone: "emerald",
      };
    }

    if (status === "cancelled") {
      return {
        title: "Card payment cancelled",
        body: "No money was credited. You can return to your wallet and try the card cash-in flow again whenever you're ready.",
        tone: "amber",
      };
    }

    return {
      title: "Payment status received",
      body: "We are checking the payment outcome now. If the card was charged successfully, your wallet will update after verification finishes.",
      tone: "sky",
    };
  }, [status]);

  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    sky: "border-sky-200 bg-sky-50 text-sky-950",
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-sm ${toneClasses[content.tone]}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
          {provider === "mock" ? "Card Cash In Test" : "Card Cash In"}
        </p>
        <h1 className="mt-3 text-2xl font-bold">{content.title}</h1>
        <p className="mt-3 text-sm leading-6">{content.body}</p>

        {reference ? (
          <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-xs">
            Reference: <span className="font-semibold">{reference}</span>
          </div>
        ) : null}

        <div className="mt-6">
          <Link
            to="/home"
            className="inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Return to Wallet
          </Link>
        </div>
      </div>
    </main>
  );
}
