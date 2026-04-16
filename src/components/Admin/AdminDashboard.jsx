import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";

import {
  getAdminAgentReviews,
  getAdminKycReviews,
  getSignedKycDocument,
  getSignedStoredDocument,
  updateAgentAccountStatus,
  updateKycStatus,
} from "../../Backend/services/adminService";
import {
  archiveAdminNotification,
  createAdminNotification,
  getAdminNotifications,
} from "../../Backend/services/adminNotificationService";

function formatAdminDate(value) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
}

function formatReviewStatusLabel(status) {
  if (status === "active") {
    return "approved";
  }

  return status || "pending";
}

function KycNotificationCard({ count }) {
  return (
    <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-amber-700">Admin Notifications</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">KYC reviews waiting</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {count} submission{count === 1 ? "" : "s"} currently need attention from the compliance/admin team.
      </p>
    </div>
  );
}

function MetricCard({ label, value, tone = "slate", active = false, onClick }) {
  const toneStyles = {
    slate: "border-slate-200 bg-white text-slate-950",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-[24px] border p-5 text-left shadow-sm transition ${
        toneStyles[tone] || toneStyles.slate
      } ${onClick ? "hover:-translate-y-0.5 hover:shadow-md" : ""} ${
        active ? "ring-2 ring-slate-950/80" : ""
      }`}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] opacity-60">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </Component>
  );
}

function AdminNotificationFeed({ pendingCount, approvedTodayCount, rejectedCount }) {
  const notifications = [
    {
      id: "pending",
      title: "Pending KYC reviews",
      body:
        pendingCount > 0
          ? `${pendingCount} submission${pendingCount === 1 ? "" : "s"} still need a decision from the admin team.`
          : "No pending KYC review is waiting right now.",
      tone: pendingCount > 0 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-800",
    },
    {
      id: "approved",
      title: "Approved today",
      body:
        approvedTodayCount > 0
          ? `${approvedTodayCount} account${approvedTodayCount === 1 ? "" : "s"} moved to approved today.`
          : "No KYC approval has been recorded today yet.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      id: "rejected",
      title: "Rejected submissions",
      body:
        rejectedCount > 0
          ? `${rejectedCount} submission${rejectedCount === 1 ? "" : "s"} are currently rejected and may need follow-up.`
          : "No rejected KYC submission is on the board right now.",
      tone: "border-rose-200 bg-rose-50 text-rose-900",
    },
  ];

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white">
          <ShieldAlert size={20} />
        </span>
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Notifications</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">Compliance activity at a glance</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className={`rounded-[22px] border p-4 ${item.tone}`}>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-2 text-sm leading-6 opacity-85">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationComposer({ form, onChange, onSubmit, busy }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white">
          <ShieldCheck size={20} />
        </span>
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Broadcast Center</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">Write a notification for users</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Audience</span>
          <select
            value={form.audienceType}
            onChange={(event) => onChange("audienceType", event.target.value)}
            className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="all">All users</option>
            <option value="single_user">One user</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tone</span>
          <select
            value={form.tone}
            onChange={(event) => onChange("tone", event.target.value)}
            className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="neutral">Neutral</option>
          </select>
        </label>
      </div>

      {form.audienceType === "single_user" ? (
        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Target User ID</span>
          <input
            value={form.targetUserId}
            onChange={(event) => onChange("targetUserId", event.target.value)}
            placeholder="Paste the user's UUID"
            className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>
      ) : null}

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Title</span>
        <input
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Service update"
          className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Message</span>
        <textarea
          value={form.body}
          onChange={(event) => onChange("body", event.target.value)}
          placeholder="Write the full notification users should receive."
          rows={5}
          className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        />
      </label>

      <label className="mt-4 inline-flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.isPopup}
          onChange={(event) => onChange("isPopup", event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        <span>Show as dashboard popup alert too</span>
      </label>

      <div className="mt-5">
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
            busy ? "cursor-not-allowed bg-slate-300" : "bg-slate-950 hover:bg-slate-800"
          }`}
        >
          {busy ? "Sending..." : "Send notification"}
        </button>
      </div>
    </div>
  );
}

function SentNotifications({ items, onArchive, busyId }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Sent Notifications</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">Recent admin announcements</p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          {items.length} active
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
            No admin notifications have been sent yet.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {item.audience_type === "all" ? "All users" : "Single user"}
                    </span>
                    {item.is_popup ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-amber-700">
                        Popup
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {formatAdminDate(item.created_at)}
                    {item.target_user_id ? ` â€¢ User ${item.target_user_id}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onArchive(item.id)}
                  disabled={busyId === item.id}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyId === item.id ? "Archiving..." : "Archive"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ReviewCard({ item, onApprove, onReject }) {
  const [documentUrl, setDocumentUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDocument = async () => {
      if (!item.front_id_url) {
        return;
      }

      try {
        const url = await getSignedKycDocument(item.front_id_url);
        if (isMounted) {
          setDocumentUrl(url);
        }
      } catch {
        if (isMounted) {
          setDocumentUrl(null);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [item.front_id_url]);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-slate-950">{item.displayName}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone(item.kyc_status)}`}>
              {item.kyc_status}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">{item.profile?.phone || "No phone found"}</p>
        </div>

        <p className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Clock3 size={14} />
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(item.updated_at || item.created_at))}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">ID Type</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{item.id_type || "Not provided"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">ID Number</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{item.id_number || "Not provided"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">National ID / NIN</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{item.national_id || "Not provided"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Issued By</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{item.issued_by || "Not provided"}</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Document Preview</p>
          {documentUrl ? (
            <img src={documentUrl} alt={`${item.displayName} KYC document`} className="mt-3 h-72 w-full rounded-[20px] object-cover" />
          ) : (
            <div className="mt-3 flex h-72 items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              Document preview unavailable
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onApprove(item)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <CheckCircle2 size={16} />
          <span>Approve</span>
        </button>
        <button
          type="button"
          onClick={() => onReject(item)}
          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <XCircle size={16} />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
}

function AgentReviewCard({ item, onApprove, onReject }) {
  const displayStatus = formatReviewStatusLabel(item.agentReviewStatus);
  const [documentPreviews, setDocumentPreviews] = useState([]);
  const [rejectionComment, setRejectionComment] = useState(item.rejectionReason || "");

  useEffect(() => {
    setRejectionComment(item.rejectionReason || "");
  }, [item.rejectionReason, item.id]);

  useEffect(() => {
    let isMounted = true;

    const loadDocuments = async () => {
      if (!item.businessDocumentFiles.length) {
        setDocumentPreviews([]);
        return;
      }

      const previews = await Promise.all(
        item.businessDocumentFiles.map(async (file, index) => {
          if (!file.path) {
            return {
              ...file,
              id: file.id || `agent-document-${index}`,
              signedUrl: null,
            };
          }

          try {
            const signedUrl = await getSignedStoredDocument({
              bucket: file.bucket || "kyc",
              path: file.path,
            });

            return {
              ...file,
              id: file.id || file.path || `agent-document-${index}`,
              signedUrl,
            };
          } catch {
            return {
              ...file,
              id: file.id || file.path || `agent-document-${index}`,
              signedUrl: null,
            };
          }
        })
      );

      if (isMounted) {
        setDocumentPreviews(previews);
      }
    };

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, [item.businessDocumentFiles]);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-slate-950">
              {item.account_name || "Agent Account"}
            </h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone(displayStatus)}`}>
              {displayStatus}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {item.displayName || "Unknown user"} â€¢ {item.profile?.phone || "No phone found"}
          </p>
        </div>

        <p className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Clock3 size={14} />
          {formatAdminDate(item.updated_at || item.created_at)}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Account Number</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{item.account_number || "Not provided"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Business Documents Requested</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {item.requestedBusinessDocuments.length
                ? item.requestedBusinessDocuments.join(", ")
                : "No optional document was selected"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin Note</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {item.businessDocumentNote || "No note added"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Rejection Reason For User
            </p>
            <textarea
              value={rejectionComment}
              onChange={(event) => setRejectionComment(event.target.value)}
              rows={4}
              placeholder="Explain what must be corrected before this agent account can be approved."
              className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This message will appear on the user's dashboard and inside their notification center if you reject the request.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Uploaded Business Documents</p>
          {documentPreviews.length ? (
            <div className="mt-3 space-y-3">
              {documentPreviews.map((file, index) => (
                <div key={file.id || `${file.name || "file"}-${index}`} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">{file.name || `Document ${index + 1}`}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {file.type || "Unknown type"}
                    {file.size ? ` • ${Math.max(1, Math.round(file.size / 1024))} KB` : ""}
                  </p>
                  {file.signedUrl ? (
                    <div className="mt-3 overflow-hidden rounded-[16px] border border-slate-200 bg-white">
                      {String(file.type || "").toLowerCase() === "application/pdf" ? (
                        <iframe
                          src={file.signedUrl}
                          title={file.name || `Document ${index + 1}`}
                          className="h-72 w-full"
                        />
                      ) : (
                        <img
                          src={file.signedUrl}
                          alt={file.name || `Document ${index + 1}`}
                          className="h-72 w-full object-contain"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-[16px] border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                      Preview unavailable for this document.
                    </div>
                  )}
                  {file.signedUrl ? (
                    <a
                      href={file.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Open document
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex h-40 items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              No uploaded business documents
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onApprove(item)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <CheckCircle2 size={16} />
          <span>Approve</span>
        </button>
        <button
          type="button"
          onClick={() => onReject(item, rejectionComment)}
          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <XCircle size={16} />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
}

function ReviewStatusSection({
  eyebrow,
  title,
  count,
  tone = "slate",
  loading,
  emptyLabel,
  skeletonCount = 2,
  children,
}) {
  const badgeTone =
    tone === "amber"
      ? "bg-amber-100 text-amber-800"
      : tone === "emerald"
        ? "bg-emerald-100 text-emerald-800"
        : tone === "rose"
          ? "bg-rose-100 text-rose-800"
          : "bg-slate-100 text-slate-700";

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-semibold ${badgeTone}`}>{count}</div>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={`${title}-skeleton-${index}`} className="h-56 animate-pulse rounded-[28px] bg-slate-100" />
          ))
        ) : count === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-950">{emptyLabel}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function QueuePlaceholder() {
  return (
    <section className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">Review Locations</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">Open a status queue to view accounts</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        Pending, approved, and rejected records stay in their own locations now. Select one of the account status cards above to review only that queue.
      </p>
    </section>
  );
}

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [agentItems, setAgentItems] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeQueue, setActiveQueue] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    body: "",
    audienceType: "all",
    targetUserId: "",
    tone: "info",
    isPopup: false,
  });
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [archiveBusyId, setArchiveBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [data, agentReviews, notifications] = await Promise.all([
        getAdminKycReviews(),
        getAdminAgentReviews(),
        getAdminNotifications({ status: "active", limit: 8 }),
      ]);
      setItems(data);
      setAgentItems(agentReviews);
      setAdminNotifications(notifications);
    } catch (err) {
      setError(err.message || "Admin KYC review could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingCount = useMemo(
    () => items.filter((item) => item.kyc_status === "pending").length,
    [items]
  );
  const approvedCount = useMemo(
    () => items.filter((item) => item.kyc_status === "approved").length,
    [items]
  );
  const rejectedCount = useMemo(
    () => items.filter((item) => item.kyc_status === "rejected").length,
    [items]
  );
  const approvedTodayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return items.filter(
      (item) => item.kyc_status === "approved" && (item.updated_at || item.created_at || "").slice(0, 10) === today
    ).length;
  }, [items]);
  const pendingItems = useMemo(() => items.filter((item) => item.kyc_status === "pending"), [items]);
  const approvedItems = useMemo(() => items.filter((item) => item.kyc_status === "approved"), [items]);
  const rejectedItems = useMemo(() => items.filter((item) => item.kyc_status === "rejected"), [items]);
  const pendingAgentItems = useMemo(
    () => agentItems.filter((item) => formatReviewStatusLabel(item.agentReviewStatus) === "pending"),
    [agentItems]
  );
  const approvedAgentItems = useMemo(
    () => agentItems.filter((item) => formatReviewStatusLabel(item.agentReviewStatus) === "approved"),
    [agentItems]
  );
  const rejectedAgentItems = useMemo(
    () => agentItems.filter((item) => formatReviewStatusLabel(item.agentReviewStatus) === "rejected"),
    [agentItems]
  );
  const pendingAgentCount = useMemo(
    () => pendingAgentItems.length,
    [pendingAgentItems]
  );
  const approvedAgentCount = useMemo(
    () => approvedAgentItems.length,
    [approvedAgentItems]
  );
  const rejectedAgentCount = useMemo(
    () => rejectedAgentItems.length,
    [rejectedAgentItems]
  );
  const reviewQueues = useMemo(
    () => [
      {
        key: "kyc-pending",
        eyebrow: "KYC Reviews",
        title: "Pending Accounts",
        count: pendingCount,
        tone: "amber",
        emptyLabel: "No pending KYC accounts right now.",
        items: pendingItems,
        renderCard: (item) => (
          <ReviewCard
            key={item.id}
            item={item}
            onApprove={() => handleStatusChange(item, "approved")}
            onReject={() => handleStatusChange(item, "rejected")}
          />
        ),
      },
      {
        key: "kyc-approved",
        eyebrow: "KYC Reviews",
        title: "Approved Accounts",
        count: approvedCount,
        tone: "emerald",
        emptyLabel: "No approved KYC accounts yet.",
        items: approvedItems,
        renderCard: (item) => (
          <ReviewCard
            key={item.id}
            item={item}
            onApprove={() => handleStatusChange(item, "approved")}
            onReject={() => handleStatusChange(item, "rejected")}
          />
        ),
      },
      {
        key: "kyc-rejected",
        eyebrow: "KYC Reviews",
        title: "Rejected Accounts",
        count: rejectedCount,
        tone: "rose",
        emptyLabel: "No rejected KYC accounts right now.",
        items: rejectedItems,
        renderCard: (item) => (
          <ReviewCard
            key={item.id}
            item={item}
            onApprove={() => handleStatusChange(item, "approved")}
            onReject={() => handleStatusChange(item, "rejected")}
          />
        ),
      },
      {
        key: "agent-pending",
        eyebrow: "Agent Verification",
        title: "Pending Agent Accounts",
        count: pendingAgentCount,
        tone: "amber",
        emptyLabel: "No pending agent accounts right now.",
        items: pendingAgentItems,
        renderCard: (item) => (
          <AgentReviewCard
            key={item.id}
            item={item}
            onApprove={() => handleAgentStatusChange(item, "approved")}
            onReject={(_, comment) => handleAgentStatusChange(item, "rejected", comment)}
          />
        ),
      },
      {
        key: "agent-approved",
        eyebrow: "Agent Verification",
        title: "Approved Agent Accounts",
        count: approvedAgentCount,
        tone: "emerald",
        emptyLabel: "No approved agent accounts yet.",
        items: approvedAgentItems,
        renderCard: (item) => (
          <AgentReviewCard
            key={item.id}
            item={item}
            onApprove={() => handleAgentStatusChange(item, "approved")}
            onReject={(_, comment) => handleAgentStatusChange(item, "rejected", comment)}
          />
        ),
      },
      {
        key: "agent-rejected",
        eyebrow: "Agent Verification",
        title: "Rejected Agent Accounts",
        count: rejectedAgentCount,
        tone: "rose",
        emptyLabel: "No rejected agent accounts right now.",
        items: rejectedAgentItems,
        renderCard: (item) => (
          <AgentReviewCard
            key={item.id}
            item={item}
            onApprove={() => handleAgentStatusChange(item, "approved")}
            onReject={(_, comment) => handleAgentStatusChange(item, "rejected", comment)}
          />
        ),
      },
    ],
    [
      approvedAgentCount,
      approvedAgentItems,
      approvedCount,
      approvedItems,
      pendingAgentCount,
      pendingAgentItems,
      pendingCount,
      pendingItems,
      rejectedAgentCount,
      rejectedAgentItems,
      rejectedCount,
      rejectedItems,
    ]
  );
  const activeQueueConfig =
    reviewQueues.find((queue) => queue.key === activeQueue) || null;

  async function handleStatusChange(item, nextStatus) {
    try {
      await updateKycStatus({ kycId: item.id, status: nextStatus });
      await load();
    } catch (err) {
      setError(err.message || "KYC status could not be updated.");
    }
  }

  async function handleAgentStatusChange(item, nextStatus, comment = "") {
    try {
      const trimmedComment = comment.trim();

      if (nextStatus === "rejected" && !trimmedComment) {
        setError("Add a rejection reason before rejecting an agent account.");
        return;
      }

      await updateAgentAccountStatus({
        accountId: item.id,
        status: nextStatus,
        comment: trimmedComment,
      });
      await createAdminNotification({
        title:
          nextStatus === "approved"
            ? "Agent account approved"
            : "Agent account needs attention",
        body:
          nextStatus === "approved"
            ? `Your ${item.account_name || "agent"} account has been approved by the admin team and is now ready to use.`
            : `Your ${item.account_name || "agent"} account request was rejected by the admin team. Reason: ${trimmedComment}. Please update your account details and upload fresh business documents before resubmitting.`,
        audienceType: "single_user",
        targetUserId: item.user_id,
        tone: nextStatus === "approved" ? "success" : "warning",
        isPopup: true,
      });
      await load();
    } catch (err) {
      setError(err.message || "Agent account status could not be updated.");
    }
  }

  const updateNotificationForm = (key, value) => {
    setNotificationForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "audienceType" && value === "all" ? { targetUserId: "" } : {}),
    }));
  };

  const handleNotificationSubmit = async () => {
    if (!notificationForm.title.trim() || !notificationForm.body.trim()) {
      setError("Notification title and message are required.");
      return;
    }

    if (notificationForm.audienceType === "single_user" && !notificationForm.targetUserId.trim()) {
      setError("A target user ID is required for a one-user notification.");
      return;
    }

    setNotificationBusy(true);
    setError("");

    try {
      await createAdminNotification({
        title: notificationForm.title.trim(),
        body: notificationForm.body.trim(),
        audienceType: notificationForm.audienceType,
        targetUserId:
          notificationForm.audienceType === "single_user"
            ? notificationForm.targetUserId.trim()
            : null,
        tone: notificationForm.tone,
        isPopup: notificationForm.isPopup,
      });

      setNotificationForm({
        title: "",
        body: "",
        audienceType: "all",
        targetUserId: "",
        tone: "info",
        isPopup: false,
      });

      await load();
    } catch (err) {
      setError(err.message || "Notification could not be sent.");
    } finally {
      setNotificationBusy(false);
    }
  };

  const handleArchiveNotification = async (notificationId) => {
    setArchiveBusyId(notificationId);
    setError("");

    try {
      await archiveAdminNotification(notificationId);
      await load();
    } catch (err) {
      setError(err.message || "Notification could not be archived.");
    } finally {
      setArchiveBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-400">Admin Panel</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">KYC & Notifications</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {pendingCount} pending
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <KycNotificationCard count={pendingCount} />
          <AdminNotificationFeed
            pendingCount={pendingCount}
            approvedTodayCount={approvedTodayCount}
            rejectedCount={rejectedCount}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Pending Reviews"
            value={pendingCount}
            tone="amber"
            active={activeQueue === "kyc-pending"}
            onClick={() => setActiveQueue((current) => (current === "kyc-pending" ? null : "kyc-pending"))}
          />
          <MetricCard
            label="Approved Accounts"
            value={approvedCount}
            tone="emerald"
            active={activeQueue === "kyc-approved"}
            onClick={() => setActiveQueue((current) => (current === "kyc-approved" ? null : "kyc-approved"))}
          />
          <MetricCard
            label="Rejected Accounts"
            value={rejectedCount}
            tone="rose"
            active={activeQueue === "kyc-rejected"}
            onClick={() => setActiveQueue((current) => (current === "kyc-rejected" ? null : "kyc-rejected"))}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Pending Agent Reviews"
            value={pendingAgentCount}
            tone="amber"
            active={activeQueue === "agent-pending"}
            onClick={() => setActiveQueue((current) => (current === "agent-pending" ? null : "agent-pending"))}
          />
          <MetricCard
            label="Approved Agent Accounts"
            value={approvedAgentCount}
            tone="emerald"
            active={activeQueue === "agent-approved"}
            onClick={() => setActiveQueue((current) => (current === "agent-approved" ? null : "agent-approved"))}
          />
          <MetricCard
            label="Rejected Agent Accounts"
            value={rejectedAgentCount}
            tone="rose"
            active={activeQueue === "agent-rejected"}
            onClick={() => setActiveQueue((current) => (current === "agent-rejected" ? null : "agent-rejected"))}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <NotificationComposer
            form={notificationForm}
            onChange={updateNotificationForm}
            onSubmit={handleNotificationSubmit}
            busy={notificationBusy}
          />
          <SentNotifications
            items={adminNotifications}
            onArchive={handleArchiveNotification}
            busyId={archiveBusyId}
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
        ) : null}

        {activeQueueConfig ? (
          <ReviewStatusSection
            eyebrow={activeQueueConfig.eyebrow}
            title={activeQueueConfig.title}
            count={activeQueueConfig.count}
            tone={activeQueueConfig.tone}
            loading={loading}
            emptyLabel={activeQueueConfig.emptyLabel}
            skeletonCount={activeQueueConfig.key.startsWith("kyc-") ? 3 : 2}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveQueue(null)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            {activeQueueConfig.items.map((item) => activeQueueConfig.renderCard(item))}
          </ReviewStatusSection>
        ) : (
          <QueuePlaceholder />
        )}
      </div>
    </div>
  );
}

