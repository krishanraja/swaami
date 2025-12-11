import { Button } from "@/components/ui/button";
import { City, CITY_CONFIG } from "@/hooks/useNeighbourhoods";

interface CitySelectorProps {
  value: City | null;
  onChange: (city: City) => void;
}

export function CitySelector({ value, onChange }: CitySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {(Object.entries(CITY_CONFIG) as [City, typeof CITY_CONFIG[City]][]).map(([city, config]) => (
        <Button
          key={city}
          variant={value === city ? "default" : "outline"}
          className={`h-24 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all ${
            value === city 
              ? "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2" 
              : "hover:bg-accent/10"
          }`}
          onClick={() => onChange(city)}
        >
          <span className="text-3xl">{config.flag}</span>
          <span className="font-semibold">{config.label}</span>
        </Button>
      ))}
    </div>
  );
}
