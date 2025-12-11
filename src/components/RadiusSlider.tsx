import { Slider } from "@/components/ui/slider";

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function RadiusSlider({ value, onChange, min = 100, max = 2000 }: RadiusSliderProps) {
  const displayValue = value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Your radius</span>
        <span className="text-lg font-semibold text-foreground">{displayValue}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={50}
        className="w-full"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>100m</span>
        <span>2km</span>
      </div>
    </div>
  );
}
