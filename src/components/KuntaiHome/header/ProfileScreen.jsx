import { useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  Fingerprint,
  Globe,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Monitor,
  Shield,
  Type,
  Wallet,
} from "lucide-react";
import BackTab from "./Transactions/BackTab";
import AuthNotice from "../../auth/AuthNotice";
import { useAppearance } from "../../AppearanceProvider";

function getVerificationCopy(status) {
  if (!status?.hasKyc) {
    return { label: "KYC Required", tone: "bg-amber-100 text-amber-700" };
  }

  if (status.kycStatus === "pending") {
    return { label: "KYC Pending", tone: "bg-sky-100 text-sky-700" };
  }

  if (status.kycStatus === "approved") {
    return { label: "Verified", tone: "bg-emerald-100 text-emerald-700" };
  }

  return { label: "Needs Review", tone: "bg-rose-100 text-rose-700" };
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

function SectionCard({ title, children }) {
  return (
    <section className="rounded-[28px] bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-slate-400">{title}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function RowAction({ icon: Icon, title, description, end, onClick, danger = false }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={`flex w-full items-center justify-between gap-4 rounded-[22px] px-4 py-4 text-left transition ${
        danger ? "bg-rose-50 hover:bg-rose-100" : "bg-slate-50 hover:bg-slate-100"
      }`}
    >
      <span className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${danger ? "bg-white text-rose-700" : "bg-white text-slate-700"}`}>
          <Icon size={18} />
        </span>
        <span>
          <span className={`block text-sm font-semibold sm:text-base ${danger ? "text-rose-800" : "text-slate-950"}`}>{title}</span>
          <span className={`mt-1 block text-xs leading-5 ${danger ? "text-rose-600" : "text-slate-500"}`}>{description}</span>
        </span>
      </span>
      <span className="shrink-0">{end}</span>
    </div>
  );
}

function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onChange?.();
      }}
      disabled={disabled}
      className={`relative h-7 w-12 rounded-full transition ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      } ${enabled ? "bg-slate-950" : "bg-slate-300"}`}
      aria-pressed={enabled}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} />
    </button>
  );
}

function ChevronEnd() {
  return <ChevronRight size={18} className="text-slate-400" />;
}

export default function ProfileScreen({
  name,
  profile,
  account,
  status,
  onBack,
  onOpenEditProfile,
  onOpenCreateAccount,
  onOpenChangePin,
  onOpenChangePassword,
  onOpenTransactions,
  onOpenNotifications,
  isAdmin,
  onOpenAdmin,
  onOpenTerms,
  onOpenHelp,
  onSignOut,
  biometrics,
  onToggleBiometrics,
  appearance,
  onToggleAppearance,
  hiddenDashboardItems = [],
}) {
  const { isDarkMode } = useAppearance();
  const verification = getVerificationCopy(status);
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    [name]
  );

  const [notificationState, setNotificationState] = useState({
    transactions: true,
    security: true,
    promotions: false,
    systemUpdates: true,
  });
  const [settingsState] = useState({
    language: "English",
    textSize: "Medium",
  });

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-[linear-gradient(180deg,#0f172a_0%,#111827_32%,#162033_100%)]"
          : "bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_28%,#f8fafc_100%)]"
      }`}
    >
      <div className={`border-b backdrop-blur-xl ${isDarkMode ? "border-slate-800 bg-slate-950/90" : "border-white/60 bg-white/80"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="text-center">
            <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.32em] ${isDarkMode ? "text-slate-300" : "text-slate-400"}`}>
              Profile Center
            </p>
           </div>
          <div className={`rounded-full px-3 py-2 text-xs font-semibold ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
            Active
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <section
          className={`relative overflow-hidden rounded-[34px] p-6 ${
            isDarkMode
              ? "bg-[linear-gradient(135deg,#0f172a_0%,#132238_52%,#0b1730_100%)] shadow-[0_24px_60px_rgba(2,6,23,0.34)]"
              : "bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_48%,#eef6ff_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
          }`}
        >
          <div className={`absolute inset-0 ${isDarkMode ? "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_22%)]" : "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_22%)]"}`} />
          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0f172a,#1d4ed8)] text-3xl font-semibold text-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
                  {profile?.profile_image ? (
                    <img src={profile.profile_image} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    initials || "U"
                  )}
                </div>

                <div>
                  <p className={`mt-2 text-2xl font-semibold sm:text-3xl ${isDarkMode ? "text-slate-50" : "text-slate-950"}`}>
                    {name}
                  </p>
                  <button
                    onClick={onOpenEditProfile}
                    className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Edit profile
                  </button>
                </div>
              </div>

              <button
                onClick={onOpenCreateAccount}
                className="rounded-[22px] bg-[linear-gradient(135deg,#0f172a,#1d4ed8)] px-5 py-4 text-left text-white shadow-[0_16px_36px_rgba(37,99,235,0.18)] transition hover:opacity-95 lg:min-w-[220px]"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/64">Account</p>
                <p className="mt-2 text-lg font-semibold">Add another account</p>
                <p className="mt-1 text-xs text-white/72">Create an eligible service or foreign account</p>
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className={`rounded-[24px] px-5 py-4 ${isDarkMode ? "bg-slate-900/80 shadow-[0_10px_24px_rgba(2,6,23,0.32)]" : "bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"}`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Account Number</p>
                <p className={`mt-2 break-all text-base font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-950"}`}>{account?.account_number || "Pending"}</p>
              </div>
              <div className={`rounded-[24px] px-5 py-4 ${isDarkMode ? "bg-slate-900/80 shadow-[0_10px_24px_rgba(2,6,23,0.32)]" : "bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"}`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Phone Number</p>
                <p className={`mt-2 text-base font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-950"}`}>{profile?.phone || "Phone not available"}</p>
              </div>
              <div className={`rounded-[24px] px-5 py-4 ${isDarkMode ? "bg-slate-900/80 shadow-[0_10px_24px_rgba(2,6,23,0.32)]" : "bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Verification</p>
                    <p className={`mt-2 text-base font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-950"}`}>{verification.label}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verification.tone}`}>{verification.label}</span>
                </div>
                <p className="mt-3 text-xs text-slate-500">Last seen {formatLastSeen(profile?.last_login_at)}</p>
              </div>
            </div>

            {hiddenDashboardItems.length ? (
              <div className={`mt-5 rounded-[24px] px-5 py-5 ${isDarkMode ? "bg-slate-900/80 shadow-[0_10px_24px_rgba(2,6,23,0.32)]" : "bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Hidden From Dashboard
                    </p>
                    <p className={`mt-2 text-base font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-950"}`}>
                      Hidden account items are restored here
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {hiddenDashboardItems.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {hiddenDashboardItems.map((item) => (
                    <div
                      key={item.key}
                      className={`flex flex-col gap-3 rounded-[22px] px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                        isDarkMode ? "bg-slate-950/80" : "bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-950"}`}>
                          {item.title}
                        </p>
                        <p className={`mt-1 text-xs break-all ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {item.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={item.onShow}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Show to dashboard
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <SectionCard title="Security">
            {biometrics?.message ? (
              <AuthNotice tone={biometrics.messageTone || "info"} title={biometrics.messageTitle}>
                {biometrics.message}
              </AuthNotice>
            ) : null}
            <RowAction
              icon={Shield}
              title="Change PIN"
              description="Update the PIN used for your protected account actions."
              end={<ChevronEnd />}
              onClick={onOpenChangePin}
            />
            <RowAction
              icon={Fingerprint}
              title="Enable biometrics"
              description={
                biometrics?.supported
                  ? "Use Face ID or fingerprint on this device before opening sensitive security actions."
                  : "This browser or device does not currently support platform biometrics for the app."
              }
              end={
                <Toggle
                  enabled={Boolean(biometrics?.enabled)}
                  disabled={Boolean(biometrics?.busy || !biometrics?.supported)}
                  onChange={onToggleBiometrics}
                />
              }
              onClick={onToggleBiometrics}
            />
            <RowAction
              icon={LockKeyhole}
              title="Change password"
              description="Verify your current password, then choose a new one."
              end={<ChevronEnd />}
              onClick={onOpenChangePassword}
            />
          </SectionCard>

          <SectionCard title="Notifications">
            <RowAction
              icon={Bell}
              title="Transactions notification"
              description="Cash in, cash out and activity alerts."
              end={<Toggle enabled={notificationState.transactions} onChange={() => setNotificationState((current) => ({ ...current, transactions: !current.transactions }))} />}
              onClick={onOpenNotifications}
            />
            <RowAction
              icon={Shield}
              title="Security"
              description="Suspicious sign-in and account protection alerts."
              end={<Toggle enabled={notificationState.security} onChange={() => setNotificationState((current) => ({ ...current, security: !current.security }))} />}
              onClick={onOpenNotifications}
            />
            <RowAction
              icon={Wallet}
              title="Promotions"
              description="Product offers and promotional campaigns."
              end={<Toggle enabled={notificationState.promotions} onChange={() => setNotificationState((current) => ({ ...current, promotions: !current.promotions }))} />}
              onClick={onOpenNotifications}
            />
            <RowAction
              icon={Monitor}
              title="System updates"
              description="Service improvements and maintenance notices."
              end={<Toggle enabled={notificationState.systemUpdates} onChange={() => setNotificationState((current) => ({ ...current, systemUpdates: !current.systemUpdates }))} />}
              onClick={onOpenNotifications}
            />
          </SectionCard>

          {isAdmin ? (
            <SectionCard title="Admin">
              <RowAction
                icon={BriefcaseBusiness}
                title="KYC & notifications"
                description="Open the admin review queue for identity checks and compliance alerts."
                end={<ChevronEnd />}
                onClick={onOpenAdmin}
              />
            </SectionCard>
          ) : null}

          <SectionCard title="Settings">
            <RowAction
              icon={Monitor}
              title="Appearance"
              description={
                appearance?.isDarkMode
                  ? "Dark mode is active across the app on this device."
                  : "Light mode is active across the app on this device."
              }
              end={<Toggle enabled={Boolean(appearance?.isDarkMode)} onChange={onToggleAppearance} />}
              onClick={onToggleAppearance}
            />
            <RowAction
              icon={Globe}
              title="Language"
              description="Current language preference."
              end={<span className="text-sm font-semibold text-slate-500">{settingsState.language}</span>}
              onClick={() => {}}
            />
            <RowAction
              icon={Type}
              title="Text size"
              description="Adjust the reading size used throughout the app."
              end={<span className="text-sm font-semibold text-slate-500">{settingsState.textSize}</span>}
              onClick={() => {}}
            />
          </SectionCard>

          <SectionCard title="Terms & Conditions">
            <RowAction
              icon={FileText}
              title="Privacy policy"
              description="How user information is collected and protected."
              end={<ChevronEnd />}
              onClick={onOpenTerms}
            />
            <RowAction
              icon={FileText}
              title="Terms of services"
              description="Rules guiding account and product usage."
              end={<ChevronEnd />}
              onClick={onOpenTerms}
            />
            <RowAction
              icon={CreditCard}
              title="Fees and charges"
              description="Charges applied to transfers and services."
              end={<ChevronEnd />}
              onClick={onOpenTerms}
            />
            <RowAction
              icon={Shield}
              title="KYC / compliance rules"
              description="Verification and compliance expectations."
              end={<ChevronEnd />}
              onClick={onOpenTerms}
            />
          </SectionCard>

          <SectionCard title="Help">
            <RowAction
              icon={MessageCircle}
              title="Live chat"
              description="Reserved for future in-app live support."
              end={<span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Future</span>}
              onClick={onOpenHelp}
            />
            <RowAction
              icon={MessageCircle}
              title="WhatsApp support"
              description="Fast support path for account and transfer issues."
              end={<ChevronEnd />}
              onClick={onOpenHelp}
            />
            <RowAction
              icon={MessageCircle}
              title="Email support"
              description="Reach support by email for detailed follow-up."
              end={<ChevronEnd />}
              onClick={onOpenHelp}
            />
            <RowAction
              icon={CircleHelp}
              title="Guides & Tutorial"
              description="Learning resources for common actions and product usage."
              end={<ChevronEnd />}
              onClick={onOpenHelp}
            />
            <RowAction
              icon={CircleHelp}
              title="FAQs"
              description="Common answers before contacting support."
              end={<ChevronEnd />}
              onClick={onOpenHelp}
            />
            <RowAction
              icon={CircleHelp}
              title="Didn't receive money"
              description="Troubleshooting for delayed or missing transfers."
              end={<ChevronEnd />}
              onClick={onOpenHelp}
            />
            <RowAction
              icon={CircleHelp}
              title="OTP not working"
              description="Support steps when verification codes do not arrive."
              end={<ChevronEnd />}
              onClick={onOpenHelp}
            />
            <RowAction
              icon={CircleHelp}
              title="Account locked / suspended"
              description="What to do when access is restricted or under review."
              end={<ChevronEnd />}
              onClick={onOpenHelp}
            />
          </SectionCard>

          <SectionCard title="Logout">
            <RowAction
              icon={LogOut}
              title="Logout from all devices"
              description="Close every active session connected to this account."
              end={<ChevronEnd />}
              onClick={() => onSignOut?.("all")}
              danger
            />
            <RowAction
              icon={LogOut}
              title="Logout from this device"
              description="End only the current device session securely."
              end={<ChevronEnd />}
              onClick={() => onSignOut?.("current")}
              danger
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
