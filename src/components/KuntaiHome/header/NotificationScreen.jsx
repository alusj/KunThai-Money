import BackTab from "./Transactions/BackTab";

const toneStyles = {
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  neutral: "border-slate-200 bg-slate-50 text-slate-800",
};

export default function NotificationScreen({ notifications = [], onBack, onAction }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Notification Center
            </p>
            <h1 className="mt-2 text-lg font-bold text-slate-950 md:text-xl">Important updates</h1>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            {notifications.length} alerts
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="space-y-4">
          {notifications.map((item) => (
            <button
              key={item.id}
              onClick={() => onAction(item.action)}
              className={`w-full rounded-[28px] border p-5 text-left transition hover:shadow-sm ${toneStyles[item.tone] || toneStyles.neutral}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{item.title}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 opacity-85">{item.body}</p>
                </div>
                <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                  Open
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
