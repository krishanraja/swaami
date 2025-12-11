import { useState } from "react";
import { JoinScreen } from "@/screens/JoinScreen";
import { FeedScreen } from "@/screens/FeedScreen";
import { PostScreen } from "@/screens/PostScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { BottomNav } from "@/components/BottomNav";

const Index = () => {
  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'post' | 'profile'>('feed');

  if (!isJoined) {
    return <JoinScreen onComplete={() => setIsJoined(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {activeTab === 'feed' && <FeedScreen />}
      {activeTab === 'post' && <PostScreen />}
      {activeTab === 'profile' && <ProfileScreen onLogout={() => setIsJoined(false)} />}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
