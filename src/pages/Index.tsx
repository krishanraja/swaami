import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { FeedScreen } from "@/screens/FeedScreen";
import { PostScreen } from "@/screens/PostScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ChatsListScreen } from "@/screens/ChatsListScreen";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "post" | "chats" | "profile">("feed");

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirect to onboarding if profile incomplete
  useEffect(() => {
    if (!authLoading && !profileLoading && user && profile) {
      const isProfileComplete = profile.city && profile.neighbourhood && profile.phone && profile.skills?.length > 0;
      if (!isProfileComplete) {
        navigate("/join");
      }
    }
  }, [user, profile, authLoading, profileLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check profile completeness - if incomplete, we'll redirect via useEffect
  const isProfileComplete = profile?.city && profile?.neighbourhood && profile?.phone && profile?.skills?.length > 0;
  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
    <div className="min-h-screen bg-background">
      {renderScreen()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
