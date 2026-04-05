import { ArrowDownLeft } from "lucide-react";
import { useState } from "react";
import BottomSheet from "./BottomSheet";
import Bank from "./Bank";
import MobileMoney from "./MobileMoney";
import RequestPayment from "./RequestPayment";

export default function CashIn({ account, user }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-between rounded-2xl bg-bank-accent px-4 py-3 text-sm font-semibold text-white shadow-soft"
      >
        <span>Cash In</span>
        <ArrowDownLeft size={18} />
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Cash In from">
        <div className="space-y-3">
          <Bank account={account} user={user} />
          <MobileMoney />
          <RequestPayment />
        </div>
      </BottomSheet>
    </>
  );
}
