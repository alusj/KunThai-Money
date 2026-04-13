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
          ? "border-slate-700 bg-slate-900/92 hover:border-slate-500 hover:bg-slate-800/92 hover:shadow-[0_14px_30px_rgba(2,6,23,0.45)]"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
      }`}
    >
      <div
        className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
          isDarkMode ? "bg-slate-800 text-slate-100" : "bg-gray-100 text-slate-700"
        }`}
      >
        {icon}
      </div>

      <p
        className={`text-center text-xs font-medium leading-tight ${
          isDarkMode ? "text-slate-100" : "text-gray-700"
        }`}
      >
        {title}
      </p>
    </div>
  );
}
