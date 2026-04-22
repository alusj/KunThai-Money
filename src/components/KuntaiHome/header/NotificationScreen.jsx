import { useMemo, useState } from "react";
import BackTab from "./Transactions/BackTab";

const toneStyles = {
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  neutral: "border-slate-200 bg-slate-50 text-slate-800",
};

function formatNotificationTime(value) {
  if (!value) {
    return "Needs attention";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Needs attention";
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffMinutes < 60 * 24) {
    return `${Math.round(diffMinutes / 60)}h ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export default function NotificationScreen({
  notifications = [],
  unreadCount = 0,
  onBack,
  onAction,
  onMarkRead,
  onMarkUnread,
  onMarkAllRead,
}) {
  const [filter, setFilter] = useState("all");
  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.isRead);
    }

    return notifications;
  }, [filter, notifications]);

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
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              {notifications.length} alerts
            </div>
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Mark all read
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === "all" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === "unread"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          <p className="text-sm text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount === 1 ? "" : "s"} still need your attention.`
              : "All notifications have been reviewed."}
          </p>
        </div>

        <div className="space-y-4">
          {visibleNotifications.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-semibold text-slate-950">
                {notifications.length === 0 ? "No active notifications right now." : "No unread notifications right now."}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {notifications.length === 0
                  ? "KYC updates, cash-in requests, and admin messages will appear here when they are available."
                  : "Switch back to All if you want to review notifications you already opened."}
              </p>
            </div>
          ) : (
            visibleNotifications.map((item) => (
              <div
                key={item.id}
                className={`w-full rounded-[28px] border p-5 text-left transition hover:shadow-sm ${
                  toneStyles[item.tone] || toneStyles.neutral
                } ${item.isRead ? "opacity-90" : "shadow-[0_12px_30px_rgba(15,23,42,0.06)]"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
                        {item.category || "General"}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                        {formatNotificationTime(item.created_at)}
                      </span>
                      {!item.isRead ? (
                        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-lg font-semibold">{item.title}</p>
                    <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 opacity-85">{item.body}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (item.isRead ? onMarkUnread?.(item) : onMarkRead?.(item))}
                    className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-white"
                  >
                    {item.isRead ? "Unread" : "Mark read"}
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onAction(item, "primary")}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {item.actionLabel || "Open"}
                  </button>
                  {item.secondaryAction ? (
                    <button
                      type="button"
                      onClick={() => onAction(item, "secondary")}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {item.secondaryLabel || "Cancel"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
