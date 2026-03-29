import { maskPhoneNumber } from "../../../Backend/utils/maskPhoneNumber";
import BackTab from "./Transactions/BackTab";

function getVerificationCopy(status) {
  if (!status?.hasKyc) {
    return { label: "KYC Required", tone: "text-amber-700 bg-amber-100" };
  }

  if (status.kycStatus === "pending") {
    return { label: "KYC Pending", tone: "text-sky-700 bg-sky-100" };
  }

  if (status.kycStatus === "approved") {
    return { label: "Verified", tone: "text-emerald-700 bg-emerald-100" };
  }

  return { label: "Needs Review", tone: "text-rose-700 bg-rose-100" };
}

function formatLastSeen(lastLoginAt) {
  if (!lastLoginAt) {
    return "Current session";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(lastLoginAt));
}

export default function ProfileScreen({
  name,
  profile,
  account,
  status,
  onBack,
  onOpenEditProfile,
  onOpenCreateAccount,
  onOpenSecurity,
  onOpenTransactions,
  onOpenNotifications,
  onOpenSettings,
  onOpenTerms,
  onOpenHelp,
  onSignOut,
}) {
  const verification = getVerificationCopy(status);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Profile Center
            </p>
            <h1 className="mt-2 text-lg font-bold text-slate-950 md:text-xl">Account & controls</h1>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            Active
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8)] text-3xl font-semibold text-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
              {profile?.profile_image ? (
                <img src={profile.profile_image} alt={name} className="h-full w-full object-cover" />
              ) : (
                initials || "U"
              )}
            </div>

            <p className="mt-5 text-2xl font-semibold text-slate-950">{name}</p>
            <button
              onClick={onOpenEditProfile}
              className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Edit profile
            </button>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Account Number
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">{account?.account_number || "Pending"}</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Phone Number
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {profile?.phone ? maskPhoneNumber(profile.phone) : "Phone not available"}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Verification Status
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{verification.label}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verification.tone}`}>
                  {verification.label}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Last seen {formatLastSeen(profile?.last_login_at)}</p>
            </div>
          </div>
        </div>

        <div className="my-6 border-t border-slate-200" />

        <div className="space-y-3">
          <button
            onClick={onOpenCreateAccount}
            className="flex w-full items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span>
              <span className="block text-lg font-semibold text-slate-950">Create another account</span>
              <span className="mt-1 block text-sm text-slate-500">Create an eligible service or foreign account.</span>
            </span>
            <span className="text-slate-400">{">"}</span>
          </button>

          <button
            onClick={onOpenSecurity}
            className="flex w-full items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span>
              <span className="block text-lg font-semibold text-slate-950">Security</span>
              <span className="mt-1 block text-sm text-slate-500">Manage PIN and account protection.</span>
            </span>
            <span className="text-slate-400">{">"}</span>
          </button>

          <button
            onClick={onOpenNotifications}
            className="flex w-full items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span>
              <span className="block text-lg font-semibold text-slate-950">Notifications</span>
              <span className="mt-1 block text-sm text-slate-500">Open important account and trust updates.</span>
            </span>
            <span className="text-slate-400">{">"}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex w-full items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span>
              <span className="block text-lg font-semibold text-slate-950">Settings</span>
              <span className="mt-1 block text-sm text-slate-500">Control profile and application preferences.</span>
            </span>
            <span className="text-slate-400">{">"}</span>
          </button>

          <button
            onClick={onOpenTransactions}
            className="flex w-full items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span>
              <span className="block text-lg font-semibold text-slate-950">Transactions</span>
              <span className="mt-1 block text-sm text-slate-500">Review full cash in and cash out history.</span>
            </span>
            <span className="text-slate-400">{">"}</span>
          </button>

          <button
            onClick={onOpenTerms}
            className="flex w-full items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span>
              <span className="block text-lg font-semibold text-slate-950">Terms and Conditions</span>
              <span className="mt-1 block text-sm text-slate-500">Review the terms guiding your account usage.</span>
            </span>
            <span className="text-slate-400">{">"}</span>
          </button>

          <button
            onClick={onOpenHelp}
            className="flex w-full items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span>
              <span className="block text-lg font-semibold text-slate-950">Help</span>
              <span className="mt-1 block text-sm text-slate-500">Get support and guidance for your account.</span>
            </span>
            <span className="text-slate-400">{">"}</span>
          </button>
        </div>

        <div className="my-6 border-t border-slate-200" />

        <button
          onClick={onSignOut}
          className="w-full rounded-[26px] bg-slate-950 p-5 text-left text-white transition hover:bg-slate-800"
        >
          <p className="text-lg font-semibold">Logout</p>
          <p className="mt-2 text-sm leading-6 text-white/70">Sign out of your KunThai Money session securely.</p>
        </button>
      </div>
    </div>
  );
}

