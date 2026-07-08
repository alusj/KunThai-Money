import { ChevronLeft } from "lucide-react";

import AccountNumber from "../../MainAccountAction/CashOut/AccountNumber";

function ForeignConvertHeader({ onBack }) {
  return (
    <div className="relative flex h-14 items-center justify-center border-b">
      <div className="absolute left-4">
        <button
          onClick={onBack}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-950 shadow-sm backdrop-blur-sm transition hover:bg-slate-100"
          aria-label="Go back"
        >
          <ChevronLeft size={34} strokeWidth={3} />
        </button>
      </div>

      <h1 className="text-lg font-semibold">Convert to Foreign Account</h1>
    </div>
  );
}

export default function ForeignConvert({
  onBack,
  refreshAccount,
  account,
  user,
  profile,
  otherAccounts = [],
}) {
  const foreignAccount =
    otherAccounts.find(
      (item) => item.account_type === "foreign" && item.status !== "rejected"
    ) || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,#ecfdf5_0%,#f8fafc_28%,#ffffff_62%)]">
      <ForeignConvertHeader onBack={onBack} />

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <section className="mb-6 rounded-[32px] border border-emerald-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-emerald-700">
            Wallet Conversion
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">
            Move money into your foreign wallet
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Convert funds from your main account into your foreign account at the live
            exchange rate, then review before confirming.
          </p>
        </section>

        {foreignAccount ? (
          <AccountNumber
            account={account}
            user={user}
            profile={profile}
            onClose={onBack}
            refreshAccount={refreshAccount}
            backLabel="Back to conversion"
            initialValues={{
              accountNumber: foreignAccount.account_number || "",
              reason: "Convert to foreign account",
            }}
            conversionConfig={{
              flow: "main_to_foreign_conversion",
              targetAccount: foreignAccount,
              targetLabel: "Foreign Account",
            }}
            successBanner={{
              title: "Conversion Successful",
              message: "Your wallet conversion receipt is ready below.",
            }}
            errorTitle="Conversion unsuccessful"
          />
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
              No foreign account yet
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950">
              Create a foreign account first
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Once you open a foreign account, you can convert money from your main
              account into it here at the live exchange rate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
