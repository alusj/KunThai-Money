export default function Transactions({ setActiveScreen, count = 0 }) {
  return (
    <button
      onClick={() => setActiveScreen("transactions")}
      className="group relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm transition group-hover:bg-slate-800">
        <svg
          className="h-4 w-4"
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
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 py-0.5 text-[0.68rem] font-semibold text-emerald-700">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
