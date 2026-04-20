// ======================================================
// MainAccountContainer.jsx
// ======================================================

import MainAccountStats from "./MainAccountStats";

export default function MainAccountContainer({ account }) {
  return (
    <div className="pr-1">
      <div
        className="
          accent-surface
          accent-ring
          rounded-[28px]
          border
          px-5
          py-5
          shadow-[0_18px_40px_var(--accent-soft-bg)]
        "
      >
        <MainAccountStats account={account} />
      </div>
    </div>
  );
}
