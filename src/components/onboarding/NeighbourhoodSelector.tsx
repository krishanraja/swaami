import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNeighbourhoods, City, CITY_CONFIG } from "@/hooks/useNeighbourhoods";
import { MapPin } from "lucide-react";

interface NeighbourhoodSelectorProps {
  city: City;
  value: string;
  onChange: (neighbourhood: string) => void;
}

export function NeighbourhoodSelector({ city, value, onChange }: NeighbourhoodSelectorProps) {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NeighbourhoodSelector.tsx:render',message:'Component RENDERING',data:{city,value},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D,E'})}).catch(()=>{});
  // #endregion
  const { data: neighbourhoods, isLoading } = useNeighbourhoods(city);
  const config = CITY_CONFIG[city];
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NeighbourhoodSelector.tsx:afterHook',message:'After useNeighbourhoods',data:{city,isLoading,hasNeighbourhoods:!!neighbourhoods?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <MapPin className="h-4 w-4" />
        <span>Neighbourhoods in {config.label}</span>
      </div>
      
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="h-12 rounded-xl">
          <SelectValue placeholder={isLoading ? "Loading..." : "Select your neighbourhood"} />
        </SelectTrigger>
        <SelectContent>
          {neighbourhoods?.map((n) => (
            <SelectItem key={n.id} value={n.name}>
              {n.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
