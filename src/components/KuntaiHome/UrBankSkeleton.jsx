// ======================================================
// UrBankSkeleton.jsx (PREMIUM FINTECH SKELETON)
// Matches dashboard UI structure
// ======================================================

export default function UrBankSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pt-4">
        <div className="rounded-[30px] border-2 border-emerald-700/80 p-1.5">
          <div className="flex flex-col gap-5 rounded-[26px] border border-emerald-800/90 bg-white p-4 md:flex-row md:justify-between">
            <div className="flex-1">
              <div className="rounded-[28px] bg-emerald-50 px-5 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-4 w-36 rounded bg-emerald-100" />
                  <div className="h-8 w-20 rounded-full bg-white" />
                </div>
                <div className="h-10 w-44 rounded bg-emerald-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:flex md:w-auto md:flex-col">
              <div className="h-12 w-full rounded-2xl bg-blue-200 md:w-28" />
              <div className="h-12 w-full rounded-2xl bg-green-200 md:w-28" />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="h-9 w-24 rounded-full bg-slate-100" />
          </div>
          <div className="h-6 w-full rounded bg-slate-100" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow"
            >
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-100" />
              </div>

              <div className="h-8 w-28 rounded-full bg-blue-200" />
            </div>
          ))}
        </div>
    </div>
  );
}
