// CashIn/CashIn.jsx
// Main Cash In button + modal controller

import { useState } from "react";
import BottomSheet from "./BottomSheet";
import Bank from "./Bank";
import MobileMoney from "./MobileMoney";
import RequestPayment from "./RequestPayment";

export default function CashIn() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-bank-accent px-4 py-3 text-sm font-semibold text-white shadow-soft">
        Cash In
      </button>

      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Cash In from"
      >
        <div className="space-y-2">
          <Bank />
          <MobileMoney />
          <RequestPayment />
        </div>
      </BottomSheet>
    </>
  );
}
