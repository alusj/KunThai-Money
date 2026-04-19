import { ChevronLeft } from "lucide-react";

export default function BackTab({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-slate-950 transition hover:bg-slate-100"
      aria-label="Go back"
    >
      <ChevronLeft size={34} strokeWidth={3} />
    </button>
  );
}
