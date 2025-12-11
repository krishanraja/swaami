import { Button } from "@/components/ui/button";
import type { Task } from "@/types/swaami";

interface NeedCardProps {
  task: Task;
  onHelp: (taskId: string) => void;
}

export function NeedCard({ task, onHelp }: NeedCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-base leading-tight mb-1">
            {task.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {task.description}
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {task.distance}m
            </span>
            <span>·</span>
            <span>{task.timeEstimate}</span>
          </div>
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
