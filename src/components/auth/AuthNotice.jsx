export default function AuthNotice({ tone = "info", title, children }) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-rose-200 bg-rose-50 text-rose-900",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${styles[tone] ?? styles.info}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <p>{children}</p>
    </div>
  );
}
