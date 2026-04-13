import Search from "./search";
import Notification from "./notification";
import Profile from "./profile";
import Transactions from "./Transactions/Transactions";
import { useAppearance } from "../../AppearanceProvider";

export default function Header({
  setActiveScreen,
  displayName,
  loading = false,
  profile,
  notificationCount = 0,
  transactionCount = 0,
}) {
  const { isDarkMode } = useAppearance();

  if (loading) {
    return (
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkMode ? "border-slate-800 bg-slate-950/95" : "border-slate-200/80 bg-slate-50/95"}`}>
        <div className="mx-auto flex h-20 max-w-7xl animate-pulse items-center justify-between px-4 md:px-8">
          <div className="h-3 w-24 rounded bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-200" />
            <div className="h-11 w-11 rounded-full bg-slate-200" />
            <div className="h-11 w-11 rounded-full bg-slate-200" />
            <div className="h-11 w-11 rounded-full bg-slate-200" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkMode ? "border-slate-800 bg-slate-950/95" : "border-slate-200/80 bg-slate-50/95"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.3em] ${isDarkMode ? "text-slate-200" : "text-slate-400"}`}>
          KunThai Money
        </p>

        <div className="flex items-center gap-3">
          <Transactions setActiveScreen={setActiveScreen} count={transactionCount} />
          <Search onClick={() => setActiveScreen("search")} />
          <Notification count={notificationCount} onClick={() => setActiveScreen("notifications")} />
          <Profile name={displayName} profile={profile} onClick={() => setActiveScreen("profile")} />
        </div>
      </div>
    </header>
  );
}

