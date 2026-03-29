// ======================================================
// dashboard/MainAccountCard/MainAccountCard.jsx
// Main Account Card
// Premium dual-border container
// Now receives real banking data
// ======================================================

import MainAccountContainer from "./MainAccountContainer/MainAccountContainer";
import MainAccountAction from "./MainAccountAction/MainAccountAction";

export default function MainAccountCard({ account }) {
  return (
    <section className="mb-5 w-full">
      <div
        className="
          rounded-[30px]
          border-2
          border-emerald-700/90
          bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.82))]
          p-1.5
          shadow-[0_26px_60px_rgba(5,150,105,0.14)]
        "
      >
        <div
          className="
            flex
            flex-col
            items-stretch
            gap-5
            rounded-[26px]
            border
            border-emerald-800/90
            bg-white
            p-4
            md:flex-row
            md:items-start
            md:justify-between
            md:gap-5
          "
        >
          <div className="flex-1">
            <MainAccountContainer account={account} />
          </div>

          <div className="w-full md:w-auto md:shrink-0">
            <MainAccountAction />
          </div>
        </div>
      </div>
    </section>
  );
}
