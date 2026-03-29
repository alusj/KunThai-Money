import { formatCurrency } from "../../../../Backend/utils/formatCurrency";
import { getAccountTypeLabel } from "../../../../Backend/utils/accountTypes";

const accentStyles = {
  business: "border-l-indigo-600",
  transport: "border-l-blue-500",
  merchant: "border-l-sky-500",
  airtime: "border-l-green-500",
  electricity: "border-l-amber-500",
  government: "border-l-slate-500",
  hotel: "border-l-violet-500",
  insurance: "border-l-emerald-600",
  internet: "border-l-cyan-500",
  pharmacy: "border-l-lime-500",
  restaurant: "border-l-rose-500",
  school_fees: "border-l-fuchsia-500",
  supermarket: "border-l-orange-500",
  tickets: "border-l-red-500",
  tv_subscription: "border-l-purple-500",
  donation: "border-l-teal-500",
  foreign: "border-l-slate-950",
};

function OtherAccountCard({ account }) {
  const accentClass = accentStyles[account.account_type] || "border-l-slate-400";

  return (
    <div
      className={`bg-white border border-gray-200 border-l-4 rounded-xl p-4 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 ${accentClass}`}
    >
      <div>
        <h3 className="font-semibold text-gray-800">{account.account_name || getAccountTypeLabel(account.account_type)}</h3>
        <p className="text-sm text-gray-500">
          Balance: {formatCurrency(account.balance || 0, account.currency || "USD")}
        </p>
      </div>

      <button className="px-3 py-1 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 hover:shadow-md hover:shadow-blue-300 hover:scale-105 active:scale-95">
        Move Money
      </button>
    </div>
  );
}

export default function OtherAccountContainer({ accounts = [] }) {
  if (!accounts.length) {
    return null;
  }

  return (
    <section className="mt-10 w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Other Accounts</h2>
        <p className="text-sm text-gray-500">Manage your service wallets and linked accounts</p>
      </div>

      <div className="flex flex-col gap-4">
        {accounts.map((account) => (
          <OtherAccountCard key={account.id} account={account} />
        ))}
      </div>
    </section>
  );
}
