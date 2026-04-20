export default function Transactions({ setActiveScreen, count = 0 }) {
  return (
    <button
      onClick={() => setActiveScreen("transactions")}
      className="group relative inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 sm:gap-2 sm:px-3 sm:text-sm"
    >
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm transition group-hover:bg-slate-800 sm:h-8 sm:w-8">
        <svg
          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 18V6" />
          <path d="M3 10l4-4 4 4" />
          <path d="M17 6v12" />
          <path d="M13 14l4 4 4-4" />
        </svg>
      </span>

      <span className="hidden sm:inline">Transactions</span>

      {count > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[0.62rem] font-semibold text-emerald-700 sm:min-w-6 sm:px-2 sm:text-[0.68rem]">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
