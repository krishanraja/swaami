import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { JoinScreen } from "@/screens/JoinScreen";

export default function Join() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refetch } = useProfile();
  const { isOnboarded } = useOnboardingStatus(profile);
  const [readyToShow, setReadyToShow] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Wait for both auth and profile to finish loading
    if (authLoading || profileLoading) return;
    
    // Check for profile fetch errors
    if (profileError) {
      setHasError(true);
      return;
    }
    
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
    if (isOnboarded) {
      navigate("/app", { replace: true });
      return;
    }
    
    // User is authenticated, verified, but profile incomplete - show JoinScreen
    setReadyToShow(true);
    setHasError(false);
  }, [user, authLoading, profile, profileLoading, profileError, isOnboarded, navigate]);

  // Show error state if profile fetch failed
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Failed to load profile
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {(() => {
                if (!profileError) return "Something went wrong while loading your profile. Please try again.";
                
                // Extract message, handling both Error and Supabase error structures
                const message = profileError.message || 
                               (profileError as any)?.details || 
                               String(profileError);
                
                // Don't show "[object Object]"
                if (message === "[object Object]") {
                  return "Something went wrong while loading your profile. Please try again.";
                }
                
                return message;
              })()}
            </p>
          </div>
          <button
            onClick={async () => {
              // Try to refetch profile instead of full reload
              try {
                await refetch();
                // If refetch succeeds, hasError will be cleared by useEffect
              } catch (err) {
                // If refetch fails, reload page as fallback
                console.error("Refetch failed, reloading:", err);
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
