import { ReactNode } from "react";
import { Flame } from "lucide-react";
import swaamiIcon from "@/assets/swaami-icon.png";
import { useGamification } from "@/hooks/useGamification";
import { TierBadge } from "@/components/TierBadge";

interface AppHeaderProps {
  title?: string;
  actions?: ReactNode;
  showGamification?: boolean;
}

export function AppHeader({ title, actions, showGamification = true }: AppHeaderProps) {
  const { tier, tasksCompleted, streakDays, isLoading } = useGamification();

  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10" role="banner">
      <div className="px-4 py-4 max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={swaamiIcon} alt="Swaami - Home" className="h-8 w-auto" />
          {title && (
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Gamification indicators */}
          {showGamification && !isLoading && (
            <div className="flex items-center gap-2">
              {/* Streak indicator */}
              {streakDays > 0 && (
                <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                  <Flame className="h-4 w-4 fill-orange-500" />
                  <span className="text-xs font-bold">{streakDays}</span>
                </div>
              )}
              {/* Tier badge - compact */}
              <TierBadge tier={tier} tasksCompleted={tasksCompleted} size="sm" showLabel={false} />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
