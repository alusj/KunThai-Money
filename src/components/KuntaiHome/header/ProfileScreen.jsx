import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Trash2,
  FileText,
  Fingerprint,
  Globe,
  Landmark,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Monitor,
  Palette,
  Shield,
  Ticket,
  Type,
  Wallet,
} from "lucide-react";
import BackTab from "./Transactions/BackTab";
import AuthNotice from "../../auth/AuthNotice";
import { useAppearance } from "../../AppearanceProvider";
import { LEGAL_CONTENT } from "../../legal/legalContent";

const HELP_CONTENT = {
  faqs: {
    title: "FAQs",
    description: "Quick answers to the questions most customers ask while using KunThai Money.",
    icon: CircleHelp,
    sections: [
      {
        heading: "Getting Started",
        body:
          "Use your registered phone number and password to sign in securely. After login, your main wallet appears on the dashboard, while profile gives access to edit profile, change PIN, change password, notifications, legal documents, and support. If you are opening the app for the first time, complete profile setup, transaction PIN creation, and KYC when prompted so your account is ready for higher-trust features.",
      },
      {
        heading: "Transfers And Receipts",
        body:
          "For normal wallet transfers, enter the recipient account number, verify the account, enter the amount, confirm the transfer, and approve with your transaction PIN. After a successful transfer, KunThai Money generates a receipt screen and also stores the transaction in history. Merchant, agent, school, hotel, restaurant, supermarket, pharmacy, insurance, donation, and event payments also keep receipts in transaction history, mainly under All Entries.",
      },
      {
        heading: "Other Accounts",
        body:
          "Other accounts let you create extra service or foreign-account profiles under the same customer identity. Some account types, like agent, insurance, donation, and event-related business accounts, may require documents and admin review before they become active. If an account is hidden from dashboard, you can restore it again from profile.",
      },
      {
        heading: "Security And Recovery",
        body:
          "Your sign-in uses password, while protected money actions use your transaction PIN. If you forget your transaction PIN, use Change PIN from Security settings instead of guessing repeatedly. If you forget your password, use the Forgot Password flow and complete OTP verification. For safer access, you can also enable biometrics on supported devices.",
      },
    ],
  },
  "missing-money": {
    title: "Didn't receive money",
    description: "Steps to follow when a sender has paid but the money has not reached the expected wallet yet.",
    icon: Wallet,
    sections: [
      {
        heading: "Check The Basics",
        body:
          "First confirm the sender used the correct account number and that the transfer shows as completed on their side. Ask for the receipt or transaction reference so you can compare the amount, time, recipient number, and payment type. If the sender made a service payment instead of a wallet transfer, the money may appear in transaction history rather than as a normal balance increase.",
      },
      {
        heading: "Refresh And Review",
        body:
          "Open transaction history and notifications to see whether the transfer was received, held, reversed, or redirected to a different service flow. If your account number was hidden from dashboard, restore it first from profile so you can clearly see the correct account again. Also confirm you are checking the right wallet when you have multiple other accounts.",
      },
      {
        heading: "Possible Causes",
        body:
          "Delays can happen when the sender entered the wrong account number, the transfer failed PIN verification, the receiving account is under review, the transfer was sent to another linked service account, or the transaction was still processing when you checked. Wallet conversions and service payments may also follow a different display path from standard cash in or account transfers.",
      },
      {
        heading: "What To Send Support",
        body:
          "If the money still does not appear, contact support with the sender account number, your receiving account number, amount, transfer date and time, transaction ID or reference number, and a screenshot of the receipt. This helps the team trace the movement faster and confirm whether the transfer succeeded, failed, or needs manual review.",
      },
    ],
  },
  otp: {
    title: "OTP not working",
    description: "What to do when your one-time password is late, expired, or not accepted.",
    icon: Shield,
    sections: [
      {
        heading: "Before Requesting Again",
        body:
          "Make sure your phone number is entered correctly with the right country code and that your network is active. OTP codes can expire quickly, so use the latest code only and avoid entering an older message after requesting a new one. If several codes arrive together, the most recent code is the valid one.",
      },
      {
        heading: "Common Fixes",
        body:
          "Wait briefly, then request a fresh OTP instead of retrying the same expired code. Close and reopen the screen if your session has stayed idle for a long time. If the app says the code is invalid, make sure there are no extra spaces when typing and that the number belongs to the same account you are verifying or recovering.",
      },
      {
        heading: "Password And PIN Recovery",
        body:
          "KunThai Money uses OTP mainly for password and identity recovery flows. Transaction PIN changes are handled from Security settings through Change PIN, while password recovery uses Forgot Password and OTP verification. If you are trying to fix the wrong problem, return to the correct recovery flow before requesting more codes.",
      },
      {
        heading: "When To Contact Support",
        body:
          "Contact support if multiple OTP requests fail over a longer period, if the code always expires before you can enter it, or if the code is accepted once and then blocked again unexpectedly. Share the phone number you used, the country code, the exact screen where OTP failed, and whether the issue happened during registration, login recovery, or another security step.",
      },
    ],
  },
  locked: {
    title: "Account locked / suspended",
    description: "Guidance when access is restricted for security, compliance, or review reasons.",
    icon: LockKeyhole,
    sections: [
      {
        heading: "Why Access May Be Limited",
        body:
          "An account may be locked or suspended when repeated security checks fail, verification information needs review, unusual activity is detected, required KYC details are missing, or a protected service account is still under admin review. Some restrictions are temporary, while others need action from the customer before access is restored.",
      },
      {
        heading: "What You Should Check",
        body:
          "Open notifications and profile status first. Look for KYC review updates, admin review messages for agent or other service accounts, or alerts asking you to correct submitted details. If you recently changed your password, transaction PIN, or device, make sure you are logging in with the latest credentials and not using expired recovery information.",
      },
      {
        heading: "How To Recover Safely",
        body:
          "If the problem is password-related, use Forgot Password and complete OTP recovery. If the issue is transaction PIN-related, go to Security and use Change PIN after confirming your login password. If your service account application was rejected, open the resubmission flow from the dashboard or notification prompt and upload corrected information and documents.",
      },
      {
        heading: "Escalation To Support",
        body:
          "If the restriction continues after checking your status and completing any required steps, contact support with your registered phone number, account number, the exact message shown on screen, and any recent action that may have triggered the lock. Include whether the issue affects your main wallet, another linked account, login, or only specific transactions.",
      },
    ],
  },
};

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

function SectionCard({ title, subtitle, children, compact = false }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className={compact ? "px-5 pt-5" : "px-5 pt-5"}>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</p>
        {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className={compact ? "px-0 pb-1 pt-3" : "px-0 pb-1 pt-3"}>{children}</div>
    </section>
  );
}

function MenuShell({ children }) {
  return <div className="rounded-[28px] bg-[#f3f4f6] p-3 sm:p-4">{children}</div>;
}

function MenuGroup({ children }) {
  return <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">{children}</div>;
}

function MenuItem({ icon: Icon, title, trailing = null, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-5 py-4 text-left transition ${
        danger ? "hover:bg-rose-50" : "hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          danger ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className={`min-w-0 flex-1 text-[1.02rem] font-semibold ${danger ? "text-rose-700" : "text-slate-950"}`}>
        {title}
      </span>
      {trailing || <ChevronRight size={18} className="text-slate-400" />}
    </button>
  );
}

function MenuDivider() {
  return <div className="ml-[4.6rem] h-px bg-slate-200" />;
}

function MenuScreenHeader({ title, onBack, icon: Icon = Landmark }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 px-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
          aria-label={`Back from ${title}`}
        >
          <ChevronLeft size={22} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h3 className="text-2xl font-bold text-slate-950">{title}</h3>
        </div>
        <div className="w-11" />
      </div>
      <div className="mt-5 flex justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
          <Icon size={26} />
        </span>
      </div>
    </div>
  );
}

function RowAction({ icon: Icon, title, description, end, onClick, danger = false, compact = false }) {
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
      className={`flex w-full items-center justify-between gap-4 text-left transition ${
        compact ? "px-5 py-4" : "px-5 py-4"
      } ${danger ? "hover:bg-rose-50" : "hover:bg-slate-50"}`}
    >
      <span className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${danger ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
          <Icon size={18} />
        </span>
        <span>
          <span className={`block text-[1rem] font-semibold ${danger ? "text-rose-800" : "text-slate-950"}`}>{title}</span>
          {description ? (
            <span className={`mt-1 block text-xs leading-5 ${danger ? "text-rose-600" : "text-slate-500"}`}>{description}</span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0">{end}</span>
    </div>
  );
}

function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      type="button"
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

function SelectionOption({ title, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[1.02rem] font-semibold text-slate-950">{title}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
        ) : null}
      </span>
      <span
        className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
          selected ? "border-sky-500" : "border-slate-300"
        }`}
      >
        <span className={`h-3 w-3 rounded-full ${selected ? "bg-sky-500" : "bg-transparent"}`} />
      </span>
    </button>
  );
}

function ColorThemeOption({ title, value, selected, onClick }) {
  const colorClassMap = {
    default: "from-emerald-400 to-blue-700",
    black: "from-slate-700 to-black",
    ocean: "from-sky-400 to-blue-600",
    emerald: "from-emerald-400 to-teal-600",
    violet: "from-violet-400 to-fuchsia-600",
    amber: "from-amber-300 to-orange-500",
    rose: "from-rose-400 to-pink-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-[22px] border px-4 py-4 text-left transition ${
        selected ? "border-slate-950 bg-slate-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center gap-4">
        <span className={`h-11 w-11 rounded-full bg-gradient-to-br ${colorClassMap[value] || colorClassMap.ocean} shadow-[0_12px_24px_rgba(15,23,42,0.18)]`} />
        <span>
          <span className="block text-[1.02rem] font-semibold text-slate-950">{title}</span>
          <span className="mt-1 block text-sm text-slate-500">Accent color for highlights and service styling.</span>
        </span>
      </span>
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
          selected ? "border-slate-950" : "border-slate-300"
        }`}
      >
        <span className={`h-3 w-3 rounded-full ${selected ? "bg-slate-950" : "bg-transparent"}`} />
      </span>
    </button>
  );
}

function SubmenuHeader({ title, description, onBack }) {
  return (
    <div className="mb-4 flex items-start gap-3 px-1">
      <button
        type="button"
        onClick={onBack}
        className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
        aria-label={`Back from ${title}`}
      >
        <ChevronLeft size={18} />
      </button>
      <div>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function PolicyViewer({ policy, onBack }) {
  const Icon = policy.icon || FileText;

  return (
    <div className="space-y-4">
      <SubmenuHeader title={policy.title} description={policy.description} onBack={onBack} />
      <MenuGroup>
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-[1.02rem] font-semibold text-slate-950">{policy.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{policy.description}</p>
            </div>
          </div>
        </div>
        <div className="space-y-0">
          {policy.sections.map((section, index) => (
            <div key={section.heading}>
              <div className="px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{section.heading}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
              </div>
              {index !== policy.sections.length - 1 ? <MenuDivider /> : null}
            </div>
          ))}
        </div>
      </MenuGroup>
    </div>
  );
}

function PolicyFullscreenScreen({ policy, onBack, isDarkMode }) {
  const Icon = policy.icon || FileText;

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-[linear-gradient(180deg,#0f172a_0%,#111827_32%,#162033_100%)]"
          : "bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_28%,#f8fafc_100%)]"
      }`}
    >
      <div className={`border-b backdrop-blur-xl ${isDarkMode ? "border-slate-800 bg-slate-950/90" : "border-white/60 bg-white/80"}`}>
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="min-w-0 flex-1">
            <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.32em] ${isDarkMode ? "text-slate-300" : "text-slate-400"}`}>
              Terms & Conditions
            </p>
            <h2 className={`mt-1 truncate text-xl font-bold ${isDarkMode ? "text-slate-50" : "text-slate-950"}`}>{policy.title}</h2>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div className="rounded-[28px] bg-[#f3f4f6] p-3 sm:p-4">
          <div className="mb-4 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
              <Icon size={26} />
            </span>
          </div>
          <MenuGroup>
            <div className="border-b border-slate-200 px-5 py-5">
              <p className="text-[1.02rem] font-semibold text-slate-950">{policy.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{policy.description}</p>
            </div>
            <div>
              {policy.sections.map((section, index) => (
                <div key={section.heading}>
                  <div className="px-5 py-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{section.heading}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
                  </div>
                  {index !== policy.sections.length - 1 ? <MenuDivider /> : null}
                </div>
              ))}
            </div>
          </MenuGroup>
        </div>
      </div>
    </div>
  );
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
  onOpenNotifications,
  isAdmin,
  onOpenAdmin,
  onOpenHelp,
  onSignOut,
  biometrics,
  onToggleBiometrics,
  appearance,
  onChangeAppearanceMode,
  isMainAccountNumberHidden = false,
  otherAccounts = [],
  hiddenOtherAccounts = [],
  onShowMainAccountNumber,
  onShowOtherAccount,
  hasEventAccount = false,
  hasPurchasedEventTickets = false,
  hasEventSales = false,
  onOpenEventTickets,
  onOpenEventManager,
}) {
  const {
    isDarkMode,
    language,
    resolvedLanguageLabel,
    availableLanguages,
    textSize,
    accentColor,
    availableThemeColors,
    setLanguage,
    setTextSize,
    setAccentColor,
  } = useAppearance();
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
  const [activeMenu, setActiveMenu] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [activeHelpTopic, setActiveHelpTopic] = useState(null);
  const [notificationState, setNotificationState] = useState({
    transactions: true,
    security: true,
    promotions: false,
    systemUpdates: true,
  });
  const hiddenOtherAccountIds = useMemo(
    () => new Set(hiddenOtherAccounts.map((item) => String(item.id))),
    [hiddenOtherAccounts]
  );
  const scrollPositionsRef = useRef({
    root: null,
    menus: {},
  });
  const pendingRestoreRef = useRef(null);

  const getScrollPosition = () => window.scrollY || window.pageYOffset || 0;

  const openMenu = (menuKey) => {
    scrollPositionsRef.current.root = getScrollPosition();
    setActivePolicy(null);
    setActiveHelpTopic(null);
    setActiveMenu(menuKey);
  };

  const closeMenu = () => {
    pendingRestoreRef.current = scrollPositionsRef.current.root;
    setActivePolicy(null);
    setActiveHelpTopic(null);
    setActiveMenu(null);
  };

  const closeSettingsSubmenu = () => {
    setActiveMenu("settings");
  };

  const openPolicy = (policyKey) => {
    if (!activeMenu) {
      return;
    }

    scrollPositionsRef.current.menus[activeMenu] = getScrollPosition();
    setActivePolicy(policyKey);
  };

  const closePolicy = () => {
    pendingRestoreRef.current = activeMenu ? scrollPositionsRef.current.menus[activeMenu] : null;
    setActivePolicy(null);
  };

  const openHelpTopic = (topicKey) => {
    if (!activeMenu) {
      return;
    }

    scrollPositionsRef.current.menus[activeMenu] = getScrollPosition();
    setActiveHelpTopic(topicKey);
  };

  const closeHelpTopic = () => {
    pendingRestoreRef.current = activeMenu ? scrollPositionsRef.current.menus[activeMenu] : null;
    setActiveHelpTopic(null);
  };

  useLayoutEffect(() => {
    if (typeof pendingRestoreRef.current !== "number") {
      return;
    }

    const targetScroll = pendingRestoreRef.current;
    pendingRestoreRef.current = null;
    window.scrollTo({ top: targetScroll, behavior: "auto" });
  }, [activeMenu, activePolicy]);

  const menuCards = [
    {
      key: "security",
      icon: Shield,
      title: "Security",
    },
    {
      key: "notifications",
      icon: Bell,
      title: "Notifications",
    },
    {
      key: "settings",
      icon: Monitor,
      title: "Settings",
    },
    {
      key: "terms",
      icon: FileText,
      title: "Terms & Conditions",
    },
    {
      key: "help",
      icon: CircleHelp,
      title: "Help",
    },
    {
      key: "logout",
      icon: LogOut,
      title: "Logout",
      danger: true,
    },
  ];
  const activeMenuItem = menuCards.find((item) => item.key === activeMenu);

  const renderMenuContent = () => {
    if (activeMenu === "security") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Security" onBack={closeMenu} icon={activeMenuItem?.icon || Shield} />
          {biometrics?.message ? (
            <div className="mb-4">
              <AuthNotice tone={biometrics.messageTone || "info"} title={biometrics.messageTitle}>
                {biometrics.message}
              </AuthNotice>
            </div>
          ) : null}
          <MenuGroup>
            <MenuItem icon={Shield} title="Change PIN" onClick={onOpenChangePin} />
            <MenuDivider />
            <MenuItem
              icon={Fingerprint}
              title="Enable biometrics"
              trailing={
                <Toggle
                  enabled={Boolean(biometrics?.enabled)}
                  disabled={Boolean(biometrics?.busy || !biometrics?.supported)}
                  onChange={onToggleBiometrics}
                />
              }
              onClick={onToggleBiometrics}
            />
            <MenuDivider />
            <MenuItem icon={LockKeyhole} title="Change password" onClick={onOpenChangePassword} />
          </MenuGroup>
        </MenuShell>
      );
    }

    if (activeMenu === "notifications") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Notifications" onBack={closeMenu} icon={activeMenuItem?.icon || Bell} />
          <MenuGroup>
            <MenuItem
              icon={Bell}
              title="Transactions"
              trailing={
                <Toggle
                  enabled={notificationState.transactions}
                  onChange={() =>
                    setNotificationState((current) => ({ ...current, transactions: !current.transactions }))
                  }
                />
              }
              onClick={onOpenNotifications}
            />
            <MenuDivider />
            <MenuItem
              icon={Shield}
              title="Security alerts"
              trailing={
                <Toggle
                  enabled={notificationState.security}
                  onChange={() =>
                    setNotificationState((current) => ({ ...current, security: !current.security }))
                  }
                />
              }
              onClick={onOpenNotifications}
            />
            <MenuDivider />
            <MenuItem
              icon={CreditCard}
              title="Promotions"
              trailing={
                <Toggle
                  enabled={notificationState.promotions}
                  onChange={() =>
                    setNotificationState((current) => ({ ...current, promotions: !current.promotions }))
                  }
                />
              }
              onClick={onOpenNotifications}
            />
            <MenuDivider />
            <MenuItem
              icon={Monitor}
              title="System updates"
              trailing={
                <Toggle
                  enabled={notificationState.systemUpdates}
                  onChange={() =>
                    setNotificationState((current) => ({
                      ...current,
                      systemUpdates: !current.systemUpdates,
                    }))
                  }
                />
              }
              onClick={onOpenNotifications}
            />
          </MenuGroup>
        </MenuShell>
      );
    }

    if (activeMenu === "settings") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Settings" onBack={closeMenu} icon={activeMenuItem?.icon || Monitor} />
          <MenuGroup>
            <MenuItem
              icon={Palette}
              title="Dark mode"
              trailing={
                <span className="text-sm font-semibold text-slate-500">
                  {appearance?.mode === "system"
                    ? "System"
                    : appearance?.mode === "dark"
                      ? "On"
                      : "Off"}
                </span>
              }
              onClick={() => openMenu("appearance")}
            />
            <MenuDivider />
            <MenuItem
              icon={Globe}
              title="Language"
              trailing={<span className="text-sm font-semibold text-slate-500">{resolvedLanguageLabel}</span>}
              onClick={() => openMenu("language")}
            />
            <MenuDivider />
            <MenuItem
              icon={Type}
              title="Text size"
              trailing={
                <span className="text-sm font-semibold capitalize text-slate-500">{textSize}</span>
              }
              onClick={() => openMenu("text-size")}
            />
            <MenuDivider />
            <MenuItem
              icon={Palette}
              title="Theme colors"
              trailing={<span className="text-sm font-semibold capitalize text-slate-500">{accentColor}</span>}
              onClick={() => openMenu("theme-colors")}
            />
          </MenuGroup>
        </MenuShell>
      );
    }

    if (activeMenu === "appearance") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Dark mode" onBack={closeSettingsSubmenu} icon={Palette} />
          <MenuGroup>
            <SelectionOption
              title="On"
              selected={appearance?.mode === "dark"}
              onClick={() => onChangeAppearanceMode?.("dark")}
            />
            <MenuDivider />
            <SelectionOption
              title="Off"
              selected={appearance?.mode === "light"}
              onClick={() => onChangeAppearanceMode?.("light")}
            />
            <MenuDivider />
            <SelectionOption
              title="System"
              description="We'll adjust your appearance based on your device's system settings."
              selected={appearance?.mode === "system"}
              onClick={() => onChangeAppearanceMode?.("system")}
            />
          </MenuGroup>
        </MenuShell>
      );
    }

    if (activeMenu === "language") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Language" onBack={closeSettingsSubmenu} icon={Globe} />
          <MenuGroup>
            {availableLanguages.map((option, index) => (
              <div key={option.value}>
                <SelectionOption
                  title={option.label}
                  description={
                    option.value === "system"
                      ? "We'll follow your device language when localized app text is available."
                      : option.value === "en"
                        ? "Current app content is fully written in English."
                        : "Saved as your preferred language while localized app text is expanded."
                  }
                  selected={language === option.value}
                  onClick={() => setLanguage(option.value)}
                />
                {index !== availableLanguages.length - 1 ? <MenuDivider /> : null}
              </div>
            ))}
          </MenuGroup>
        </MenuShell>
      );
    }

    if (activeMenu === "text-size") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Text size" onBack={closeSettingsSubmenu} icon={Type} />
          <MenuGroup>
            <SelectionOption
              title="Small"
              description="A tighter layout with slightly smaller text across the app."
              selected={textSize === "small"}
              onClick={() => setTextSize("small")}
            />
            <MenuDivider />
            <SelectionOption
              title="Medium"
              description="Balanced default sizing for most screens."
              selected={textSize === "medium"}
              onClick={() => setTextSize("medium")}
            />
            <MenuDivider />
            <SelectionOption
              title="Large"
              description="A more readable layout with bigger text across the app."
              selected={textSize === "large"}
              onClick={() => setTextSize("large")}
            />
          </MenuGroup>
        </MenuShell>
      );
    }

    if (activeMenu === "theme-colors") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Theme colors" onBack={closeSettingsSubmenu} icon={Palette} />
          <div className="space-y-3">
            {availableThemeColors.map((option) => (
              <ColorThemeOption
                key={option.value}
                title={option.label}
                value={option.value}
                selected={accentColor === option.value}
                onClick={() => setAccentColor(option.value)}
              />
            ))}
          </div>
        </MenuShell>
      );
    }

    if (activeMenu === "other-accounts") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Other Accounts" onBack={closeMenu} icon={activeMenuItem?.icon || Wallet} />
          {otherAccounts.length ? (
            <MenuGroup>
              {otherAccounts.map((item, index) => {
                const isHidden = hiddenOtherAccountIds.has(String(item.id));

                return (
                  <div key={item.id}>
                    <div className="flex items-center gap-4 px-5 py-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                        <Wallet size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[1.02rem] font-semibold text-slate-950">
                          {item.account_name || "Other Account"}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <p className="break-all text-xs text-slate-500">{item.account_number || "Account number pending"}</p>
                          {isHidden ? (
                            <button
                              type="button"
                              onClick={() => onShowOtherAccount?.(item.id)}
                              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                              Show
                            </button>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                              Visible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {index !== otherAccounts.length - 1 ? <MenuDivider /> : null}
                  </div>
                );
              })}
            </MenuGroup>
          ) : (
            <MenuGroup>
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No other accounts added yet.
              </div>
            </MenuGroup>
          )}
        </MenuShell>
      );
    }

    if (activeMenu === "terms") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Terms & Conditions" onBack={closeMenu} icon={activeMenuItem?.icon || FileText} />
          <MenuGroup>
            <MenuItem icon={FileText} title="Privacy policy" onClick={() => openPolicy("privacy")} />
            <MenuDivider />
            <MenuItem icon={FileText} title="Terms of service" onClick={() => openPolicy("service")} />
            <MenuDivider />
            <MenuItem icon={CreditCard} title="Fees and charges" onClick={() => openPolicy("fees")} />
            <MenuDivider />
            <MenuItem icon={Shield} title="KYC / compliance rules" onClick={() => openPolicy("kyc")} />
          </MenuGroup>
        </MenuShell>
      );
    }

    if (activeMenu === "help") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Help" onBack={closeMenu} icon={activeMenuItem?.icon || CircleHelp} />
          <MenuGroup>
            <MenuItem icon={MessageCircle} title="Live chat" onClick={onOpenHelp} />
            <MenuDivider />
            <MenuItem icon={MessageCircle} title="WhatsApp support" onClick={onOpenHelp} />
            <MenuDivider />
            <MenuItem icon={MessageCircle} title="Email support" onClick={onOpenHelp} />
            <MenuDivider />
            <MenuItem icon={CircleHelp} title="Guides & tutorial" onClick={onOpenHelp} />
            <MenuDivider />
            <MenuItem icon={CircleHelp} title="FAQs" onClick={() => openHelpTopic("faqs")} />
            <MenuDivider />
            <MenuItem icon={Wallet} title="Didn't receive money" onClick={() => openHelpTopic("missing-money")} />
            <MenuDivider />
            <MenuItem icon={Shield} title="OTP not working" onClick={() => openHelpTopic("otp")} />
            <MenuDivider />
            <MenuItem icon={LockKeyhole} title="Account locked / suspended" onClick={() => openHelpTopic("locked")} />
          </MenuGroup>
        </MenuShell>
      );
    }

    if (activeMenu === "logout") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Logout" onBack={closeMenu} icon={activeMenuItem?.icon || LogOut} />
          <MenuGroup>
            <MenuItem
              icon={LogOut}
              title="Logout from all devices"
              onClick={() => onSignOut?.("all")}
              danger
            />
            <MenuDivider />
            <MenuItem
              icon={LogOut}
              title="Logout from this device"
              onClick={() => onSignOut?.("current")}
              danger
            />
            <MenuDivider />
            <MenuItem
              icon={Trash2}
              title="Delete account"
              onClick={onOpenHelp}
              danger
            />
          </MenuGroup>
        </MenuShell>
      );
    }

    return (
      <MenuShell>
        <div className="mb-4 px-2">
          <h3 className="text-2xl font-bold text-slate-950">Settings</h3>
        </div>

        <div className="space-y-5">
          <MenuGroup>
            {menuCards
              .filter((item) => !item.danger)
              .map((item, index, items) => (
                <div key={item.key}>
                  <MenuItem icon={item.icon} title={item.title} onClick={() => openMenu(item.key)} />
                  {index !== items.length - 1 ? <MenuDivider /> : null}
                </div>
              ))}
          </MenuGroup>

          <MenuGroup>
            {menuCards
              .filter((item) => item.danger)
              .map((item) => (
                <MenuItem
                  key={item.key}
                  icon={item.icon}
                  title={item.title}
                  onClick={() => openMenu(item.key)}
                  danger
                />
              ))}
          </MenuGroup>
        </div>
      </MenuShell>
    );
  };

  if (activePolicy && activeMenu === "terms") {
    return <PolicyFullscreenScreen policy={LEGAL_CONTENT[activePolicy]} onBack={closePolicy} isDarkMode={isDarkMode} />;
  }

  if (activeHelpTopic && activeMenu === "help") {
    return (
      <PolicyFullscreenScreen
        policy={HELP_CONTENT[activeHelpTopic]}
        onBack={closeHelpTopic}
        isDarkMode={isDarkMode}
      />
    );
  }

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
        {activeMenu ? (
          <div className="mt-2">{renderMenuContent()}</div>
        ) : (
          <>
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
                        type="button"
                        onClick={onOpenEditProfile}
                        className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Edit profile
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenCreateAccount}
                    className="rounded-[22px] bg-[linear-gradient(135deg,#0f172a,#1d4ed8)] px-5 py-4 text-left text-white shadow-[0_16px_36px_rgba(37,99,235,0.18)] transition hover:opacity-95 lg:min-w-[220px]"
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/64">Account</p>
                    <p className="mt-2 text-lg font-semibold">Add another account</p>
                    <p className="mt-1 text-xs text-white/72">Create an eligible service or foreign account</p>
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className={`rounded-[24px] px-5 py-4 ${isDarkMode ? "bg-slate-900/80 shadow-[0_10px_24px_rgba(2,6,23,0.32)]" : "bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Account Number</p>
                        <p className={`mt-2 break-all text-base font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-950"}`}>
                          {account?.account_number || "Pending"}
                        </p>
                      </div>
                      {isMainAccountNumberHidden && account?.account_number ? (
                        <button
                          type="button"
                          onClick={onShowMainAccountNumber}
                          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Show
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className={`rounded-[24px] px-5 py-4 ${isDarkMode ? "bg-slate-900/80 shadow-[0_10px_24px_rgba(2,6,23,0.32)]" : "bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"}`}>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Phone Number</p>
                    <p className={`mt-2 text-base font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-950"}`}>{profile?.phone || "Phone not available"}</p>
                  </div>
                  {hiddenOtherAccounts.length ? (
                    <button
                      type="button"
                      onClick={() => openMenu("other-accounts")}
                      className={`rounded-[24px] px-5 py-4 text-left transition hover:-translate-y-0.5 ${
                        isDarkMode
                          ? "bg-slate-900/80 shadow-[0_10px_24px_rgba(2,6,23,0.32)] hover:bg-slate-900"
                          : "bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Other Accounts</p>
                          <p className={`mt-2 text-base font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-950"}`}>
                            {hiddenOtherAccounts.length} hidden
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 p-2 text-slate-700">
                          <ChevronRight size={16} />
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Restore hidden account numbers back to the dashboard from here.
                      </p>
                    </button>
                  ) : null}
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

              </div>
            </section>

            <div className="mt-6 space-y-5">
              {hasPurchasedEventTickets || hasEventSales ? (
                <SectionCard
                  title="Events"
                  subtitle="Keep event tickets and event verification tools close to your profile when you need them."
                >
                  {hasPurchasedEventTickets ? (
                    <RowAction
                      icon={Ticket}
                      title="Event Tickets"
                      description="Open your purchased tickets, see ticket codes, and generate QR codes only when you want them."
                      end={<ChevronEnd />}
                      onClick={onOpenEventTickets}
                    />
                  ) : null}
                  {hasPurchasedEventTickets && hasEventSales ? <MenuDivider /> : null}
                  {hasEventSales ? (
                    <RowAction
                      icon={Shield}
                      title="Events"
                      description="Validate buyers by code or QR image and mark tickets as used at the gate."
                      end={<ChevronEnd />}
                      onClick={onOpenEventManager}
                    />
                  ) : null}
                </SectionCard>
              ) : null}

              {renderMenuContent()}

              {isAdmin ? (
                <SectionCard
                  title="Admin"
                  subtitle="Admin tools stay separate so they do not compete with everyday profile settings."
                >
                  <RowAction
                    icon={BriefcaseBusiness}
                    title="KYC & Notifications"
                    description="Open the admin review queue for identity checks and compliance alerts."
                    end={<ChevronEnd />}
                    onClick={onOpenAdmin}
                  />
                </SectionCard>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
