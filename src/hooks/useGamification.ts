import { useProfile } from "./useProfile";
import { getTierFromTasks, type Tier } from "@/components/TierBadge";

interface GamificationState {
  credits: number;
  tasksCompleted: number;
  tier: Tier;
  streakDays: number;
  isLoading: boolean;
  nextTierProgress: {
    current: number;
    required: number;
    percentage: number;
  };
}

export function useGamification(): GamificationState {
  const { profile, loading } = useProfile();

  const tasksCompleted = profile?.tasks_completed ?? 0;
  const credits = profile?.credits ?? 0;
  const tier = getTierFromTasks(tasksCompleted);

  // Calculate progress to next tier
  const tierThresholds = [0, 3, 10, 25];
  const currentTierIndex = tierThresholds.findIndex((t, i) => {
    const nextThreshold = tierThresholds[i + 1] ?? Infinity;
    return tasksCompleted >= t && tasksCompleted < nextThreshold;
  });
  
  const currentThreshold = tierThresholds[currentTierIndex] ?? 0;
  const nextThreshold = tierThresholds[currentTierIndex + 1] ?? tasksCompleted;
  const progressInTier = tasksCompleted - currentThreshold;
  const requiredForNext = nextThreshold - currentThreshold;

  return {
    credits,
    tasksCompleted,
    tier,
    streakDays: 0, // TODO: Implement streak tracking after DB migration
    isLoading: loading,
    nextTierProgress: {
      current: progressInTier,
      required: requiredForNext,
      percentage: Math.min((progressInTier / requiredForNext) * 100, 100),
    },
  };
}
