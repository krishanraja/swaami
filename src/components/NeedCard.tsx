import { Button } from "@/components/ui/button";
import { Clock, Star, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NeedCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    distance?: number;
    timeEstimate?: string;
    walkTime?: string;
    urgency?: string;
    category?: string | null;
    created_at?: string;
    owner?: {
      display_name: string | null;
      tasks_completed: number;
      reliability_score: number;
    };
  };
  onHelp: (taskId: string) => void;
}

export function NeedCard({ task, onHelp }: NeedCardProps) {
  const timeAgo = task.created_at
    ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
    : null;

  const isUrgent = task.urgency === "urgent";

  return (
    <div
      className={`bg-card border rounded-xl p-4 transition-all duration-200 hover:shadow-sm ${
        isUrgent ? "border-destructive/30 bg-destructive/5" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header with urgency and time */}
          <div className="flex items-center gap-2 mb-1">
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
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {task.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {task.walkTime || `${task.distance}m`}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.timeEstimate}
            </span>
            {task.category && (
              <>
                <span>·</span>
                <span className="capitalize">{task.category}</span>
              </>
            )}
          </div>

          {/* Owner info with reputation */}
          {task.owner && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                {task.owner.display_name?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-sm text-foreground">
                {task.owner.display_name || "Neighbor"}
              </span>
              {task.owner.tasks_completed > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  {task.owner.reliability_score?.toFixed(1) || "5.0"}
                  <span className="text-muted-foreground/60">
                    ({task.owner.tasks_completed} helped)
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          variant="swaami"
          size="sm"
          onClick={() => onHelp(task.id)}
          className="shrink-0"
        >
          Help
        </Button>
      </div>
    </div>
  );
}
