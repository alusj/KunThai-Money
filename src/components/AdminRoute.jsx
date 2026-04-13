import { Navigate } from "react-router-dom";

import { useAuth } from "../Backend/hooks/useAuth";
import AuthLoadingScreen from "./AuthLoadingScreen";

export default function AdminRoute({ children }) {
  const { session, user, loading, lastEvent } = useAuth();

  if (loading) {
    return <AuthLoadingScreen message="Checking admin access..." />;
  }

  if (!session) {
    const reason = lastEvent === "SIGNED_OUT" ? "signed-out" : "session-expired";
    return <Navigate to={`/login?reason=${reason}`} replace />;
  }

  const isAdmin = user?.app_metadata?.role === "admin";

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
