import { useEffect } from "react";
import GovServicesHeader from "./GovServicesHeader";
import { useTranslation } from "../../../../useTranslation.jsx";

export default function GovServices({ onBack }) {
  const { t } = useTranslation();

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
          {t("Pay for your government services easily.")}
        </p>

        <div className="border p-4 rounded-lg">
          {t("Government services payment form coming soon...")}
        </div>
      </div>

    </div>
  );
}
