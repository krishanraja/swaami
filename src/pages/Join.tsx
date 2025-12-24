import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { JoinScreen } from "@/screens/JoinScreen";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function Join() {
  const navigate = useNavigate();
  const { authState, refreshProfile } = useAuth();

  // Consolidated redirect logic
  useAuthRedirect({
    redirects: {
      unauthenticated: "/auth?mode=signup",
      ready: "/app",
    },
  });

  const handleComplete = async () => {
    await refreshProfile();
    navigate("/app", { replace: true });
  };

  // Show loading while determining state
  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  // Only render JoinScreen if user needs onboarding
  if (authState !== "needs_onboarding") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground animate-pulse">Redirecting...</span>
        </div>
      </div>
    );
  }

  return <JoinScreen onComplete={handleComplete} refetchProfile={refreshProfile} />;
}
