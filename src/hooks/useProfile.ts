// Re-export profile from AuthContext for backward compatibility
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type { Profile } from "@/contexts/AuthContext";

export function useProfile() {
  const { profile, authState, refreshProfile } = useAuth();
  
  const loading = authState === "loading";

  const updateProfile = async (updates: Partial<typeof profile>) => {
    if (!profile) return { error: new Error("No profile"), data: null };

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (!error) {
      // Refresh the profile in context
      await refreshProfile();
    }

    return { data, error };
  };

  return { profile, loading, updateProfile };
}
