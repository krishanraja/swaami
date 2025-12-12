import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HelperPreview {
  count: number;
  isLoading: boolean;
}

/**
 * Hook to get count of potential helpers nearby for a given category
 */
export function useHelperPreview(category?: string): HelperPreview {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHelpers = async () => {
      setIsLoading(true);
      try {
        // Get profiles with matching skills
        let query = supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gt("tasks_completed", 0);

        if (category) {
          // Filter by category/skill match
          query = query.contains("skills", [category]);
        }

        const { count: helperCount } = await query;
        setCount(helperCount || 0);
      } catch (error) {
        console.error("Error fetching helper preview:", error);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHelpers();
  }, [category]);

  return { count, isLoading };
}
