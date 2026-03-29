// ======================================================
// MainAccountContainer.jsx
// ======================================================

import MainAccountStats from "./MainAccountStats";

export default function MainAccountContainer({ account }) {
  return (
    <div className="pr-1">
      <div
        className="
          rounded-[28px]
          border
          border-emerald-700
          bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(220,252,231,0.92))]
          px-5
          py-5
          shadow-[0_18px_40px_rgba(16,185,129,0.12)]
        "
      >
        <MainAccountStats account={account} />
      </div>
    </div>
  );
}
