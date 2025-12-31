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

// Custom error class for timeout errors to enable proper error type checking
class NeighbourhoodsTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeighbourhoodsTimeoutError';
  }
}

export function useNeighbourhoods(city: City | null) {
  return useQuery({
    queryKey: ["neighbourhoods", city],
    queryFn: async ({ signal }) => {
      if (!city) return [];
      
      // Create AbortController for this request
      const abortController = new AbortController();
      
      // Combine with React Query's signal if available
      if (signal) {
        signal.addEventListener('abort', () => {
          abortController.abort();
        });
      }
      
      try {
        console.log('[useNeighbourhoods] Query started for city:', city);
        
        // Reduced timeout to 10 seconds for faster failure feedback
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.log('[useNeighbourhoods] Timeout fired after 10s');
            abortController.abort(); // Cancel the request
            reject(new NeighbourhoodsTimeoutError("Neighbourhoods query timeout"));
          }, 10000);
        });

        const queryPromise = supabase
          .from("neighbourhoods")
          .select("*")
          .eq("city", city)
          .order("name");

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
          console.error("[useNeighbourhoods] Supabase error:", error);
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
        
        console.log('[useNeighbourhoods] Query succeeded, data count:', data?.length);
        return (data || []) as Neighbourhood[];
      } catch (err) {
        console.error("[useNeighbourhoods] Query error:", err);
        
        // Re-throw with proper error type
        if (err instanceof NeighbourhoodsTimeoutError) {
          throw new NeighbourhoodsTimeoutError("Request timed out. Please check your connection and try again.");
        }
        
        // Re-throw other errors as-is
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
    refetchOnMount: true, // Allow retry on mount if previous attempt failed
    // Smart retry: don't retry on timeout (network issues won't resolve quickly)
    retry: (failureCount, error) => {
      console.log('[useNeighbourhoods] Retry check:', { failureCount, errorType: error?.constructor?.name, errorName: (error as any)?.name, errorMessage: error?.message });
      
      // Check error type instead of message (more reliable)
      if (error instanceof NeighbourhoodsTimeoutError) {
        console.log('[useNeighbourhoods] Timeout error detected (instanceof), not retrying');
        return false;
      }
      
      // Check error name property (in case React Query doesn't preserve instance)
      if (error && typeof error === 'object' && 'name' in error && (error as any).name === 'NeighbourhoodsTimeoutError') {
        console.log('[useNeighbourhoods] Timeout error detected (name check), not retrying');
        return false;
      }
      
      // Also check message as fallback
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('[useNeighbourhoods] Timeout in message, not retrying');
        return false;
      }
      
      console.log('[useNeighbourhoods] Non-timeout error, retrying if attempts < 1');
      return failureCount < 1; // Retry once for other errors
    },
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
