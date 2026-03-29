import { Navigate } from "react-router-dom";

import { useAuth } from "../Backend/hooks/useAuth";
import { useOnboardingStatus } from "../Backend/hooks/useOnboardingStatus";
import AuthLoadingScreen from "./AuthLoadingScreen";

export default function ProtectedRoute({ children }) {
  const { session, user, loading, lastEvent } = useAuth();
  const { status, loading: onboardingLoading, error } = useOnboardingStatus(user?.id);

  if (loading || (session && onboardingLoading)) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    const reason = lastEvent === "SIGNED_OUT" ? "signed-out" : "session-expired";
    return <Navigate to={`/login?reason=${reason}`} replace />;
  }

  if (error) {
    return children;
  }

  if (!status) {
    return <AuthLoadingScreen message="Loading your account..." />;
  }

  if (status.recommendedPath !== "/home") {
    return <Navigate to={status.recommendedPath} replace />;
  }

  return children;
}
