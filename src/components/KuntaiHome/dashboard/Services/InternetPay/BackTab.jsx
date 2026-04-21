import { ChevronLeft } from "lucide-react";
import { useTranslation } from "../../../../useTranslation.jsx";

export default function BackTab({ onBack }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onBack}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-950 shadow-sm backdrop-blur-sm transition hover:bg-slate-100"
      aria-label={t("Go back")}
    >
      <ChevronLeft size={34} strokeWidth={3} />
    </button>
  );
}
