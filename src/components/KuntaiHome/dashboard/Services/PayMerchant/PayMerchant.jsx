// PayMerchant.jsx
// Full screen overlay controller

import { useEffect } from "react";
import PayMerchantHeader from "./PayMerchantHeader";

export default function PayMerchant({ onBack }) {

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <PayMerchantHeader onBack={onBack} />

      <div className="p-6">

        <p className="text-gray-600 mb-4">
          Pay registered merchants instantly.
        </p>

        <div className="border p-4 rounded-lg">
          Merchant payment form coming soon...
        </div>

      </div>

    </div>
  );
}
