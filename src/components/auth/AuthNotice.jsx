export default function AuthNotice({ tone = "info", title, children }) {
  const styles = {
    info: "border-sky-300/18 bg-sky-400/10 text-sky-50",
    success: "border-emerald-300/18 bg-emerald-400/10 text-emerald-50",
    warning: "border-amber-300/18 bg-amber-400/10 text-amber-50",
    danger: "border-rose-300/18 bg-rose-400/10 text-rose-50",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_14px_34px_rgba(3,7,18,0.22)] backdrop-blur-xl ${styles[tone] ?? styles.info}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <p>{children}</p>
    </div>
  );
}
