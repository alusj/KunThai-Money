import BackTab from "./BackTab";

export default function TransactionsHeader({ setActiveScreen, summaryLabel }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
        <BackTab onBack={() => setActiveScreen("dashboard")} />

        <div className="text-center">
          <h1 className="mt-1 whitespace-nowrap text-lg font-bold text-slate-950 md:text-xl">
            Transaction History
          </h1>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
          {summaryLabel}
        </div>
      </div>
    </div>
  );
}
