import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LiveActivity {
  tasksCompletedToday: number;
  activeHelpers: number;
  isLoading: boolean;
}

export function useLiveActivity(): LiveActivity {
  const [tasksCompletedToday, setTasksCompletedToday] = useState(0);
  const [activeHelpers, setActiveHelpers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        // Get tasks completed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: tasksCount } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("updated_at", today.toISOString());

        // Get active helpers (profiles with tasks_completed > 0)
        const { count: helpersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gt("tasks_completed", 0);

        setTasksCompletedToday(tasksCount || 0);
        setActiveHelpers(helpersCount || 0);
      } catch (error) {
        console.error("Error fetching live activity:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, []);

  return { tasksCompletedToday, activeHelpers, isLoading };
}
