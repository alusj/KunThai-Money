// ui/BottomSheet.jsx
// Reusable half-screen modal (bank-grade UX)

export default function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-4 animate-slideUp">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        {children}
      </div>
    </>
  );
}
