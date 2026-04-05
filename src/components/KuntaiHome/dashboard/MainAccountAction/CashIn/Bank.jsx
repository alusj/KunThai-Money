import { useState } from "react";
import { ArrowRightLeft, ChevronRight, CreditCard, Landmark } from "lucide-react";
import CardTopUpForm from "./CardTopUpForm";

function ChoiceCard({ icon: Icon, title, body, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <Icon size={18} />
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-900">{title}</span>
          <span className="mt-1 block text-xs text-slate-500">{body}</span>
        </span>
      </span>
      <span className="flex items-center gap-2">
        {badge ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-600">{badge}</span> : null}
        <ChevronRight size={18} className="text-slate-500" />
      </span>
    </button>
  );
}

export default function Bank({ account, user }) {
  const [showChoices, setShowChoices] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null);

  if (activeFlow === "card") {
    return (
      <CardTopUpForm
        account={account}
        user={user}
        onBack={() => setActiveFlow(null)}
      />
    );
  }

  if (showChoices) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <button
          onClick={() => setShowChoices(false)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <span className="text-lg leading-none">{"<"}</span>
          <span>Back</span>
        </button>

        <div className="space-y-3">
          <ChoiceCard
            icon={Landmark}
            title="Bank Account"
            body="Direct bank-account cash in will be wired next after the card flow is complete."
            badge="Soon"
            onClick={() => {}}
          />
          <ChoiceCard
            icon={CreditCard}
            title="Card"
            body="Use your prepaid, debit, or eligible Visa card."
            badge="Live"
            onClick={() => setActiveFlow("card")}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowChoices(true)}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <Landmark size={18} />
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-900">Bank Transfer</span>
          <span className="mt-1 block text-xs text-slate-500">Bank account or eligible card</span>
        </span>
      </span>
      <ArrowRightLeft size={18} className="text-slate-500" />
    </button>
  );
}
