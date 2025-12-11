import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface Match {
  id: string;
  task_id: string;
  helper_id: string;
  status: string;
  created_at: string;
  task?: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    owner: {
      id: string;
      display_name: string | null;
    };
  };
  helper?: {
    id: string;
    display_name: string | null;
  };
}

export function useMatches() {
  const { profile } = useProfile();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        task:tasks(
          id,
          title,
          description,
          status,
          owner:profiles!tasks_owner_id_fkey(id, display_name)
        ),
        helper:profiles!matches_helper_id_fkey(id, display_name)
      `)
      .or(`helper_id.eq.${profile.id},task.owner_id.eq.${profile.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching matches:", error);
    } else {
      setMatches(data || []);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchMatches();

    const channel = supabase
      .channel("matches-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

  const updateMatchStatus = async (matchId: string, status: string) => {
    const { error } = await supabase
      .from("matches")
      .update({ status })
      .eq("id", matchId);

    if (!error) {
      fetchMatches();
    }

    return { error };
  };

  return { matches, loading, fetchMatches, updateMatchStatus };
}
