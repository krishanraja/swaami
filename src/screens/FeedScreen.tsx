import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { NeedCard } from "@/components/NeedCard";
import { AppHeader } from "@/components/AppHeader";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { RefreshCw, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedScreenProps {
  onNavigateToPost?: () => void;
}

export function FeedScreen({ onNavigateToPost }: FeedScreenProps) {
  const navigate = useNavigate();
  const { tasks, loading, fetchTasks, helpWithTask } = useTasks();
  const { profile } = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, [fetchTasks]);

  const handleHelp = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const { data, error } = await helpWithTask(taskId);
    if (error) {
      toast.error("Couldn't help with this task", {
        description: error.message,
      });
    } else if (data) {
      toast.success(`You're helping with: ${task.title}`, {
        description: "Opening chat to coordinate...",
      });
      navigate(`/chat/${data.id}`);
    }
  };

  const categories = ["groceries", "tech", "transport", "pets", "handyman"];
  const filteredTasks = selectedCategory
    ? tasks.filter((t) => t.category === selectedCategory)
    : tasks;

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col">
      <AppHeader
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 w-9"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
              <span>{profile?.radius || 500}m</span>
            </div>
          </div>
        }
      />

      {/* Category Filter */}
      <div className="sticky top-[73px] bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 py-3 max-w-lg mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Nearby needs
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {filteredTasks.length > 0
            ? `${filteredTasks.length} people need help nearby`
            : "Help requests from your neighbours"}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-3 stagger-children">
            {filteredTasks.map((task) => (
              <NeedCard
                key={task.id}
                task={{
                  ...task,
                  timeEstimate: task.time_estimate || "~15 mins",
                  walkTime: "Nearby",
                  owner: task.owner,
                }}
                onHelp={handleHelp}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏘️</div>
            <h3 className="font-semibold text-foreground mb-2">
              No requests yet
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Be the first to ask your neighbourhood for help!
            </p>
            <Button
              variant="swaami"
              size="lg"
              onClick={onNavigateToPost}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Post a Request
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
