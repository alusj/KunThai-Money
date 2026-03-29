import { useEffect } from "react";
import InternetHeader from "./InternetHeader";

export default function InternetPay({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <InternetHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay internet subscriptions easily.
        </p>

        <div className="border p-4 rounded-lg">
          Internet payment form coming soon...
        </div>
      </div>

    </div>
  );
}
