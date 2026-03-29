import { useEffect } from "react";
import DonationHeader from "./DonationHeader";

export default function Donation({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <DonationHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay your donation easily.
        </p>

        <div className="border p-4 rounded-lg">
          Donation payment coming soon...
        </div>
      </div>

    </div>
  );
}
