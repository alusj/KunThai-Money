import { useEffect } from "react";
import SchoolFeesHeader from "./SchoolFeesHeader";

export default function SchoolFees({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <SchoolFeesHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay your School Fees easily.
        </p>

        <div className="border p-4 rounded-lg">
          School Fees payment form coming soon...
        </div>
      </div>

    </div>
  );
}
