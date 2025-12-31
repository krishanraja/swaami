import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNeighbourhoods, City, CITY_CONFIG } from "@/hooks/useNeighbourhoods";
import { MapPin } from "lucide-react";

interface NeighbourhoodSelectorProps {
  city: City;
  value: string;
  onChange: (neighbourhood: string) => void;
}

export function NeighbourhoodSelector({ city, value, onChange }: NeighbourhoodSelectorProps) {
  const { data: neighbourhoods } = useNeighbourhoods(city);
  const config = CITY_CONFIG[city];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <MapPin className="h-4 w-4" />
        <span>Neighbourhoods in {config.label}</span>
      </div>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-xl">
          <SelectValue placeholder="Select your neighbourhood" />
        </SelectTrigger>
        <SelectContent
          position="item-aligned"
          side="bottom"
          align="start"
          sideOffset={4}
          className="max-h-[40vh] overflow-y-auto"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {neighbourhoods.map((n) => (
            <SelectItem key={n.id} value={n.name}>
              {n.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
