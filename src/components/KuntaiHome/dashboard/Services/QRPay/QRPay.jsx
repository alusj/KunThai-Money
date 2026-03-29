import { useEffect } from "react";
import QRPayHeader from "./QRPayHeader";

export default function QRPay({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <QRPayHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay easily using QR Code payment method.
        </p>

        <div className="border p-4 rounded-lg">
          QR Code payment form coming soon...
        </div>
      </div>

    </div>
  );
}
