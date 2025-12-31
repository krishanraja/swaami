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

  // If we have an error but also have cached data, allow selection
  const hasData = neighbourhoods && neighbourhoods.length > 0;
  // Only disable if loading AND no cached data exists
  // Allow interaction on error so user can see error message and retry
  // Don't disable on error - let user see the error and retry button
  const isDisabled = !hasData && isLoading;

  // Diagnostic logging
  console.log('[NeighbourhoodSelector]', { 
    city, 
    isLoading, 
    error: error?.message, 
    hasData, 
    isDisabled,
    neighbourhoodsCount: neighbourhoods?.length 
  });

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
              onClick={() => {
                console.log('[NeighbourhoodSelector] Manual retry triggered');
                refetch();
              }}
              className="text-sm underline hover:no-underline ml-2 font-medium text-destructive"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      <Select 
        value={value} 
        onValueChange={onChange} 
        disabled={isDisabled}
      >
        <SelectTrigger className="h-12 rounded-xl">
          <SelectValue 
            placeholder={
              isLoading 
                ? "Loading..." 
                : error && !hasData
                  ? "Error loading neighbourhoods" 
                  : "Select your neighbourhood"
            } 
          />
        </SelectTrigger>
        <SelectContent
          position="item-aligned"
          side="bottom"
          align="start"
          sideOffset={4}
          className="max-h-[40vh] overflow-y-auto"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {hasData ? (
            neighbourhoods.map((n) => (
              <SelectItem key={n.id} value={n.name}>
                {n.name}
              </SelectItem>
            ))
          ) : (
            !isLoading && !error && (
              <SelectItem value="_empty" disabled>
                No neighbourhoods found
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
