import { Flame, Zap, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streakDays: number;
  size?: "sm" | "md" | "lg";
}

export function StreakBadge({ streakDays, size = "md" }: StreakBadgeProps) {
  if (streakDays < 3) return null;

  const getStreakInfo = () => {
    if (streakDays >= 30) {
      return {
        icon: Trophy,
        label: `${streakDays} day streak!`,
        color: "text-yellow-500",
        bg: "bg-yellow-500/20",
      };
    }
    if (streakDays >= 14) {
      return {
        icon: Star,
        label: `${streakDays} day streak`,
        color: "text-purple-500",
        bg: "bg-purple-500/20",
      };
    }
    if (streakDays >= 7) {
      return {
        icon: Zap,
        label: `${streakDays} day streak`,
        color: "text-blue-500",
        bg: "bg-blue-500/20",
      };
    }
    return {
      icon: Flame,
      label: `${streakDays} day streak`,
      color: "text-orange-500",
      bg: "bg-orange-500/20",
    };
  };

  const { icon: Icon, label, color, bg } = getStreakInfo();

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClasses[size],
        bg
      )}
    >
      <Icon className={cn(iconSizes[size], color, "animate-pulse")} />
      <span className={color}>{label}</span>
    </div>
  );
}
