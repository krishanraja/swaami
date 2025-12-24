import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNeighbourhoods, City, CITY_CONFIG } from "@/hooks/useNeighbourhoods";
import { MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NeighbourhoodSelectorProps {
  city: City;
  value: string;
  onChange: (neighbourhood: string) => void;
}

export function NeighbourhoodSelector({ city, value, onChange }: NeighbourhoodSelectorProps) {
  const { data: neighbourhoods, isLoading, error, refetch } = useNeighbourhoods(city);
  const config = CITY_CONFIG[city];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <MapPin className="h-4 w-4" />
        <span>Neighbourhoods in {config.label}</span>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {error instanceof Error ? error.message : "Failed to load neighbourhoods"}
            </span>
            <button
              onClick={() => refetch()}
              className="text-sm underline hover:no-underline ml-2"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      <Select 
        value={value} 
        onValueChange={onChange} 
        disabled={isLoading || !!error}
      >
        <SelectTrigger className="h-12 rounded-xl">
          <SelectValue 
            placeholder={
              isLoading 
                ? "Loading..." 
                : error 
                  ? "Error loading neighbourhoods" 
                  : "Select your neighbourhood"
            } 
          />
        </SelectTrigger>
        <SelectContent>
          {neighbourhoods && neighbourhoods.length > 0 ? (
            neighbourhoods.map((n) => (
              <SelectItem key={n.id} value={n.name}>
                {n.name}
              </SelectItem>
            ))
          ) : (
            !isLoading && !error && (
              <SelectItem value="" disabled>
                No neighbourhoods found
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
