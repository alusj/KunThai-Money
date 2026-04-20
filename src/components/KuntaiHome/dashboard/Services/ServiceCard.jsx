// ServiceCard.jsx
// Professional bordered service card
// Reduced font size + clean layout

import { useAppearance } from "../../../AppearanceProvider";

export default function ServiceCard({ icon, title, onClick }) {
  const { isDarkMode } = useAppearance();

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-3 transition-all duration-200 ${
        isDarkMode
          ? "accent-ring bg-slate-900/92 hover:bg-slate-800/92 hover:shadow-[0_14px_30px_var(--accent-soft-bg)]"
          : "accent-ring bg-white hover:shadow-md"
      }`}
    >
      <div
        className={`accent-chip mb-2 flex h-12 w-12 items-center justify-center rounded-full border ${
          isDarkMode ? "shadow-[0_10px_24px_var(--accent-soft-bg)]" : ""
        }`}
      >
        {icon}
      </div>

      <p className="accent-text text-center text-xs font-medium leading-tight">
        {title}
      </p>
    </div>
  );
}
