import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CreditCard,
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

const TERMS_CONTENT = {
  privacy: {
    title: "Privacy policy",
    icon: FileText,
    description: "How Kuntai Money collects, uses, stores, and protects customer information.",
    sections: [
      {
        heading: "Information we collect",
        body:
          "We collect the information needed to open and operate your account, including your name, phone number, date of birth, address, identity details, device signals, transaction history, and any documents you submit during verification or support requests.",
      },
      {
        heading: "How we use your information",
        body:
          "Your information is used to create and secure your account, process transfers and payments, prevent fraud, complete identity checks, comply with legal obligations, improve service performance, and send important account, security, and product communications.",
      },
      {
        heading: "Sharing and disclosure",
        body:
          "We only share customer information where necessary with licensed financial partners, payment processors, identity verification providers, mobile network operators, auditors, regulators, or law enforcement where a lawful request applies. We do not sell your personal information.",
      },
      {
        heading: "Storage and protection",
        body:
          "We keep data in secured systems protected by access controls, monitoring, encryption, and operational safeguards. We retain information only for as long as needed to provide the service, resolve disputes, enforce our agreements, and satisfy record-keeping obligations.",
      },
      {
        heading: "Your privacy choices",
        body:
          "You are responsible for keeping your profile information accurate. Subject to applicable law, you may request access to your personal data, ask for corrections, object to certain processing, or request account closure, although some records may still be retained for compliance purposes.",
      },
    ],
  },
  service: {
    title: "Terms of service",
    icon: FileText,
    description: "The main rules that govern use of the Kuntai Money platform and wallet services.",
    sections: [
      {
        heading: "Account eligibility and acceptance",
        body:
          "By creating or using a Kuntai Money account, you confirm that the information you provide is true, complete, and belongs to you. You must be legally permitted to use financial services in your jurisdiction and must not act on behalf of another person without authority.",
      },
      {
        heading: "Use of the platform",
        body:
          "You may use the service for lawful personal or approved business transactions only. You must not use the platform for fraud, money laundering, terrorism financing, unauthorized cash cycling, abusive chargebacks, sanctions evasion, or any activity that exposes the service or other users to harm.",
      },
      {
        heading: "Security responsibilities",
        body:
          "You must keep your password, PIN, OTPs, and device access credentials confidential at all times. Transactions confirmed through your authenticated session may be treated as authorized unless we determine there is evidence of system error, compromise, or prohibited activity.",
      },
      {
        heading: "Service availability and limits",
        body:
          "Some features may be subject to eligibility checks, transaction limits, maintenance windows, partner availability, or regulatory restrictions. We may delay, decline, reverse, or place a hold on a transaction where additional review is required to protect customers, partners, or the platform.",
      },
      {
        heading: "Suspension and termination",
        body:
          "We may restrict, suspend, or close an account where we detect false information, suspicious activity, non-compliance, security risk, prolonged inactivity, or a breach of these terms. Where appropriate, remaining balances will be handled in line with law, partner rules, and ongoing investigations.",
      },
    ],
  },
  fees: {
    title: "Fees and charges",
    icon: CreditCard,
    description: "A clear summary of how service charges may apply across wallet activity.",
    sections: [
      {
        heading: "General charging principle",
        body:
          "Kuntai Money aims to display applicable fees before you confirm a transaction. Charges may vary by service type, transaction amount, payment rail, currency, destination, partner network, card scheme, or whether a transaction requires manual review or reversal handling.",
      },
      {
        heading: "Common fee categories",
        body:
          "Fees may apply to cash-in by card, cash-out to bank or mobile money, merchant payments, bill payments, foreign exchange, account servicing, failed reversal handling, or premium support channels where offered. Taxes, levies, and third-party charges may be added where required.",
      },
      {
        heading: "When fees are charged",
        body:
          "Transaction fees are generally deducted at the time the transaction is processed or reflected in the quoted total before confirmation. If a transfer fails after partner processing has started, non-refundable third-party charges may still apply where permitted by law.",
      },
      {
        heading: "Changes to pricing",
        body:
          "We may update fees from time to time to reflect market conditions, partner pricing, regulation, or product changes. Where required, we will provide notice through the app, website, SMS, email, or other official communication channels before updated charges take effect.",
      },
      {
        heading: "Customer responsibility",
        body:
          "You should review the fee summary shown before submitting any payment or transfer. By proceeding with a transaction, you authorize Kuntai Money to debit the applicable fees, charges, taxes, and partner costs from the funding source or account balance used for that transaction.",
      },
    ],
  },
  kyc: {
    title: "KYC / compliance rules",
    icon: Shield,
    description: "Identity verification and compliance obligations that support a safe financial platform.",
    sections: [
      {
        heading: "Verification requirement",
        body:
          "All customers must complete the required Know Your Customer checks before gaining access to certain features, limits, or account tiers. We may request government-issued identification, a selfie, proof of address, business documents, source-of-funds information, or other supporting records.",
      },
      {
        heading: "Customer obligations",
        body:
          "You must submit valid, current, and unaltered information and documents that belong to you or to an entity you are authorized to represent. If your profile details change, you must update them promptly and cooperate with any refresh or enhanced due diligence request.",
      },
      {
        heading: "Monitoring and review",
        body:
          "We monitor accounts and transactions to detect suspicious patterns, fraud risk, sanctions exposure, unusual activity, or other indicators that require investigation. Reviews may be automated or manual and may result in temporary limits, document requests, or delayed processing.",
      },
      {
        heading: "Restricted activity",
        body:
          "Accounts must not be used to conceal identity, move funds for third parties without disclosure, process proceeds of crime, structure transactions to avoid limits, or engage in any activity prohibited by anti-money laundering, counter-terrorist financing, or sanctions laws.",
      },
      {
        heading: "Compliance actions",
        body:
          "Where risk, legal, or regulatory concerns arise, Kuntai Money may refuse a transaction, freeze funds where permitted, file required reports, request additional explanation, or suspend account access until review is completed. Decisions are taken to protect customers, partners, and the wider financial system.",
      },
    ],
  },
};

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
  onToggleAppearance,
  isMainAccountNumberHidden = false,
  hiddenOtherAccounts = [],
  onShowMainAccountNumber,
  onShowOtherAccount,
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
  const [activeMenu, setActiveMenu] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
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
  const scrollPositionsRef = useRef({
    root: null,
    menus: {},
  });
  const pendingRestoreRef = useRef(null);

  const getScrollPosition = () => window.scrollY || window.pageYOffset || 0;

  const openMenu = (menuKey) => {
    scrollPositionsRef.current.root = getScrollPosition();
    setActivePolicy(null);
    setActiveMenu(menuKey);
  };

  const closeMenu = () => {
    pendingRestoreRef.current = scrollPositionsRef.current.root;
    setActivePolicy(null);
    setActiveMenu(null);
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

  if (hiddenOtherAccounts.length) {
    menuCards.splice(3, 0, {
      key: "other-accounts",
      icon: Wallet,
      title: "Other Accounts",
    });
  }
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
              title="Appearance"
              trailing={<Toggle enabled={Boolean(appearance?.isDarkMode)} onChange={onToggleAppearance} />}
              onClick={onToggleAppearance}
            />
            <MenuDivider />
            <MenuItem
              icon={Globe}
              title="Language"
              trailing={<span className="text-sm font-semibold text-slate-500">{settingsState.language}</span>}
              onClick={() => {}}
            />
            <MenuDivider />
            <MenuItem
              icon={Type}
              title="Text size"
              trailing={<span className="text-sm font-semibold text-slate-500">{settingsState.textSize}</span>}
              onClick={() => {}}
            />
          </MenuGroup>
        </MenuShell>
      );
    }

    if (activeMenu === "other-accounts") {
      return (
        <MenuShell>
          <MenuScreenHeader title="Other Accounts" onBack={closeMenu} icon={activeMenuItem?.icon || Wallet} />
          {hiddenOtherAccounts.length ? (
            <MenuGroup>
              {hiddenOtherAccounts.map((item, index) => (
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
                        <button
                          type="button"
                          onClick={() => onShowOtherAccount?.(item.id)}
                          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Show
                        </button>
                      </div>
                    </div>
                  </div>
                  {index !== hiddenOtherAccounts.length - 1 ? <MenuDivider /> : null}
                </div>
              ))}
            </MenuGroup>
          ) : (
            <MenuGroup>
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No hidden other accounts right now.
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
            <MenuItem icon={CircleHelp} title="FAQs" onClick={onOpenHelp} />
            <MenuDivider />
            <MenuItem icon={CircleHelp} title="Didn't receive money" onClick={onOpenHelp} />
            <MenuDivider />
            <MenuItem icon={CircleHelp} title="OTP not working" onClick={onOpenHelp} />
            <MenuDivider />
            <MenuItem icon={CircleHelp} title="Account locked / suspended" onClick={onOpenHelp} />
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
    return <PolicyFullscreenScreen policy={TERMS_CONTENT[activePolicy]} onBack={closePolicy} isDarkMode={isDarkMode} />;
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

                <div className="mt-6 grid gap-4 md:grid-cols-3">
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
