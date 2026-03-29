// ======================================================
// UrBankRegistration.jsx
// Registration screen for UrBank
// ======================================================

import { useState } from "react";
import supabase from "../../Backend/lib/supabaseClient";

export default function UrBankRegistration({ onRegistered }) {

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const userId = userData.user.id;

    const accountNumber = Math.floor(
      1000000000 + Math.random() * 9000000000
    ).toString();

    const { data, error } = await supabase
      .from("main_accounts")
      .insert([
        {
          user_id: userId,
          account_number: accountNumber,
          balance: 0,
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (!error) {
      onRegistered(data); // send account back to parent
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="bg-white shadow-xl rounded-2xl p-8 w-[350px] text-center">

        <h2 className="text-2xl font-bold mb-4 text-emerald-700">
          Open Your UrBank Account
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          Create your main banking account to start sending and receiving money.
        </p>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

      </div>

    </div>
  );
}