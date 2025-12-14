import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Star, Flame, Sparkles, Users, Shield, CheckCircle, FlaskConical, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { calculateWalkTime } from "@/lib/walkTime";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { PersonDetailsDrawer } from "@/components/PersonDetailsDrawer";
import { toast } from "sonner";

interface NeedCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status?: string;
    distance?: number;
    timeEstimate?: string;
    time_estimate?: string;
    walkTime?: string;
    urgency?: string;
    category?: string | null;
    created_at?: string;
    // Enhanced fields
    availability_time?: string | null;
    physical_level?: string | null;
    people_needed?: number | null;
    is_demo?: boolean;
    owner?: {
      display_name: string | null;
      tasks_completed?: number;
      reliability_score?: number;
      trust_tier?: string;
      is_demo?: boolean;
      photo_url?: string | null;
      skills?: string[];
      member_since?: string;
      neighbourhood?: string | null;
    };
    owner_trust_tier?: string | null;
  };
  onHelp?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
  onView?: (taskId: string) => void;
  userSkills?: string[];
  isOwner?: boolean;
}

export function NeedCard({ task, onHelp, onCancel, onView, userSkills = [], isOwner = false }: NeedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPersonDrawerOpen, setIsPersonDrawerOpen] = useState(false);
  
  const timeAgo = task.created_at
    ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
    : null;

  const isUrgent = task.urgency === "urgent";
  const isDemo = task.is_demo || task.owner?.is_demo;

  const handleHelp = () => {
    if (isDemo) {
      toast.info("This is a sample request to show how Swaami works!", {
        description: "Post your own request to get real help from your neighbours.",
      });
      return;
    }
    onHelp?.(task.id);
  };
  
  // Calculate walk time from distance
  const walkTimeDisplay = task.walkTime || calculateWalkTime(task.distance);
  
  // Check if task matches user's skills
  const isSkillMatch = task.category && userSkills.some(
    skill => skill.toLowerCase() === task.category?.toLowerCase()
  );

  // Get time estimate from either field name
  const timeEstimate = task.timeEstimate || task.time_estimate;

  // Physical level display
  const physicalLevelLabels: Record<string, { label: string; emoji: string }> = {
    light: { label: "Light", emoji: "🚶" },
    moderate: { label: "Moderate effort", emoji: "💪" },
    heavy: { label: "Heavy lifting", emoji: "🏋️" },
  };

  // Trust tier display
  const trustTierLabels: Record<string, { label: string; color: string }> = {
    tier_0: { label: "New", color: "text-muted-foreground" },
    tier_1: { label: "Verified", color: "text-accent" },
    tier_2: { label: "Trusted", color: "text-accent" },
  };

  const ownerTrustTier = task.owner?.trust_tier || task.owner_trust_tier || "tier_0";
  const trustInfo = trustTierLabels[ownerTrustTier] || trustTierLabels.tier_0;
  const isVerified = ownerTrustTier !== "tier_0";

  // Build text for read aloud
  const readAloudText = `${task.title}. ${task.description || ""}. ${
    isUrgent ? "This is urgent." : ""
  } ${task.availability_time ? `Timing: ${task.availability_time}.` : ""} Estimated time: ${timeEstimate || "unknown"}. Distance: ${walkTimeDisplay}.`;

  return (
    <div
      className={`bg-card border rounded-xl p-4 transition-all duration-200 hover:shadow-sm ${
        isUrgent ? "border-destructive/30 bg-destructive/5" : "border-border"
      } ${isOwner ? "ring-2 ring-primary/20" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header with urgency, skill match, and time */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isDemo && (
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <FlaskConical className="w-3 h-3" />
                Sample
              </span>
            )}
            {isOwner && (
              <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Your Request
              </span>
            )}
            {!isOwner && !isDemo && isSkillMatch && (
              <span className="flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                Perfect for you
              </span>
            )}
            {isUrgent && (
              <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                <Flame className="w-3 h-3" />
                Urgent
              </span>
            )}
            {timeAgo && (
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            )}
          </div>

          <h3 className="font-semibold text-foreground text-base leading-tight mb-1">
            {task.title}
          </h3>
          <div className="mb-3">
            <p className={`text-muted-foreground text-sm ${!isExpanded ? 'line-clamp-2' : ''}`}>
              {task.description}
            </p>
            {task.description && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 mt-1 transition-colors"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Show less details" : "Read more details"}
              >
                {isExpanded ? (
                  <>
                    Show less <ChevronUp className="w-3 h-3" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDown className="w-3 h-3" aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Availability time - prominent if present */}
          {task.availability_time && task.availability_time !== "Flexible" && (
            <div className="flex items-center gap-1 text-sm font-medium text-accent mb-2">
              <Clock className="w-3.5 h-3.5" />
              {task.availability_time}
            </div>
          )}

          {/* Meta info with distance prominent */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            {task.distance != null && (
              <span className="flex items-center gap-1.5 font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                <MapPin className="w-3.5 h-3.5" />
                {task.distance >= 1000 
                  ? `${(task.distance / 1000).toFixed(1)} km` 
                  : `${Math.round(task.distance)} m`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeEstimate}
            </span>
            {task.category && (
              <>
                <span>·</span>
                <span className="capitalize">{task.category}</span>
              </>
            )}
          </div>

          {/* Enhanced info row - physical level and people needed */}
          {((task.physical_level && task.physical_level !== "light") || (task.people_needed && task.people_needed > 1)) && (
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              {task.physical_level && task.physical_level !== "light" && (
                <span className="flex items-center gap-1">
                  {physicalLevelLabels[task.physical_level]?.emoji}
                  {physicalLevelLabels[task.physical_level]?.label}
                </span>
              )}
              {task.people_needed && task.people_needed > 1 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {task.people_needed} people needed
                </span>
              )}
            </div>
          )}

          {/* Owner info with reputation and trust badges - clickable for details */}
          {task.owner && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPersonDrawerOpen(true);
              }}
              className="flex items-center gap-2 mt-3 pt-3 border-t border-border w-full text-left hover:bg-muted/50 -mx-1 px-1 rounded-lg transition-colors cursor-pointer group"
              aria-label={`View ${task.owner.display_name || "neighbour"}'s profile`}
            >
              {task.owner.photo_url ? (
                <img 
                  src={task.owner.photo_url} 
                  alt={task.owner.display_name || "User"} 
                  className="w-6 h-6 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  {task.owner.display_name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {task.owner.display_name || "Neighbor"}
              </span>
              {/* Trust badge */}
              {isVerified && (
                <span className={`flex items-center gap-1 text-xs ${trustInfo.color}`}>
                  {ownerTrustTier === "tier_2" ? (
                    <Shield className="w-3 h-3" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  {trustInfo.label}
                </span>
              )}
              {(task.owner.tasks_completed ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  {task.owner.reliability_score?.toFixed(1) || "5.0"}
                  <span className="text-muted-foreground/60">
                    ({task.owner.tasks_completed} helped)
                  </span>
                </span>
              )}
              {/* Tap indicator */}
              <span className="ml-auto text-xs text-muted-foreground/50 group-hover:text-primary/50 transition-colors">
                Tap for more →
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {isOwner ? (
            <>
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(task.id)}
                >
                  View
                </Button>
              )}
              {onCancel && task.status === "open" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onCancel(task.id)}
                >
                  Cancel
                </Button>
              )}
            </>
          ) : (
            onHelp && (
              <Button
                variant={isDemo ? "outline" : "swaami"}
                size="sm"
                onClick={handleHelp}
              >
                {isDemo ? "Sample" : "Help"}
              </Button>
            )
          )}
          <ReadAloudButton text={readAloudText} />
        </div>
      </div>

      {/* Person Details Drawer */}
      <PersonDetailsDrawer
        open={isPersonDrawerOpen}
        onOpenChange={setIsPersonDrawerOpen}
        owner={task.owner || null}
        taskTitle={task.title}
        taskCategory={task.category || undefined}
        onHelp={() => onHelp?.(task.id)}
        isDemo={isDemo}
      />
    </div>
  );
}
