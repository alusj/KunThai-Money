import { useEffect } from "react";
import GovServicesHeader from "./GovServicesHeader";

export default function GovServices({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <GovServicesHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay for your government services easily.
        </p>

        <div className="border p-4 rounded-lg">
          Government services payment form coming soon...
        </div>
      </div>

    </div>
  );
}
