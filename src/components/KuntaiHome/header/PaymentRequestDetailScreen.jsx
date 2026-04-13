import { ArrowLeft, CheckCircle2, Clock3, X } from "lucide-react";

import { formatCurrency } from "../../../Backend/utils/formatCurrency";
import BackTab from "./Transactions/BackTab";

function statusTone(status) {
  if (status === "accepted") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "declined" || status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  if (status === "viewed") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-amber-100 text-amber-700";
}

export default function PaymentRequestDetailScreen({ request, onBack, onCancel, onPayNow, mode = "incoming" }) {
  if (!request) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Cash In
            </p>
            <h1 className="mt-2 text-lg font-bold text-slate-950 md:text-xl">Payment requested form</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone(request.status)}`}>
              {request.status}
            </div>
            <p className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Clock3 size={14} />
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(request.created_at))}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">From Account holder name</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{request.requester_name}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Account number</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{request.requester_account_number}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Amount requested</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-700">
                {formatCurrency(request.amount || 0, request.currency || "SLL")}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Reason for request</p>
              <p className="mt-2 text-base leading-7 text-slate-700">{request.reason || "No reason added"}</p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            {mode === "incoming" && request.status !== "accepted" && request.status !== "declined" && request.status !== "cancelled" ? (
              <button
                type="button"
                onClick={onPayNow}
                className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <CheckCircle2 size={16} />
                <span>Pay now</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ArrowLeft size={16} />
                <span>Done</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <X size={16} />
              <span>{mode === "incoming" ? "Decline" : "Cancel"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
