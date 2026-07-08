import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, ChevronRight, CreditCard, Landmark, X } from "lucide-react";

import SheetStage from "../../../../animations/SheetStage";
import CardTopUpForm from "./CardTopUpForm";

function ChoiceCard({ icon: Icon, title, body, badge, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition ${
        disabled ? "cursor-not-allowed opacity-70" : "hover:bg-slate-50"
      }`}
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
        {badge ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
            {badge}
          </span>
        ) : null}
        <ChevronRight size={18} className="text-slate-500" />
      </span>
    </button>
  );
}

export default function Bank({ account, user }) {
  const [showChoices, setShowChoices] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null);

  return (
    <SheetStage stageKey={activeFlow || "button"}>
      {activeFlow === "card" ? (
        <CardTopUpForm account={account} user={user} onBack={() => setActiveFlow(null)} />
      ) : (
        <>
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

          <AnimatePresence>
            {showChoices ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
                onClick={() => setShowChoices(false)}
                role="dialog"
                aria-modal="true"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 16 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  onClick={(event) => event.stopPropagation()}
                  className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.35)]"
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Cash In
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-950">Bank Transfer</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Choose how you want to fund your wallet.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowChoices(false)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <ChoiceCard
                      icon={Landmark}
                      title="Bank Account"
                      body="Direct bank-account cash in will come next after the card flow is stable."
                      badge="Soon"
                      disabled
                      onClick={() => {}}
                    />
                    <ChoiceCard
                      icon={CreditCard}
                      title="Card"
                      body="Fund your wallet with a Flutterwave-supported debit, credit, or prepaid card."
                      badge="Flutterwave"
                      onClick={() => {
                        setShowChoices(false);
                        setActiveFlow("card");
                      }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      )}
    </SheetStage>
  );
}
