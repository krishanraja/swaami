import { useGamification } from "@/hooks/useGamification";
import { TierBadge, type Tier } from "@/components/TierBadge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TierProgressProps {
  showBadge?: boolean;
  className?: string;
}

const TIER_NAMES: Record<Tier, string> = {
  new_neighbor: "New Neighbor",
  good_neighbor: "Good Neighbor",
  trusted_neighbor: "Trusted Neighbor",
  community_pillar: "Community Pillar",
};

const NEXT_TIER: Record<Tier, Tier | null> = {
  new_neighbor: "good_neighbor",
  good_neighbor: "trusted_neighbor",
  trusted_neighbor: "community_pillar",
  community_pillar: null,
};

export function TierProgress({ showBadge = true, className }: TierProgressProps) {
  const { tier, tasksCompleted, nextTierProgress, isLoading } = useGamification();

  if (isLoading) return null;

  const nextTier = NEXT_TIER[tier];
  const isMaxTier = !nextTier;

  return (
    <div className={cn("space-y-3", className)}>
      {showBadge && (
        <div className="flex items-center justify-between">
          <TierBadge tier={tier} tasksCompleted={tasksCompleted} size="md" />
          {!isMaxTier && (
            <span className="text-xs text-muted-foreground">
              {nextTierProgress.current}/{nextTierProgress.required} to {TIER_NAMES[nextTier]}
            </span>
          )}
        </div>
      )}
      
      {!isMaxTier ? (
        <div className="space-y-1">
          <Progress 
            value={nextTierProgress.percentage} 
            className="h-2 bg-muted"
          />
          <p className="text-xs text-muted-foreground text-center">
            Help {nextTierProgress.required - nextTierProgress.current} more neighbours to reach {TIER_NAMES[nextTier]}
          </p>
        </div>
      ) : (
        <div className="text-center py-2 bg-accent/10 rounded-lg">
          <span className="text-sm text-accent font-medium">
            🏆 You've reached the highest tier!
          </span>
        </div>
      )}
    </div>
  );
}
