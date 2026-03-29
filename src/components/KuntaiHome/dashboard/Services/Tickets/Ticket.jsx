import { useEffect } from "react";
import TicketHeader from "./TicketHeader";

export default function Ticket({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <TicketHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Buy your ticket easil using this payment method.
        </p>

        <div className="border p-4 rounded-lg">
          Ticket payment form coming soon...
        </div>
      </div>

    </div>
  );
}
