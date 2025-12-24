import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type City = "sydney" | "new_york";

export interface Neighbourhood {
  id: string;
  city: City;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export function useNeighbourhoods(city: City | null) {
  return useQuery({
    queryKey: ["neighbourhoods", city],
    queryFn: async () => {
      if (!city) return [];
      
      try {
        const { data, error } = await supabase
          .from("neighbourhoods")
          .select("*")
          .eq("city", city)
          .order("name");

        if (error) {
          console.error("Error fetching neighbourhoods:", error);
          // Check if it's an auth error
          if (error.code === "PGRST301" || error.message?.includes("JWT") || error.message?.includes("token")) {
            throw new Error("Authentication required to load neighbourhoods");
          }
          // Check if it's a network error
          if (error.message?.includes("fetch") || error.message?.includes("network")) {
            throw new Error("Network error. Please check your connection.");
          }
          throw new Error(error.message || "Failed to load neighbourhoods");
        }
        
        return (data || []) as Neighbourhood[];
      } catch (err) {
        console.error("Neighbourhoods query error:", err);
        // Re-throw with more context
        if (err instanceof Error) {
          throw err;
        }
        throw new Error("Unexpected error loading neighbourhoods");
      }
    },
    enabled: !!city,
    // Prevent unnecessary refetches that cause loading state flicker
    staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component remounts (if data exists)
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

export const CITY_CONFIG = {
  sydney: {
    label: "Sydney",
    country: "Australia",
    phonePrefix: "+61",
    phoneFormat: "04XX XXX XXX",
    flag: "🇦🇺",
  },
  new_york: {
    label: "New York",
    country: "United States",
    phonePrefix: "+1",
    phoneFormat: "(XXX) XXX-XXXX",
    flag: "🇺🇸",
  },
} as const;
