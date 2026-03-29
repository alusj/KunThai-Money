import { useEffect } from "react";
import RestaurantHeader from "./RestaurantHeader";

export default function Restaurant({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <RestaurantHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay your Restaurant bills Easily.
        </p>

        <div className="border p-4 rounded-lg">
           Restaurant payment form coming soon...
        </div>
      </div>

    </div>
  );
}
