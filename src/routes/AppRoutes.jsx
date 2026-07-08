import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Welcome from "../components/Welcome";
import Login from "../Backend/auth/Login";
import RegisterAgreement from "../Backend/auth/RegisterAgreement";
import Register from "../Backend/auth/Register";
import ForgotPassword from "../Backend/auth/ForgotPassword";
import ResetPassword from "../Backend/auth/ResetPassword";
import VerifyOTP from "../Backend/auth/VerifyOTP";
import SecuritySetup from "../Backend/auth/SecuritySetup";
import CreateProfile from "../Backend/auth/CreateProfile";
import KYC from "../Backend/auth/KYC";
import WelcomeLoader from "../Backend/auth/WelcomeLoader";
import PublicLegalScreen from "../components/legal/PublicLegalScreen";
import KuntaiHome from "../components/KuntaiHome/KuntaiHome";
import CardTopupCallback from "../components/KuntaiHome/wallet/CardTopupCallback";
import AdminRoute from "../components/AdminRoute";
import AdminDashboard from "../components/Admin/AdminDashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import AuthSessionRoute from "../components/AuthSessionRoute";

export default function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
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
            <RegisterAgreement />
          </PublicRoute>
        }
      />
      <Route
        path="/register/details"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route path="/verify" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/legal/:policyKey" element={<PublicLegalScreen />} />
      <Route
        path="/security"
        element={
          <AuthSessionRoute>
            <SecuritySetup />
          </AuthSessionRoute>
        }
      />
      <Route
        path="/security-setup"
        element={
          <AuthSessionRoute>
            <SecuritySetup />
          </AuthSessionRoute>
        }
      />
      <Route
        path="/create-profile"
        element={
          <AuthSessionRoute>
            <CreateProfile />
          </AuthSessionRoute>
        }
      />
      <Route
        path="/kyc"
        element={
          <AuthSessionRoute>
            <KYC />
          </AuthSessionRoute>
        }
      />
      <Route
        path="/welcome-loader"
        element={
          <AuthSessionRoute>
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
      <Route
        path="/wallet/topup/callback"
        element={
          <ProtectedRoute>
            <CardTopupCallback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      </Routes>
    </AnimatePresence>
  );
}
