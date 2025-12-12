import { Flame } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function StreakDisplay({ size = "sm", showLabel = false, className }: StreakDisplayProps) {
  const { streakDays, isLoading } = useGamification();

  if (isLoading) return null;

  // Don't show if no streak
  if (streakDays === 0) return null;

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div 
      className={cn(
        "flex items-center gap-1 text-orange-500",
        className
      )}
    >
      <Flame className={cn(iconSize, "fill-orange-500")} />
      <span className={cn("font-semibold", textSize)}>{streakDays}</span>
      {showLabel && (
        <span className={cn("text-muted-foreground", textSize)}>
          day streak
        </span>
      )}
    </div>
  );
}
