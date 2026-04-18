import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import BottomSheet from "./BottomSheet";
import Bank from "./Bank";
import MobileMoney from "./MobileMoney";
import AccountNumber from "./AccountNumber";

export default function CashOut({ account, user, profile, refreshAccount, otherAccounts = [] }) {
  const [open, setOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(null);
  const foreignAccount = otherAccounts.find(
    (item) => item.account_type === "foreign" && item.status !== "rejected"
  ) || null;

  const handleClose = () => {
    setOpen(false);
    setActiveOption(null);
  };

  return (
    <>
      <button
        onClick={() => {
          setActiveOption("account");
          setOpen(true);
        }}
        className="inline-flex w-full items-center justify-between rounded-2xl bg-bank-primary px-4 py-3 text-sm font-semibold text-white shadow-soft"
      >
        <span>Cash Out</span>
        <ArrowUpRight size={18} />
      </button>

      <BottomSheet
        isOpen={open}
        onClose={handleClose}
        title={
          activeOption === "account"
            ? "Account Number"
            : activeOption === "foreign-convert"
              ? "Convert to Foreign Account"
              : "Cash Out to"
        }
      >
        {activeOption === "account" || activeOption === "foreign-convert" ? (
          <AccountNumber
            account={account}
            user={user}
            profile={profile}
            onClose={handleClose}
            refreshAccount={refreshAccount}
            initialValues={
              activeOption === "foreign-convert" && foreignAccount
                ? {
                    accountNumber: foreignAccount.account_number || "",
                    reason: "Convert to foreign account",
                  }
                : null
            }
            conversionConfig={
              activeOption === "foreign-convert" && foreignAccount
                ? {
                    flow: "main_to_foreign_conversion",
                    targetAccount: foreignAccount,
                    targetLabel: "Foreign Account",
                  }
                : null
            }
          />
        ) : (
          <div className="space-y-3">
            <Bank />
            <MobileMoney />
            <button
              type="button"
              onClick={() => setActiveOption("account")}
              className="w-full"
            >
              <div className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <span className="text-base font-semibold">#</span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Account Number</span>
                    <span className="mt-1 block text-xs text-slate-500">Send to a recipient account and review before confirming</span>
                  </span>
                </span>
                <ArrowUpRight size={18} className="text-slate-500" />
              </div>
            </button>
            {foreignAccount ? (
              <button
                type="button"
                onClick={() => setActiveOption("foreign-convert")}
                className="w-full"
              >
                <div className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50">
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <span className="text-base font-semibold">$</span>
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">Convert to Foreign Account</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Move money from main account into your foreign wallet
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight size={18} className="text-slate-500" />
                </div>
              </button>
            ) : null}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
