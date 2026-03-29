import { Routes, Route } from "react-router-dom";

import Welcome from "../components/Welcome";
import Login from "../Backend/auth/Login";
import Register from "../Backend/auth/Register";
import VerifyOTP from "../Backend/auth/VerifyOTP";
import SecuritySetup from "../Backend/auth/SecuritySetup";
import CreateProfile from "../Backend/auth/CreateProfile";
import KYC from "../Backend/auth/KYC";
import WelcomeLoader from "../Backend/auth/WelcomeLoader";
import KuntaiHome from "../components/KuntaiHome/KuntaiHome";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import AuthSessionRoute from "../components/AuthSessionRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Welcome />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/verify" element={<VerifyOTP />} />
      <Route
        path="/security"
        element={
          <AuthSessionRoute stage="security">
            <SecuritySetup />
          </AuthSessionRoute>
        }
      />
      <Route
        path="/security-setup"
        element={
          <AuthSessionRoute stage="security">
            <SecuritySetup />
          </AuthSessionRoute>
        }
      />
      <Route
        path="/create-profile"
        element={
          <AuthSessionRoute stage="profile">
            <CreateProfile />
          </AuthSessionRoute>
        }
      />
      <Route
        path="/kyc"
        element={
          <AuthSessionRoute stage="kyc">
            <KYC />
          </AuthSessionRoute>
        }
      />
      <Route
        path="/welcome-loader"
        element={
          <AuthSessionRoute stage="transitional">
            <WelcomeLoader />
          </AuthSessionRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <KuntaiHome />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
