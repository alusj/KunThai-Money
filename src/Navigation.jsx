import { useState } from "react";
import KuntaiHome from "./components/KuntaiHome/KuntaiHome";

export default function Navigation() {

  const [screen, setScreen] = useState("home");

  return (

    <div className="app-container">

      {screen === "home" && (
        <KuntaiHome setScreen={setScreen} />
      )}

    </div>

  );
}