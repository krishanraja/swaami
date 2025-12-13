import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { JoinScreen } from "@/screens/JoinScreen";

export default function Join() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [readyToShow, setReadyToShow] = useState(false);

  useEffect(() => {
    // Wait for both auth and profile to finish loading
    if (authLoading || profileLoading) return;
    
    // No user = send to signup
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }
    
    // Check email verification (OAuth users are pre-verified)
    const isOAuth = user.app_metadata?.provider !== 'email';
    if (!isOAuth && !user.email_confirmed_at) {
      navigate("/auth?mode=login");
      return;
    }
    
    // Check if profile is already complete - skip onboarding entirely
    const isComplete = profile?.city && 
                       profile?.neighbourhood && 
                       profile?.phone && 
                       profile?.skills?.length > 0;
    
    if (isComplete) {
      navigate("/app", { replace: true });
      return;
    }
    
    // User is authenticated, verified, but profile incomplete - show JoinScreen
    setReadyToShow(true);
  }, [user, authLoading, profile, profileLoading, navigate]);

  // Show loading state until we determine where to route
  if (!readyToShow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  return <JoinScreen onComplete={() => navigate("/app")} />;
}
