import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { NeedCard } from "@/components/NeedCard";
import { AppHeader } from "@/components/AppHeader";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { RefreshCw, PlusCircle, FlaskConical, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface FeedScreenProps {
  onNavigateToPost?: () => void;
}

export function FeedScreen({ onNavigateToPost }: FeedScreenProps) {
  const navigate = useNavigate();
  const { tasks, loading, fetchTasks, helpWithTask } = useTasks();
  const { profile } = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDemoTasks, setShowDemoTasks] = useState(true);
  const [maxDistance, setMaxDistance] = useState(2000); // Default 2km max filter

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
  
  const formatDistance = (meters: number) => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
  };
  
  // Apply filters: category, demo toggle, and distance
  const filteredTasks = tasks
    .filter((t) => !selectedCategory || t.category === selectedCategory)
    .filter((t) => showDemoTasks || !t.is_demo)
    .filter((t) => t.distance === null || t.distance === undefined || t.distance <= maxDistance);

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col">
      <AppHeader
        actions={
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
        }
      />

      {/* Filters - Combined compact layout */}
      <div className="sticky top-[73px] bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 py-2.5 max-w-lg mx-auto space-y-2.5">
          {/* Top row: Categories + Demo toggle */}
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
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
                    className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${
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
            {/* Demo toggle - compact */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-border flex-shrink-0">
              <FlaskConical className="w-3.5 h-3.5 text-muted-foreground" />
              <Switch
                checked={showDemoTasks}
                onCheckedChange={setShowDemoTasks}
                className="data-[state=checked]:bg-muted scale-90"
              />
            </div>
          </div>
          
          {/* Bottom row: Distance slider with count */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[maxDistance]}
              onValueChange={([v]) => setMaxDistance(v)}
              min={100}
              max={5000}
              step={100}
              className="flex-1"
            />
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[2.5rem] text-right">
              {formatDistance(maxDistance)}
            </span>
            <span className="text-xs text-muted-foreground/60 pl-2 border-l border-border">
              {filteredTasks.length} nearby
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-3 pb-24 max-w-lg mx-auto w-full">

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
                  owner: task.owner,
                }}
                onHelp={handleHelp}
                userSkills={profile?.skills || []}
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
