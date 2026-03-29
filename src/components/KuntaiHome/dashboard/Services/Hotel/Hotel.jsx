import { useEffect } from "react";
import HotelHeader from "./HotelHeader";

export default function Restaurant({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <HotelHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay your Hotel bills Easily.
        </p>

        <div className="border p-4 rounded-lg">
           Hotel bills payment form coming soon...
        </div>
      </div>

    </div>
  );
}
