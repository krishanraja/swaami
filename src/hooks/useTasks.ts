import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface Task {
  id: string;
  owner_id: string;
  helper_id?: string | null;
  title: string;
  description: string | null;
  original_description?: string | null;
  time_estimate: string | null;
  urgency: string;
  category: string | null;
  approx_address: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  owner?: {
    display_name: string | null;
    tasks_completed?: number;
    reliability_score?: number;
  };
  owner_display_name?: string | null;
  owner_trust_tier?: string | null;
  owner_reliability_score?: number | null;
  distance?: number | null;
}

export function useTasks() {
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    // Use secure RPC function that hides precise location data
    const { data, error } = await supabase.rpc("get_public_tasks");

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      // Map RPC response to Task interface
      const tasksWithOwner = (data || []).map((task: any) => ({
        ...task,
        owner: {
          display_name: task.owner_display_name,
          reliability_score: task.owner_reliability_score,
        },
        distance: null,
      }));
      setTasks(tasksWithOwner);
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
