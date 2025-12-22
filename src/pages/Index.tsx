import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { FeedScreen } from "@/screens/FeedScreen";
import { PostScreen } from "@/screens/PostScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ChatsListScreen } from "@/screens/ChatsListScreen";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { authState, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "post" | "chats" | "profile">("feed");

  // Single redirect effect based on centralized auth state
  useEffect(() => {
    if (authState === "unauthenticated") {
      navigate("/auth", { replace: true });
    } else if (authState === "needs_onboarding") {
      navigate("/join", { replace: true });
    }
  }, [authState, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  // Show loading or redirect states
  if (authState !== "ready") {
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
      <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
        {renderScreen()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
