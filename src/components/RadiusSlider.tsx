import { Slider } from "@/components/ui/slider";
import { Lock, Sparkles } from "lucide-react";
import { FREE_LIMITS, PLUS_LIMITS } from "@/hooks/useSubscription";

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

export function RadiusSlider({ 
  value, 
  onChange, 
  min = 100, 
  max, 
  isPremium = false,
  onUpgradeClick 
}: RadiusSliderProps) {
  const effectiveMax = isPremium ? PLUS_LIMITS.maxRadius : FREE_LIMITS.maxRadius;
  const finalMax = max ?? effectiveMax;
  
  const displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Your radius</span>
        <span className="text-lg font-semibold text-foreground">{displayValue}</span>
      </div>
      <Slider
        value={[Math.min(value, finalMax)]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={finalMax}
        step={50}
        className="w-full"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>100m</span>
        <span>{finalMax >= 1000 ? `${finalMax / 1000}km` : `${finalMax}m`}</span>
      </div>
      
      {/* Upgrade prompt for free users */}
      {!isPremium && onUpgradeClick && (
        <button 
          onClick={onUpgradeClick}
          className="w-full flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg py-2 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>Unlock 2km radius with Swaami+</span>
        </button>
      )}
    </div>
  );
}
