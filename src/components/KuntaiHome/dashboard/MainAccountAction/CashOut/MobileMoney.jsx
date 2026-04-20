import { ArrowRightLeft, ChevronRight, Smartphone } from "lucide-react";

export default function MobileMoney() {
  return (
    <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50">
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <Smartphone size={18} />
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-900">Mobile Money</span>
          <span className="mt-1 block text-xs text-slate-500">
            Send to a supported mobile wallet when payout service is enabled
          </span>
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Soon
        </span>
        <ArrowRightLeft size={18} className="text-slate-400" />
        <ChevronRight size={18} className="text-slate-500" />
      </span>
    </button>
  );
}
