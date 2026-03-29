// ServiceCard.jsx
// Professional bordered service card
// Reduced font size + clean layout

export default function ServiceCard({ icon, title, onClick }) {
  return (
    <div
      onClick={onClick}
      className="
        flex flex-col items-center justify-center
        p-3
        rounded-xl
        border
        border-gray-200
        bg-white

        transition-all
        duration-200
        hover:shadow-md
        hover:border-gray-300

        cursor-pointer
      "
    >
      {/* Icon */}
      <div className="
        w-12 h-12
        rounded-full
        bg-gray-100
        flex items-center justify-center
        mb-2
      ">
        {icon}
      </div>

      {/* Title */}
      <p className="
        text-xs
        font-medium
        text-gray-700
        text-center
        leading-tight
      ">
        {title}
      </p>
    </div>
  );
}
