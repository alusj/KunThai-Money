// ======================================================
// UrBankOnboarding.jsx
// Multi-step onboarding with fake OTP
// ======================================================

import { useState } from "react";
import supabase from "../../Backend/lib/supabaseClient";

export default function UrBankOnboarding({ onComplete }) {

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  // STEP 1 → Generate Fake OTP
  const handleSendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("FAKE OTP:", otp);
    setGeneratedOtp(otp);
    setStep(2);
  };

  // STEP 2 → Verify OTP
  const handleVerifyOtp = () => {
    if (enteredOtp === generatedOtp) {
      setStep(3);
    } else {
      alert("Invalid OTP");
    }
  };

  // STEP 3 → Save Profile + Create Account
  const handleComplete = async () => {
    if (pin.length !== 4) {
      alert("PIN must be 4 digits");
      return;
    }

    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;

    // Hash PIN (simple dev hash for now)
    const pinHash = btoa(pin);

    // Insert UrBank profile
    const { error: profileError } = await supabase
      .from("urbank_profiles")
      .insert([
        {
          user_id: userId,
          phone_number: phone,
          phone_verified: true,
          transaction_pin_hash: pinHash,
          kyc_status: "verified"
        }
      ]);

    if (profileError) {
      alert("Profile creation failed");
      setLoading(false);
      return;
    }

    // Generate account number
    const accountNumber = Math.floor(
      1000000000 + Math.random() * 9000000000
    ).toString();

    // Create main account
    const { data: accountData } = await supabase
      .from("main_accounts")
      .insert([
        {
          user_id: userId,
          account_number: accountNumber,
          balance: 0
        }
      ])
      .select()
      .single();

    setLoading(false);

    onComplete(accountData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="bg-white p-8 rounded-2xl shadow-xl w-[350px]">

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold mb-4">Verify Phone</h2>
            <input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />
            <button
              onClick={handleSendOtp}
              className="w-full bg-emerald-600 text-white py-2 rounded"
            >
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold mb-4">Enter OTP</h2>
            <input
              type="text"
              placeholder="Enter OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-emerald-600 text-white py-2 rounded"
            >
              Verify OTP
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold mb-4">Set 4-digit PIN</h2>
            <input
              type="password"
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2 rounded"
            >
              {loading ? "Creating..." : "Complete Registration"}
            </button>
          </>
        )}

      </div>
    </div>
  );
}