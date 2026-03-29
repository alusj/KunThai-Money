// dashboard/MainAccountActions/MainAccountActions.jsx
// Groups Cash In and Cash Out actions

import CashIn from "./CashIn/CashIn";
import CashOut from "./CashOut/CashOut";

export default function MainAccountAction() {
  return (
    <div className="flex flex-col gap-3">
      <CashIn />
      <CashOut />
    </div>
  );
}
