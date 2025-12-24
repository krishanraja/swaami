import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { FeedScreen } from "@/screens/FeedScreen";
import { PostScreen } from "@/screens/PostScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ChatsListScreen } from "@/screens/ChatsListScreen";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { authState, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"feed" | "post" | "chats" | "profile">("feed");

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Index.tsx:11',message:'Index component render',data:{authState,pathname:location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, [authState, location.pathname]);
  // #endregion

  // Single redirect effect based on centralized auth state
  useEffect(() => {
    // Don't redirect while loading - wait for auth state to resolve
    if (authState === "loading") {
      return;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Index.tsx:17',message:'Redirect effect triggered',data:{authState,willRedirectTo:authState==='unauthenticated'?'/auth':authState==='needs_onboarding'?'/join':null,currentPath:location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Prevent redirect loops - only redirect if we're actually on /app
    if (location.pathname !== "/app") {
      return;
    }
    
    if (authState === "unauthenticated") {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Index.tsx:18',message:'Redirecting to /auth',data:{authState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      navigate("/auth", { replace: true });
    } else if (authState === "needs_onboarding") {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Index.tsx:20',message:'Redirecting to /join',data:{authState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      navigate("/join", { replace: true });
    }
  }, [authState, navigate, location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  // Show loading or redirect states
  if (authState !== "ready") {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Index.tsx:30',message:'Rendering loading spinner',data:{authState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return (
      <div className="h-[100dvh] w-full bg-background flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" style={{ borderColor: 'hsl(var(--foreground) / 0.2)', borderTopColor: 'hsl(var(--foreground))' }} />
          <span className="text-sm text-muted-foreground animate-pulse">Loading your neighbourhood...</span>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "feed":
        return <FeedScreen onNavigateToPost={() => setActiveTab("post")} />;
      case "post":
        return <PostScreen />;
      case "chats":
        return <ChatsListScreen />;
      case "profile":
        return <ProfileScreen onLogout={handleLogout} />;
      default:
        return <FeedScreen />;
    }
  };

  // #region agent log
  useEffect(() => {
    if (authState === "ready") {
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Index.tsx:56',message:'Rendering main app content',data:{authState,activeTab},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
  }, [authState, activeTab]);
  // #endregion

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
        {renderScreen()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
