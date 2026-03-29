import { useEffect } from "react";
import InsuranceHeader from "./InsuranceHeader";

export default function Insurance({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <InsuranceHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay easily you insurance payment method.
        </p>

        <div className="border p-4 rounded-lg">
          Insurance payment form coming soon...
        </div>
      </div>

    </div>
  );
}
