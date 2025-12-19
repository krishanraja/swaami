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
  const result = useQuery({
    queryKey: ["neighbourhoods", city],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNeighbourhoods.ts:queryFn',message:'Query function EXECUTING',data:{city},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
    // FIX: Prevent unnecessary refetches that cause loading state flicker
    staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component remounts (if data exists)
  });

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/aad48c30-4ebd-475a-b7ac-4c9b2a5031e4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNeighbourhoods.ts:hookReturn',message:'Hook returning',data:{city,isLoading:result.isLoading,isFetching:result.isFetching,isStale:result.isStale,dataStatus:result.data?'has-data':'no-data'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
  // #endregion

  return result;
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
