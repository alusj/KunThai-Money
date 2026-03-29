import { Navigate } from "react-router-dom";

import { useAuth } from "../Backend/hooks/useAuth";
import { useOnboardingStatus } from "../Backend/hooks/useOnboardingStatus";
import AuthLoadingScreen from "./AuthLoadingScreen";

export default function PublicRoute({ children }) {
  const { session, user, loading } = useAuth();
  const { status, loading: onboardingLoading } = useOnboardingStatus(user?.id);

  if (loading || (session && onboardingLoading)) {
    return <AuthLoadingScreen />;
  }

  if (session) {
    return <Navigate to={status?.recommendedPath || "/home"} replace />;
  }

  return children;
}
