// CashOut/CashOut.jsx
// Main Cash Out button + modal controller

import { useState } from "react";
import BottomSheet from "./BottomSheet";
import Bank from "./Bank";
import MobileMoney from "./MobileMoney";
import AccountNumber from "./AccountNumber";

export default function CashOut() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-bank-primary px-4 py-3 text-sm font-semibold text-white shadow-soft">
        Cash Out
      </button>

      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Cash Out to"
      >
        <div className="space-y-3">
          <Bank />
          <MobileMoney />
          <AccountNumber />
        </div>
      </BottomSheet>
    </>
  );
}
