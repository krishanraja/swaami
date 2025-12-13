import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { FeedScreen } from "@/screens/FeedScreen";
import { PostScreen } from "@/screens/PostScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ChatsListScreen } from "@/screens/ChatsListScreen";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

type AppState = "loading" | "unauthenticated" | "needs_onboarding" | "ready";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "post" | "chats" | "profile">("feed");
  const [hasAnimated, setHasAnimated] = useState(false);

  // Check if this is a fresh user who has never completed onboarding
  // vs a user with a partially complete profile (edge case)
  const hasNeverOnboarded = useMemo(() => {
    if (!profile) return false;
    // If they have no phone, they never completed phone verification step
    // This is the key gate in the Join flow
    return !profile.phone;
  }, [profile]);

  // Derive app state from auth/profile
  const appState = useMemo((): AppState => {
    if (authLoading || profileLoading) return "loading";
    if (!user) return "unauthenticated";
    
    // Only redirect to /join if they've never completed onboarding at all
    // (no phone = never finished the mandatory phone verification step)
    if (hasNeverOnboarded) return "needs_onboarding";
    
    // Let them through even if profile is incomplete
    // ProfileScreen will show alert for missing fields
    return "ready";
  }, [authLoading, profileLoading, user, hasNeverOnboarded]);

  // Handle redirects based on app state
  useEffect(() => {
    if (appState === "unauthenticated") {
      navigate("/auth");
    } else if (appState === "needs_onboarding") {
      navigate("/join");
    } else if (appState === "ready" && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [appState, navigate, hasAnimated]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Keep showing loading state during redirects
  if (appState !== "ready") {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <div 
        className={`flex-1 overflow-hidden transition-opacity duration-300 ${
          hasAnimated ? 'animate-in fade-in duration-300' : ''
        }`}
      >
        {renderScreen()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
