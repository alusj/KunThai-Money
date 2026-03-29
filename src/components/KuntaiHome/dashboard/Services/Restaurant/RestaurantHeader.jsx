import BackTab from "./BackTab";

export default function RestaurantHeader({ onBack }) {
  return (
    <div className="relative flex items-center justify-center h-14 border-b">

      <div className="absolute left-4">
        <BackTab onBack={onBack} />
      </div>

      <h1 className="text-lg font-semibold">
        Restaurant Payment
      </h1>

    </div>
  );
}
