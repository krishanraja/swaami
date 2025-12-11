import { User, Users, Shield, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tier = "new_neighbor" | "good_neighbor" | "trusted_neighbor" | "community_pillar";

interface TierBadgeProps {
  tier: Tier;
  tasksCompleted?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const tierConfig: Record<Tier, {
  icon: typeof User;
  label: string;
  color: string;
  bg: string;
  minTasks: number;
}> = {
  new_neighbor: {
    icon: User,
    label: "New Neighbor",
    color: "text-muted-foreground",
    bg: "bg-muted",
    minTasks: 0,
  },
  good_neighbor: {
    icon: Users,
    label: "Good Neighbor",
    color: "text-blue-600",
    bg: "bg-blue-100",
    minTasks: 3,
  },
  trusted_neighbor: {
    icon: Shield,
    label: "Trusted Neighbor",
    color: "text-accent",
    bg: "bg-accent/20",
    minTasks: 10,
  },
  community_pillar: {
    icon: Crown,
    label: "Community Pillar",
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    minTasks: 25,
  },
};

export function getTierFromTasks(tasksCompleted: number): Tier {
  if (tasksCompleted >= 25) return "community_pillar";
  if (tasksCompleted >= 10) return "trusted_neighbor";
  if (tasksCompleted >= 3) return "good_neighbor";
  return "new_neighbor";
}

export function TierBadge({ tier, tasksCompleted, size = "md", showLabel = true }: TierBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

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
        config.bg
      )}
    >
      <Icon className={cn(iconSizes[size], config.color)} />
      {showLabel && (
        <span className={config.color}>{config.label}</span>
      )}
      {tasksCompleted !== undefined && (
        <span className="text-muted-foreground ml-1">
          ({tasksCompleted})
        </span>
      )}
    </div>
  );
}
