import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrustTier } from "@/hooks/useTrustTier";

interface TrustBadgeProps {
  tier: TrustTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig: Record<TrustTier, {
  icon: typeof Shield;
  label: string;
  description: string;
  colors: string;
}> = {
  tier_0: {
    icon: ShieldAlert,
    label: 'Guest',
    description: 'Limited access - verify to unlock features',
    colors: 'text-muted-foreground bg-muted/50',
  },
  tier_1: {
    icon: Shield,
    label: 'Verified',
    description: 'Can post and message',
    colors: 'text-primary bg-primary/10',
  },
  tier_2: {
    icon: ShieldCheck,
    label: 'Trusted',
    description: 'Full access to all features',
    colors: 'text-emerald-600 bg-emerald-500/10',
  },
};

const sizeClasses = {
  sm: 'h-5 w-5 p-0.5',
  md: 'h-7 w-7 p-1',
  lg: 'h-9 w-9 p-1.5',
};

export function TrustBadge({ tier, size = 'md', showLabel = false }: TrustBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'rounded-full flex items-center justify-center',
        sizeClasses[size],
        config.colors
      )}>
        <Icon className="w-full h-full" />
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-xs text-muted-foreground">{config.description}</span>
        </div>
      )}
    </div>
  );
}
