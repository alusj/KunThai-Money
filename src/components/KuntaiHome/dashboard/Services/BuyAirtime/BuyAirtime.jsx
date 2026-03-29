// PayMerchant.jsx
// Full screen overlay controller

import { useEffect } from "react";
import PayMerchantHeader from "./PayMerchantHeader";

export default function BuyAirtime({ onBack }) {

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <BuyAirtimeHeader onBack={onBack} />

      <div className="p-6">

        <p className="text-gray-600 mb-4">
          Buy Your local Airtime.
        </p>

        <div className="border p-4 rounded-lg">
          Buy Airtime coming soon...
        </div>

      </div>

    </div>
  );
}
