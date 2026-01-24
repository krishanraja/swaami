import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Seed function invoked");

    // Get env vars
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl) {
      console.error("❌ SUPABASE_URL not set");
      throw new Error("Missing SUPABASE_URL");
    }
    if (!serviceRoleKey) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY not set");
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    console.log("✅ Environment variables OK");

    // Create service role client (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log("✅ Supabase client created");

    // Parse request
    const body = await req.json();
    const { action, count = 10 } = body;

    console.log(`📋 Action: ${action}, Count: ${count}`);

    // CLEANUP ACTION
    if (action === "cleanup") {
      console.log("🗑️ Starting cleanup...");

      const { data: demoProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_demo", true);

      const demoIds = demoProfiles?.map(p => p.id) || [];
      console.log(`Found ${demoIds.length} demo profiles to delete`);

      if (demoIds.length > 0) {
        await supabase.from("tasks").delete().in("owner_id", demoIds);
        await supabase.from("profiles").delete().eq("is_demo", true);
      }

      return new Response(
        JSON.stringify({ success: true, deleted: demoIds.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GENERATE ACTION
    if (action !== "generate") {
      throw new Error(`Invalid action: ${action}`);
    }

    console.log(`🌱 Generating ${count} demo profiles...`);

    const profiles = [];
    const tasks = [];

    // Simple demo data
    const names = [
      "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry",
      "Ivy", "Jack", "Kate", "Liam", "Mia", "Noah", "Olivia", "Peter",
      "Quinn", "Rachel", "Sam", "Tara", "Uma", "Victor", "Wendy", "Xander"
    ];

    const cities = ["sydney", "new_york"];
    const sydneyNeighbourhoods = ["Surry Hills", "Bondi", "Newtown", "Paddington"];
    const nyNeighbourhoods = ["Williamsburg", "Park Slope", "Chelsea", "SoHo"];
    const skills = ["Errands", "Tech Support", "Pet Care", "Moving Help", "Gardening"];

    for (let i = 0; i < count; i++) {
      const city = cities[i % 2];
      const name = names[i % names.length];
      const neighbourhoods = city === "sydney" ? sydneyNeighbourhoods : nyNeighbourhoods;
      const neighbourhood = neighbourhoods[Math.floor(Math.random() * neighbourhoods.length)];

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          display_name: `${name} ${String.fromCharCode(65 + (i % 26))}.`,
          city,
          neighbourhood,
          skills: [skills[Math.floor(Math.random() * skills.length)]],
          trust_tier: "tier_1",
          tasks_completed: Math.floor(Math.random() * 20),
          reliability_score: 4.5 + (Math.random() * 0.5),
          radius: 10,
          credits: 10,
          is_demo: true,
        })
        .select()
        .single();

      if (profileError) {
        console.error(`❌ Profile creation failed:`, profileError);
        throw profileError;
      }

      profiles.push(profile);
      console.log(`✅ Created profile ${i + 1}/${count}: ${profile.display_name}`);

      // Create 2 tasks for this profile
      const taskTitles = [
        "Help with groceries",
        "Dog walking needed",
        "Tech support - printer",
        "Moving boxes upstairs",
        "Garden cleanup help",
      ];

      for (let j = 0; j < 2; j++) {
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .insert({
            owner_id: profile.id,
            title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
            description: `Demo task ${j + 1} in ${neighbourhood}`,
            category: skills[Math.floor(Math.random() * skills.length)],
            urgency: "normal",
            status: "open",
            time_estimate: "30 min",
            physical_level: "light",
            approx_address: neighbourhood,
          })
          .select()
          .single();

        if (taskError) {
          console.error(`❌ Task creation failed:`, taskError);
        } else {
          tasks.push(task);
        }
      }
    }

    console.log(`✅ Created ${profiles.length} profiles and ${tasks.length} tasks`);

    return new Response(
      JSON.stringify({
        success: true,
        profilesCreated: profiles.length,
        tasksCreated: tasks.length,
        errors: [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("❌ Function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
