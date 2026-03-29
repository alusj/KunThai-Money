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
        className="bg-bank-primary text-white px-4 py-2 rounded-lg shadow-soft">
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
