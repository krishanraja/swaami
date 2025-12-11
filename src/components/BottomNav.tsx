import { cn } from "@/lib/utils";
import { Home, PlusCircle, User } from "lucide-react";

interface BottomNavProps {
  activeTab: 'feed' | 'post' | 'profile';
  onTabChange: (tab: 'feed' | 'post' | 'profile') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'feed' as const, label: 'Feed', icon: Home },
    { id: 'post' as const, label: 'Post', icon: PlusCircle },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-2 transition-all duration-200",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-primary"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
