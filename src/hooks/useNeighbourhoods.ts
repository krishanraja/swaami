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
      
      const { data, error } = await supabase
        .from("neighbourhoods")
        .select("*")
        .eq("city", city)
        .order("name");

      if (error) throw error;
      return data as Neighbourhood[];
    },
    enabled: !!city,
    // Prevent unnecessary refetches that cause loading state flicker
    staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component remounts (if data exists)
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
