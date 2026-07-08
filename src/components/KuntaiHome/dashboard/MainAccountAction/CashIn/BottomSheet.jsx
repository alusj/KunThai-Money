// ui/BottomSheet.jsx
// Reusable half-screen modal (bank-grade UX)

import { useEffect } from "react";

export default function BottomSheet({ isOpen, onClose, title, children }) {
  // Freeze the page behind the sheet so only the sheet responds.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-4 animate-slideUp max-h-[92dvh] overflow-y-auto overscroll-contain">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        {children}
      </div>
    </>
  );
}
