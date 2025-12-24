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
        // Increased timeout to 15 seconds for slow connections
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Neighbourhoods query timeout")), 15000);
        });

        const queryPromise = supabase
          .from("neighbourhoods")
          .select("*")
          .eq("city", city)
          .order("name");

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

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
          // If it's a timeout, provide user-friendly message
          if (err.message.includes("timeout")) {
            throw new Error("Request timed out. Please check your connection and try again.");
          }
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
    retry: 1, // Reduced retries to fail faster
    retryDelay: 1000, // Fixed delay instead of exponential backoff
    // Add query timeout at React Query level as well
    gcTime: 1000 * 60 * 5, // Cache time (formerly cacheTime)
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
