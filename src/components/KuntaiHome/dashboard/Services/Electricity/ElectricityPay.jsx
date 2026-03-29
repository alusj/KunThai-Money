import { useEffect } from "react";
import ElectricityHeader from "./ElectricityHeader";

export default function ElectricityPay({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <ElectricityHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay your electricity bills securely.
        </p>

        <div className="border p-4 rounded-lg">
          Electricity payment form coming soon...
        </div>
      </div>

    </div>
  );
}
