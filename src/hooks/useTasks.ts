import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useNeighbourhoods, type City } from "./useNeighbourhoods";

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
    let data: any[] | null = null;
    let error: any = null;

    // Use location-based filtering if user has location set
    if (userLocation && profile?.radius) {
      const radiusKm = (profile.radius || 500) / 1000; // Convert meters to km
      const result = await supabase.rpc("get_nearby_tasks", {
        user_lat: userLocation.lat,
        user_lng: userLocation.lng,
        radius_km: radiusKm,
      });
      data = result.data;
      error = result.error;
    } else {
      // Fallback to non-location-based query
      const result = await supabase.rpc("get_public_tasks");
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      // Map RPC response to Task interface
      const allTasks = (data || []).map((task: any) => ({
        ...task,
        is_demo: task.owner_is_demo,
        owner: {
          display_name: task.owner_display_name,
          reliability_score: task.owner_reliability_score,
          trust_tier: task.owner_trust_tier,
          is_demo: task.owner_is_demo,
          photo_url: task.owner_photo_url,
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
    }
    setLoading(false);
  }, [profile?.id, profile?.radius, userLocation]);

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

    // Get the task details for the auto-intro message
    const task = tasks.find(t => t.id === taskId);

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

    if (taskError) return { data: match, error: taskError };

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
  };

  const cancelTask = async (taskId: string) => {
    if (!profile) return { error: new Error("No profile") };

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

  return { tasks, myTasks, loading, fetchTasks, createTask, helpWithTask, cancelTask };
}
