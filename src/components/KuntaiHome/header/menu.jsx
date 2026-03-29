// menu.jsx

export default function Menu() {
  return (
    <button className="p-2 rounded-md hover:bg-gray-100">
      <svg
        className="w-5 h-5 text-gray-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
