// ui/BottomSheet.jsx
// Reusable half-screen modal (bank-grade UX)

export default function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/45"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="animate-slideUp flex max-h-[92dvh] min-h-[72dvh] w-full flex-col overflow-hidden rounded-t-[30px] bg-white shadow-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="border-b border-slate-100 px-4 pb-4 pt-3">
          <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-gray-300" />
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
