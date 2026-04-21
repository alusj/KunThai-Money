import BackTab from "./BackTab";
import { useTranslation } from "../../../../useTranslation.jsx";

export default function GovServicesHeader({ onBack }) {
  const { t } = useTranslation();

  return (
    <div className="relative flex items-center justify-center h-14 border-b">

      <div className="absolute left-4">
        <BackTab onBack={onBack} />
      </div>

      <h1 className="text-lg font-semibold">
        {t("Government Services Payment")}
      </h1>

    </div>
  );
}
