// ======================================================
// dashboard/MainAccountCard/MainAccountCard.jsx
// Main Account Card
// Premium dual-border container
// Now receives real banking data
// ======================================================

import MainAccountContainer from "./MainAccountContainer/MainAccountContainer";
import MainAccountAction from "./MainAccountAction/MainAccountAction";
import { useAppearance } from "../../AppearanceProvider";

export default function MainAccountCard({ account, user, profile, refreshAccount, otherAccounts = [] }) {
  const { isDarkMode } = useAppearance();

  return (
    <section className="mb-5 w-full">
      <div
        className={`accent-surface accent-ring rounded-[30px] border-2 p-1.5 ${
          isDarkMode
            ? "shadow-[0_26px_60px_var(--accent-soft-bg)]"
            : "shadow-[0_26px_60px_var(--accent-soft-bg)]"
        }`}
      >
        <div
          className={`dashboard-panel dashboard-panel-strong flex flex-col items-stretch gap-5 rounded-[26px] border p-4 md:flex-row md:items-start md:justify-between md:gap-5 ${
            isDarkMode
              ? "accent-ring bg-slate-950/88"
              : "accent-ring bg-white"
          }`}
        >
          <div className="flex-1">
            <MainAccountContainer account={account} />
          </div>

          <div className="w-full md:w-auto md:shrink-0">
            <MainAccountAction
              account={account}
              user={user}
              profile={profile}
              refreshAccount={refreshAccount}
              otherAccounts={otherAccounts}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
