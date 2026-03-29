import { Navigate } from "react-router-dom";

import { useAuth } from "../Backend/hooks/useAuth";
import AuthLoadingScreen from "./AuthLoadingScreen";

export default function AuthSessionRoute({ children }) {
  const { session, loading, lastEvent } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    const reason = lastEvent === "SIGNED_OUT" ? "signed-out" : "session-expired";
    return <Navigate to={`/login?reason=${reason}`} replace />;
  }

  return children;
}
