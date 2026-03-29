import MoveMoney from "./MoveMoney";

export default function InsuranceAccount() {
  return (
    <div
      className="
        bg-white
        border
        border-gray-200
        border-l-4
        border-l-emerald-600
        rounded-xl
        p-4

        flex
        items-center
        justify-between

        transition-all
        duration-300
        hover:shadow-lg
        hover:-translate-y-1
        hover:border-blue-400
      "
    >
      {/* LEFT SIDE: Account Info */}
      <div>
        <h3 className="font-semibold text-gray-800">
          Insurance Account
        </h3>
        <p className="text-sm text-gray-500">
          Balance: $2,450
        </p>
      </div>

      {/* RIGHT SIDE: Action */}
      <MoveMoney />
    </div>
  );
}
