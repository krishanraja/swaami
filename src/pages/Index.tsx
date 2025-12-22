import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { FeedScreen } from "@/screens/FeedScreen";
import { PostScreen } from "@/screens/PostScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ChatsListScreen } from "@/screens/ChatsListScreen";
import { useAuthContext } from "@/contexts/AuthContext";

/**
 * Main app index page
 * Note: Auth/onboarding redirects are handled by AppRoute wrapper in App.tsx
 * This component only renders when user is fully authenticated and onboarded
 */
const Index = () => {
  const { signOut } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "post" | "chats" | "profile">("feed");
  const [hasAnimated, setHasAnimated] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    if (!hasAnimated) {
      setHasAnimated(true);
    }
  }, [hasAnimated]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

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
