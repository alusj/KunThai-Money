import BackTab from "./BackTab";
import { useAppearance } from "../../../AppearanceProvider";

export default function TransactionsHeader({ setActiveScreen, summaryLabel }) {
  const { isDarkMode } = useAppearance();

  return (
    <div className={`border-b ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
        <BackTab onBack={() => setActiveScreen("dashboard")} />

        <div className="text-center">
          <h1 className={`mt-1 whitespace-nowrap text-lg font-bold md:text-xl ${isDarkMode ? "text-slate-100" : "text-slate-950"}`}>
            Transaction History
          </h1>
        </div>

        <div className={`rounded-full px-3 py-2 text-xs font-semibold ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
          {summaryLabel}
        </div>
      </div>
    </div>
  );
}
