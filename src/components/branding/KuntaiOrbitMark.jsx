export default function KuntaiOrbitMark({ className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_35%),linear-gradient(145deg,rgba(255,255,255,0.14),rgba(15,23,42,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_24px_80px_rgba(8,15,40,0.42)]" />
      <div className="absolute inset-[8%] rounded-[1.6rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(15,23,42,0.2))]" />
      <div className="absolute inset-[16%] rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.2),rgba(15,23,42,0.85))]" />

      <svg
        viewBox="0 0 240 240"
        aria-hidden="true"
        className="absolute inset-[18%] h-[64%] w-[64%] drop-shadow-[0_18px_30px_rgba(15,23,42,0.55)]"
      >
        <defs>
          <linearGradient id="kuntai-metal" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>

        <path
          d="M120 28c40 0 74 24 90 58"
          fill="none"
          stroke="url(#kuntai-metal)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M120 52c28 0 54 16 69 39"
          fill="none"
          stroke="url(#kuntai-metal)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.82"
        />
        <path
          d="M120 76c18 0 35 10 45 24"
          fill="none"
          stroke="url(#kuntai-metal)"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.72"
        />

        <path
          d="M58 162 120 86l62 76h-28l-34-42-34 42H58Z"
          fill="none"
          stroke="url(#kuntai-metal)"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path
          d="M86 162l34-42 34 42"
          fill="none"
          stroke="url(#kuntai-metal)"
          strokeWidth="10"
          strokeLinejoin="round"
          opacity="0.82"
        />
        <path
          d="M68 176c20 16 84 16 104 0"
          fill="none"
          stroke="url(#kuntai-metal)"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.78"
        />
      </svg>

      <div className="absolute inset-x-0 bottom-[10%] text-center">
        <p className="text-[0.5rem] font-semibold uppercase tracking-[0.5em] text-slate-100/70 sm:text-[0.58rem]">
          KunTai Money
        </p>
      </div>
    </div>
  );
}

