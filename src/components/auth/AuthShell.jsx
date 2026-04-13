import { useAppearance } from "../AppearanceProvider";

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  const { isDarkMode } = useAppearance();

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 ${
        isDarkMode
          ? "bg-[radial-gradient(circle_at_top,#10254f_0%,#0b1835_42%,#07101f_100%)]"
          : "bg-[radial-gradient(circle_at_top,#183c7d_0%,#10254f_40%,#081326_100%)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_45%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-5 text-center">
          {eyebrow && (
            <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-3 text-sm leading-6 text-slate-200">{subtitle}</p>}
        </div>

        <div
          className={`rounded-[28px] border p-6 shadow-[0_24px_80px_rgba(4,12,24,0.4)] backdrop-blur sm:p-7 ${
            isDarkMode
              ? "border-white/10 bg-slate-950/88 text-slate-100"
              : "border-white/12 bg-white/96"
          }`}
        >
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-slate-200">{footer}</div>}
      </div>
    </div>
  );
}
