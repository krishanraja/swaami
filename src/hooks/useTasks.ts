import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface Task {
  id: string;
  owner_id: string;
  helper_id: string | null;
  title: string;
  description: string | null;
  original_description: string | null;
  time_estimate: string | null;
  urgency: string;
  category: string | null;
  location_lat: number | null;
  location_lng: number | null;
  approx_address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  owner?: {
    display_name: string | null;
    tasks_completed: number;
    reliability_score: number;
  };
  distance?: number;
}

export function useTasks() {
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        owner:profiles!tasks_owner_id_fkey(display_name, tasks_completed, reliability_score)
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      // Add mock distance for now (would use geolocation in production)
      const tasksWithDistance = (data || []).map(task => ({
        ...task,
        distance: Math.floor(Math.random() * 700) + 50,
      }));
      setTasks(tasksWithDistance);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const createTask = async (task: {
    title: string;
    description: string;
    original_description?: string;
    time_estimate?: string;
    urgency?: string;
    category?: string;
  }) => {
    if (!profile) return { error: new Error("No profile") };

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        owner_id: profile.id,
        ...task,
      })
      .select()
      .single();

    return { data, error };
  };

  const helpWithTask = async (taskId: string) => {
    if (!profile) return { error: new Error("No profile") };

    // Create a match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        task_id: taskId,
        helper_id: profile.id,
        status: "accepted",
      })
      .select()
      .single();

    if (matchError) return { error: matchError };

    // Update task status
    const { error: taskError } = await supabase
      .from("tasks")
      .update({ status: "matched", helper_id: profile.id })
      .eq("id", taskId);

    return { data: match, error: taskError };
  };

  return { tasks, loading, fetchTasks, createTask, helpWithTask };
}
