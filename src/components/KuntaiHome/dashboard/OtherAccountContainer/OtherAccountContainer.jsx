import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../../../../Backend/utils/formatCurrency";
import { getAccountTypeLabel } from "../../../../Backend/utils/accountTypes";
import { useAppearance } from "../../../AppearanceProvider";
import BottomSheet from "../MainAccountAction/CashOut/BottomSheet";
import AccountNumber from "../MainAccountAction/CashOut/AccountNumber";

const HIDDEN_OTHER_ACCOUNT_CONTENT_KEY = "kuntai-hidden-other-account-content";

const accentStyles = {
  business: "border-l-indigo-600",
  transport: "border-l-blue-500",
  merchant: "border-l-sky-500",
  airtime: "border-l-green-500",
  electricity: "border-l-amber-500",
  government: "border-l-slate-500",
  hotel: "border-l-violet-500",
  insurance: "border-l-emerald-600",
  internet: "border-l-cyan-500",
  pharmacy: "border-l-lime-500",
  restaurant: "border-l-rose-500",
  school_fees: "border-l-fuchsia-500",
  supermarket: "border-l-orange-500",
  tickets: "border-l-red-500",
  tv_subscription: "border-l-purple-500",
  donation: "border-l-teal-500",
  foreign: "border-l-slate-950",
};

function maskValue(value = "", visibleEnd = 0) {
  if (!value) {
    return "";
  }

  if (!visibleEnd) {
    return "*".repeat(value.length);
  }

  const safeVisibleEnd = Math.min(visibleEnd, value.length);
  return `${"*".repeat(Math.max(value.length - safeVisibleEnd, 0))}${value.slice(-safeVisibleEnd)}`;
}

function readHiddenAccountContentIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HIDDEN_OTHER_ACCOUNT_CONTENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistHiddenAccountContentIds(ids) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(HIDDEN_OTHER_ACCOUNT_CONTENT_KEY, JSON.stringify(ids));
}

function OtherAccountCard({
  account,
  mainAccount,
  user,
  profile,
  refreshAccount,
  onHideFromDashboard,
  onMoveToMain,
  onEditRejectedAgent,
}) {
  const { isDarkMode } = useAppearance();
  const [isConcealed, setIsConcealed] = useState(() =>
    readHiddenAccountContentIds().includes(String(account.id))
  );
  const accentClass = isConcealed
    ? "border-l-slate-400"
    : accentStyles[account.account_type] || "border-l-slate-400";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isForeignAccount = account.account_type === "foreign";
  const agentReviewStatus = account?.metadata?.agent_profile?.review_status || account?.status || "pending";
  const isRejectedAgent = account?.account_type === "agent" && agentReviewStatus === "rejected";
  const rejectionReason =
    account?.metadata?.agent_profile?.rejection_reason ||
    account?.metadata?.agent_profile?.rejection_comment ||
    "";
  const [activeForeignAction, setActiveForeignAction] = useState(null);

  useEffect(() => {
    const currentIds = readHiddenAccountContentIds();
    const nextIds = isConcealed
      ? [...new Set([...currentIds, String(account.id)])]
      : currentIds.filter((id) => id !== String(account.id));

    persistHiddenAccountContentIds(nextIds);
  }, [account.id, isConcealed]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const title = isConcealed
    ? "Hidden account"
    : account.account_name || getAccountTypeLabel(account.account_type);
  const accountNumber = isConcealed
    ? maskValue(account.account_number || "Pending", 0)
    : account.account_number || "Account number pending";
  const balanceLabel = isConcealed
    ? `Balance: ${maskValue(formatCurrency(account.balance || 0, account.currency || "USD"), 0)}`
    : `Balance: ${formatCurrency(account.balance || 0, account.currency || "USD")}`;

  return (
    <div
      className={`rounded-xl border border-l-4 p-4 transition-all duration-300 ${
        isDarkMode
          ? "border-slate-700 bg-slate-900/92 hover:border-sky-400 hover:shadow-[0_18px_34px_rgba(2,6,23,0.42)]"
          : "border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg hover:-translate-y-1"
      } ${accentClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
            {title}
          </h3>
          <p className={`mt-1 break-all font-mono text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
            {accountNumber}
          </p>
          <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-500"}`}>
            {balanceLabel}
          </p>
        </div>

        {isConcealed ? (
          <span
            className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${
              isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
            }`}
          >
            Hidden
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              isDarkMode
                ? "border-slate-600 text-slate-100 hover:bg-slate-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            ...
          </button>

          {menuOpen && (
            <div
              className={`absolute right-0 top-12 z-20 min-w-[220px] rounded-3xl border p-2 shadow-2xl ${
                isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (isForeignAccount) {
                    setActiveForeignAction("convert-main");
                  } else {
                    onMoveToMain?.(account);
                  }
                  setMenuOpen(false);
                }}
                className={`flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isDarkMode ? "text-emerald-200 hover:bg-slate-800" : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {isForeignAccount ? "Convert to main acc" : "Move to main"}
              </button>
              {isForeignAccount ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveForeignAction("international-transfer");
                    setMenuOpen(false);
                  }}
                  className={`flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    isDarkMode ? "text-sky-200 hover:bg-slate-800" : "text-sky-700 hover:bg-sky-50"
                  }`}
                >
                  International / Foreign transfer
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setIsConcealed((current) => !current);
                  setMenuOpen(false);
                }}
                className={`flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isDarkMode ? "text-slate-100 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isConcealed ? "Show" : "Hide"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onHideFromDashboard?.(account.id);
                  setMenuOpen(false);
                }}
                className={`flex w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isDarkMode ? "text-rose-200 hover:bg-rose-950/40" : "text-rose-600 hover:bg-rose-50"
                }`}
              >
                Remove from dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {isRejectedAgent ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 ${
            isDarkMode ? "border-amber-700/70 bg-amber-950/20 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Rejected by admin</p>
          <p className="mt-2 text-sm leading-6">
            {rejectionReason || "This account needs fresh business documents before it can be approved."}
          </p>
          <button
            type="button"
            onClick={() => onEditRejectedAgent?.(account)}
            className={`mt-3 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isDarkMode ? "bg-slate-100 text-slate-950 hover:bg-white" : "bg-slate-950 text-white hover:bg-slate-800"
            }`}
          >
            Open
          </button>
        </div>
      ) : null}

      {isForeignAccount && activeForeignAction ? (
        <BottomSheet
          isOpen={Boolean(activeForeignAction)}
          onClose={() => setActiveForeignAction(null)}
          title={
            activeForeignAction === "convert-main"
              ? "Convert to Main Account"
              : "International / Foreign Transfer"
          }
        >
          <AccountNumber
            account={account}
            user={user}
            profile={profile}
            onClose={() => setActiveForeignAction(null)}
            refreshAccount={refreshAccount}
            initialValues={
              activeForeignAction === "convert-main"
                ? {
                    accountNumber: mainAccount?.account_number || "",
                    reason: "Convert to main account",
                  }
                : null
            }
            conversionConfig={
              activeForeignAction === "convert-main"
                ? {
                    flow: "foreign_to_main_conversion",
                    targetAccount: mainAccount,
                    targetLabel: "Main Account",
                  }
                : null
            }
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}

export default function OtherAccountContainer({
  accounts = [],
  mainAccount,
  user,
  profile,
  refreshAccount,
  onHideAccountFromDashboard,
  onMoveAccountToMain,
  onEditRejectedAgent,
}) {
  const { isDarkMode } = useAppearance();

  if (!accounts.length) {
    return null;
  }

  return (
    <section className="mt-10 w-full">
      <div className="mb-4">
        <h2 className={`text-lg font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
          Other Accounts
        </h2>
        <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-500"}`}>
          Manage your service wallets and linked accounts
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {accounts.map((account) => (
          <OtherAccountCard
            key={account.id}
            account={account}
            mainAccount={mainAccount}
            user={user}
            profile={profile}
            refreshAccount={refreshAccount}
            onHideFromDashboard={onHideAccountFromDashboard}
            onMoveToMain={onMoveAccountToMain}
            onEditRejectedAgent={onEditRejectedAgent}
          />
        ))}
      </div>
    </section>
  );
}
