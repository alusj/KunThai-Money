import { useEffect } from "react";
import TVSubscriptionHeader from "./TVSubscriptionHeader";

export default function TVSubscription({ onBack }) {

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

      <TVSubscriptionHeader onBack={onBack} />

      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Pay your TV subscriptions easily.
        </p>

        <div className="border p-4 rounded-lg">
          TV Subscription form coming soon...
        </div>
      </div>

    </div>
  );
}
