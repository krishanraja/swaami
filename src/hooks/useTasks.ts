import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useNeighbourhoods, type City } from "./useNeighbourhoods";
import { validateStatusTransition, TASK_STATUS_TRANSITIONS, getInvalidTransitionError } from "@/lib/stateMachine";

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
  // Enhanced fields
  availability_time?: string | null;
  physical_level?: string | null;
  people_needed?: number | null;
  access_instructions?: string | null;
  is_demo?: boolean;
  // Owner info
  owner?: {
    display_name: string | null;
    tasks_completed?: number;
    reliability_score?: number;
    trust_tier?: string;
    is_demo?: boolean;
    photo_url?: string | null;
    skills?: string[];
    member_since?: string;
    neighbourhood?: string | null;
  };
  owner_display_name?: string | null;
  owner_trust_tier?: string | null;
  owner_reliability_score?: number | null;
  distance?: number | null;
}

export function useTasks() {
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [helping, setHelping] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch user's neighbourhood coordinates
  const { data: neighbourhoods = [] } = useNeighbourhoods((profile?.city as City) || null);

  // Update user location when profile or neighbourhoods change
  useEffect(() => {
    if (profile?.neighbourhood && neighbourhoods.length > 0) {
      const userNeighbourhood = neighbourhoods.find(
        (n) => n.name === profile.neighbourhood
      );
      if (userNeighbourhood?.latitude && userNeighbourhood?.longitude) {
        setUserLocation({
          lat: userNeighbourhood.latitude,
          lng: userNeighbourhood.longitude,
        });
      }
    }
  }, [profile?.neighbourhood, neighbourhoods]);

  const fetchTasks = useCallback(async () => {
    setError(null);
    setLoading(true);
    
    try {
      let data: Record<string, unknown>[] | null = null;
      let fetchError: { message: string } | null = null;

      // Always try location-based query with 5km radius for client-side filtering
      if (userLocation) {
        const result = await supabase.rpc("get_nearby_tasks", {
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
          radius_km: 5, // Fetch 5km radius, let client filter
        });
        data = result.data;
        fetchError = result.error;
      } else {
        // Fallback to non-location-based query when no location available
        const result = await supabase.rpc("get_public_tasks");
        data = result.data;
        fetchError = result.error;
      }

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch tasks');
      }

      // Map RPC response to Task interface
      const allTasks = (data || []).map((task: Record<string, unknown>) => ({
        ...task,
        is_demo: task.owner_is_demo,
        owner: {
          display_name: task.owner_display_name,
          reliability_score: task.owner_reliability_score,
          trust_tier: task.owner_trust_tier,
          is_demo: task.owner_is_demo,
          photo_url: task.owner_photo_url,
          skills: task.owner_skills,
          member_since: task.owner_member_since,
          tasks_completed: task.owner_tasks_completed,
          neighbourhood: task.owner_neighbourhood,
        },
        distance: task.distance_km != null ? Math.round(task.distance_km * 1000) : null, // Convert to meters
      }));
      
      // Separate own tasks from others' tasks
      if (profile?.id) {
        const othersTasks = allTasks.filter((t: Task) => t.owner_id !== profile.id);
        const ownTasks = allTasks.filter((t: Task) => t.owner_id === profile.id);
        setTasks(othersTasks);
        setMyTasks(ownTasks);
      } else {
        setTasks(allTasks);
        setMyTasks([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, userLocation]);

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
    availability_time?: string;
    physical_level?: string;
    people_needed?: number;
    access_instructions?: string;
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
    
    // Double-submission protection
    if (helping.has(taskId)) {
      return { error: new Error("Already processing help request") };
    }

    setHelping(prev => new Set(prev).add(taskId));

    try {
      // Get the task details for the auto-intro message
      const task = tasks.find(t => t.id === taskId);

      // Use atomic database function to create match and update task
      const { data: rpcData, error: rpcError } = await supabase.rpc('help_with_task', {
        p_task_id: taskId,
        p_helper_id: profile.id
      });

      if (rpcError) {
        // Check if it's a constraint violation (task already matched)
        if (rpcError.message?.includes('already matched') || rpcError.message?.includes('no longer available')) {
          return { error: new Error(rpcError.message) };
        }
        return { error: rpcError };
      }

      if (!rpcData || rpcData.length === 0) {
        return { error: new Error("Failed to create match") };
      }

      const matchId = rpcData[0].match_id;

      // Fetch match with task details
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select(`
          *,
          task:tasks(*)
        `)
        .eq("id", matchId)
        .single();

      if (matchError) return { error: matchError };

      // Send auto-intro message
      const introMessage = task 
        ? `Hi! I can help with "${task.title}". I'm on my way! 👋`
        : "Hi! I'm here to help. On my way! 👋";

      await supabase.from("messages").insert({
        match_id: match.id,
        sender_id: profile.id,
        content: introMessage,
      });

      return { data: match, error: null };
    } finally {
      setHelping(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const cancelTask = async (taskId: string) => {
    if (!profile) return { error: new Error("No profile") };

    // Validate state transition
    const task = tasks.find(t => t.id === taskId) || myTasks.find(t => t.id === taskId);
    if (task && !validateStatusTransition(task.status, "cancelled", TASK_STATUS_TRANSITIONS)) {
      return { error: new Error(getInvalidTransitionError(task.status, "cancelled", 'task')) };
    }

    const { error } = await supabase
      .from("tasks")
      .update({ status: "cancelled" })
      .eq("id", taskId);

    if (!error) {
      // Refresh tasks to update the lists
      fetchTasks();
    }

    return { error };
  };

  return { tasks, myTasks, loading, error, fetchTasks, createTask, helpWithTask, cancelTask, helping };
}
