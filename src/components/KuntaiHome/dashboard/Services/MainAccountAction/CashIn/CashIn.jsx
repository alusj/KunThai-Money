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
        className="bg-bank-accent text-white px-6 py-2 rounded-lg shadow-soft">
  Cash In
</button>

      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Cash In from"
      >
        <div className="space-y-3">
          <Bank />
          <MobileMoney />
          <RequestPayment />
        </div>
      </BottomSheet>
    </>
  );
}
