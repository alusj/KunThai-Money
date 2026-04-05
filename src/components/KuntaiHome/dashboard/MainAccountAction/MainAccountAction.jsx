// dashboard/MainAccountActions/MainAccountActions.jsx
// Groups Cash In and Cash Out actions

import CashIn from "./CashIn/CashIn";
import CashOut from "./CashOut/CashOut";

export default function MainAccountAction({ account, user }) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto md:flex-col md:gap-4">
      <CashIn account={account} user={user} />
      <CashOut />
    </div>
  );
}
