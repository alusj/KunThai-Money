export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#1f4f95_0%,#122b56_32%,#09172d_68%,#06111f_100%)] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-10%] top-[-12%] h-72 w-72 rounded-full bg-sky-400/18 blur-3xl" />
        <div className="absolute bottom-[-14%] right-[-10%] h-80 w-80 rounded-full bg-blue-500/18 blur-3xl" />
        <div className="absolute right-[12%] top-[18%] h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_42%,rgba(96,165,250,0.08)_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-5 text-center">
          {eyebrow && (
            <p className="mb-3 inline-flex rounded-full border border-sky-200/15 bg-white/8 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-100">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-3 text-sm leading-6 text-slate-200/90">{subtitle}</p>}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,24,45,0.94),rgba(8,18,35,0.96))] p-6 text-slate-100 shadow-[0_24px_80px_rgba(4,12,24,0.46)] backdrop-blur-xl sm:p-7">
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-slate-100">{footer}</div>}
      </div>
    </div>
  );
}
