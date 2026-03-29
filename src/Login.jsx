import { useState } from "react";
import supabase from "./Backend/lib/supabaseClient";

export default function Login() {

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      phone,
      password
    });

    if (error) {
      alert(error.message);
    }
  }

  return (
    <div className="center-screen">

      <form className="card" onSubmit={handleLogin}>

        <h2>KunThai Money Login</h2>

        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">
          Login
        </button>

      </form>

    </div>
  );
}
