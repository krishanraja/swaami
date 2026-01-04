import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NeedCard } from "@/components/NeedCard";
import { AppHeader } from "@/components/AppHeader";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { RefreshCw, PlusCircle, FlaskConical, MapPin, ArrowUpDown, AlertCircle, Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { Input } from "@/components/ui/input";

type SortOption = "nearest" | "recent" | "urgent";

interface FeedScreenProps {
  onNavigateToPost?: () => void;
}

export function FeedScreen({ onNavigateToPost }: FeedScreenProps) {
  const navigate = useNavigate();
  const { tasks, loading, error, fetchTasks, helpWithTask, helping } = useTasks();
  const { profile } = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDemoTasks, setShowDemoTasks] = useState(true);
  const [maxDistance, setMaxDistance] = useState(2000);
  const [sortBy, setSortBy] = useState<SortOption>("nearest");
  const [timeoutError, setTimeoutError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Add timeout for loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading) {
          setTimeoutError(true);
        }
      }, 10000); // 10 second timeout

      return () => {
        clearTimeout(timeout);
        setTimeoutError(false);
      };
    }
  }, [loading]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, [fetchTasks]);

  const handleHelp = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Disable button if already helping
    if (helping.has(taskId)) return;

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
  
  // Handle voice search result
  const handleVoiceSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearch(true);
  };

  // Apply filters and sorting
  const filteredTasks = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    const filtered = tasks
      .filter((t) => !selectedCategory || t.category === selectedCategory)
      .filter((t) => showDemoTasks || !t.is_demo)
      .filter((t) => t.distance === null || t.distance === undefined || t.distance <= maxDistance)
      // Text search filter
      .filter((t) => {
        if (!searchLower) return true;
        return (
          t.title?.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower) ||
          t.category?.toLowerCase().includes(searchLower)
        );
      });
    
    // Sort based on selected option
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "nearest": {
          // Null distances go to end
          if (a.distance === null || a.distance === undefined) return 1;
          if (b.distance === null || b.distance === undefined) return -1;
          return a.distance - b.distance;
        }
        case "recent": {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Most recent first
        }
        case "urgent": {
          // Urgent first, then by distance
          const urgentA = a.urgency === "urgent" ? 0 : 1;
          const urgentB = b.urgency === "urgent" ? 0 : 1;
          if (urgentA !== urgentB) return urgentA - urgentB;
          // Secondary sort by distance
          if (a.distance === null || a.distance === undefined) return 1;
          if (b.distance === null || b.distance === undefined) return -1;
          return a.distance - b.distance;
        }
        default:
          return 0;
      }
    });
  }, [tasks, selectedCategory, showDemoTasks, maxDistance, sortBy]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col">
      <AppHeader
        actions={
          <div className="flex items-center gap-1">
            <VoiceSearchButton onSearchResult={handleVoiceSearch} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="h-9 w-9"
            >
              <Search className="h-4 w-4" />
            </Button>
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
          </div>
        }
      />

      {/* Search bar - collapsible */}
      {showSearch && (
        <div className="px-4 py-2 bg-background border-b border-border animate-fade-in">
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filters - Combined compact layout */}
      <div className="sticky top-[73px] bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 py-2.5 max-w-lg mx-auto space-y-2.5">
          {/* Top row: Categories + Demo toggle */}
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[36px] ${
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
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors min-h-[36px] ${
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
          
          {/* Bottom row: Distance slider + Sort */}
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
            <div className="pl-2 border-l border-border flex-shrink-0">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="h-8 min-w-[110px] text-sm border-0 bg-muted/50 gap-1.5 px-2.5">
                  <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nearest">Nearest</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-muted-foreground/60 text-center">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} within {formatDistance(maxDistance)}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-3 pb-24 max-w-lg mx-auto w-full">

        {(error || timeoutError) ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Failed to load tasks
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {timeoutError ? 'Request timed out. Please try again.' : (error?.message || 'Something went wrong.')}
            </p>
            <Button onClick={fetchTasks} variant="swaami">
              Try Again
            </Button>
          </div>
        ) : loading ? (
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
