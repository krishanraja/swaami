import { supabase } from "@/integrations/supabase/client";

/**
 * Check if demo profiles exist in the database
 */
export async function checkDemoData() {
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_demo", true);

  if (error) {
    throw new Error(`Failed to check demo data: ${error.message}`);
  }

  return {
    demoProfileCount: count || 0,
    hasDemoData: (count || 0) > 0,
  };
}

/**
 * Get detailed demo data statistics
 */
export async function getDemoDataStats() {
  // Get demo profile count
  const { count: profileCount, error: profileError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_demo", true);

  if (profileError) {
    throw new Error(`Failed to get demo profile count: ${profileError.message}`);
  }

  // Get demo task count - first get demo profile IDs

  // Alternative approach: get all demo profile IDs first, then count tasks
  const { data: demoProfiles, error: demoProfilesError } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_demo", true);

  if (demoProfilesError) {
    throw new Error(`Failed to get demo profiles: ${demoProfilesError.message}`);
  }

  const demoProfileIds = demoProfiles?.map(p => p.id) || [];

  let demoTaskCount = 0;
  if (demoProfileIds.length > 0) {
    const { count: taskCountResult, error: taskCountError } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .in("owner_id", demoProfileIds);

    if (taskCountError) {
      console.error("Failed to get demo task count:", taskCountError);
    } else {
      demoTaskCount = taskCountResult || 0;
    }
  }

  return {
    demoProfileCount: profileCount || 0,
    demoTaskCount,
    hasDemoData: (profileCount || 0) > 0,
  };
}

/**
 * Call the seed-demo-users Edge Function to generate demo data
 */
export async function seedDemoData(count = 200, generatePhotos = false) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL environment variable");
  }

  if (!anonKey) {
    throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable");
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/seed-demo-users`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "generate",
        count,
        generatePhotos,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Seed function failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Cleanup demo data by calling the seed function with cleanup action
 */
export async function cleanupDemoData() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL environment variable");
  }

  if (!anonKey) {
    throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable");
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/seed-demo-users`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "cleanup",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cleanup function failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data;
}

