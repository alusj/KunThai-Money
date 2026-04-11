import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AppearanceProvider } from "./components/AppearanceProvider.jsx";
import { AuthProvider } from "./components/AuthProvider.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppearanceProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppearanceProvider>
    </BrowserRouter>
  </React.StrictMode>
);
