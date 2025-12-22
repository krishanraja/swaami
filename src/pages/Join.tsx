import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { JoinScreen } from "@/screens/JoinScreen";

/**
 * Join/Onboarding page
 * Note: Auth redirects are handled by AuthRoute wrapper in App.tsx
 * This component only renders when user is authenticated but not yet onboarded
 */
export default function Join() {
  const navigate = useNavigate();
  const { authState, refreshProfile, isLoading } = useAuthContext();
  const [hasError, setHasError] = useState(false);

  // Handle redirect if already onboarded
  useEffect(() => {
    if (isLoading) return;
    
    // Already onboarded - redirect to app
    if (authState.isOnboarded) {
      navigate("/app", { replace: true });
    }
  }, [authState.isOnboarded, isLoading, navigate]);

  // Show loading state while auth is loading or if already onboarded (redirecting)
  if (isLoading || authState.isOnboarded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

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
              Something went wrong while loading your profile. Please try again.
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                await refreshProfile();
                setHasError(false);
              } catch (err) {
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

  return (
    <JoinScreen 
      onComplete={() => navigate("/app")} 
      refetchProfile={async () => {
        try {
          await refreshProfile();
        } catch {
          setHasError(true);
        }
      }}
    />
  );
}
