export default function BackTab({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
    >
      <span aria-hidden="true">{"<"}</span>
      <span>Back</span>
    </button>
  );
}
