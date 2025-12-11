import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { FeedScreen } from "@/screens/FeedScreen";
import { PostScreen } from "@/screens/PostScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ChatsListScreen } from "@/screens/ChatsListScreen";
import { JoinScreen } from "@/screens/JoinScreen";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "post" | "chats" | "profile">("feed");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("swaami_onboarded");
    if (onboarded) {
      setHasCompletedOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("swaami_onboarded", "true");
    setHasCompletedOnboarding(true);
  };

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem("swaami_onboarded");
    setHasCompletedOnboarding(false);
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!hasCompletedOnboarding) {
    return <JoinScreen onComplete={handleOnboardingComplete} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "feed":
        return <FeedScreen />;
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
    <div className="min-h-screen bg-background">
      {renderScreen()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
