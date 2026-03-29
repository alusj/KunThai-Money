import { useEffect } from "react";
import SupermarketHeader from "./SupermarketHeader";

export default function Supermarket({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <SupermarketHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay your Supermarket bills Easily.
        </p>

        <div className="border p-4 rounded-lg">
           Supermarket bills payment form coming soon...
        </div>
      </div>

    </div>
  );
}
