import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { JoinScreen } from "@/screens/JoinScreen";

export default function Join() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // No user = send to signup
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }
    
    // Check email verification once (OAuth users are pre-verified)
    const isOAuth = user.app_metadata?.provider !== 'email';
    if (!isOAuth && !user.email_confirmed_at) {
      navigate("/auth?mode=login");
      return;
    }
    
    // User is authenticated and verified - ready to show JoinScreen
    setEmailVerified(true);
  }, [user, authLoading, navigate]);

  // Show loading state until we confirm email verification
  if (authLoading || emailVerified === null) {
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
