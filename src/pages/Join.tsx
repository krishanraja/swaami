import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { JoinScreen } from "@/screens/JoinScreen";

export default function Join() {
  const navigate = useNavigate();
  const { authState, refreshProfile } = useAuth();

  // Handle routing based on auth state
  useEffect(() => {
    // Don't redirect while loading
    if (authState === "loading") {
      return;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Join.tsx:11',message:'Join redirect effect',data:{authState,willRedirectTo:authState==='unauthenticated'?'/auth?mode=signup':authState==='ready'?'/app':null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (authState === "unauthenticated") {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Join.tsx:13',message:'Join redirecting to /auth',data:{authState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      navigate("/auth?mode=signup", { replace: true });
    } else if (authState === "ready") {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Join.tsx:15',message:'Join redirecting to /app',data:{authState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      navigate("/app", { replace: true });
    }
  }, [authState, navigate]);

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

  return <JoinScreen onComplete={handleComplete} />;
}
