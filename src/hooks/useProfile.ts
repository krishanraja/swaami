import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { retrySupabaseOperation } from "@/lib/retry";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  city: string | null;
  neighbourhood: string | null;
  radius: number;
  skills: string[];
  availability: string;
  credits: number;
  tasks_completed: number;
  reliability_score: number;
  trust_tier: "tier_0" | "tier_1" | "tier_2" | null;
  is_demo: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return { error: new Error("No profile") };

    // Use optimistic locking with updated_at check
    const result = await retrySupabaseOperation(async () => {
      return await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .eq("updated_at", profile.updated_at) // Optimistic locking
        .select()
        .single();
    }, {
      maxAttempts: 3,
      initialDelayMs: 200,
      // Don't retry on optimistic lock failures (concurrent update)
      retryableErrors: ['network', 'timeout', 'connection'],
    });

    if (!result.error && result.data) {
      setProfile(result.data);
    }

    return result;
  };

  return { profile, loading, updateProfile };
}
