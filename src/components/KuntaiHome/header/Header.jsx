import Search from "./search";
import Notification from "./notification";
import Profile from "./profile";
import Transactions from "./Transactions/Transactions";

export default function Header({
  setActiveScreen,
  displayName,
  loading = false,
  profile,
  notificationCount = 0,
}) {
  if (loading) {
    return (
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-xl">
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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
          KunThai Money
        </p>

        <div className="flex items-center gap-3">
          <Transactions setActiveScreen={setActiveScreen} />
          <Search onClick={() => setActiveScreen("search")} />
          <Notification count={notificationCount} onClick={() => setActiveScreen("notifications")} />
          <Profile name={displayName} profile={profile} onClick={() => setActiveScreen("profile")} />
        </div>
      </div>
    </header>
  );
}

