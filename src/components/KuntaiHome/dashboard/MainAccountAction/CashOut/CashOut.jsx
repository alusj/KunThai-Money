import { ArrowUpRight } from "lucide-react";
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
        className="inline-flex w-full items-center justify-between rounded-2xl bg-bank-primary px-4 py-3 text-sm font-semibold text-white shadow-soft"
      >
        <span>Cash Out</span>
        <ArrowUpRight size={18} />
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Cash Out to">
        <div className="space-y-3">
          <Bank />
          <MobileMoney />
          <AccountNumber />
        </div>
      </BottomSheet>
    </>
  );
}
