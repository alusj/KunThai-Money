import MoveMoney from "./MoveMoney";

export default function TransportAccount() {
  return (
    <div
      className="
        bg-white
        border
        border-gray-200
        border-l-4
        border-l-blue-500
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
          Transport Account
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
