import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

const toneStyles = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
  pending: "border-slate-200 bg-slate-50 text-slate-900",
};

function ToneIcon({ tone }) {
  if (tone === "success") {
    return <CheckCircle2 size={18} />;
  }

  if (tone === "warning" || tone === "danger") {
    return <AlertCircle size={18} />;
  }

  if (tone === "pending") {
    return <Loader2 size={18} className="animate-spin" />;
  }

  return <Info size={18} />;
}

export default function ActionBanner({ tone = "info", title, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm ${toneStyles[tone] || toneStyles.info} ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">
          <ToneIcon tone={tone} />
        </span>
        <div className="min-w-0">
          {title ? <p className="font-semibold">{title}</p> : null}
          <p className={title ? "mt-1 text-sm leading-6" : "text-sm leading-6"}>{children}</p>
        </div>
      </div>
    </div>
  );
}
