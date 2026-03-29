// PayMerchantHeader.jsx
// Header layout for Pay Merchant screen

import BackTab from "./BackTab";

export default function BuyAirtimeHeader({ onBack }) {
  return (
    <div className="relative flex items-center justify-center h-14 border-b">

      {/* Back Button (absolute left) */}
      <div className="absolute left-4">
        <BackTab onBack={onBack} />
      </div>

      {/* Perfectly Centered Title */}
      <h1 className="text-lg font-semibold">
        Buy Airtime
      </h1>

    </div>
  );
}
