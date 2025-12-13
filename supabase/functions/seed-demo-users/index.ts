import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Diverse name pools reflecting city demographics
const SYDNEY_NAMES = [
  // Australian names
  { first: "Jack", last: "Mitchell" }, { first: "Olivia", last: "Thompson" },
  { first: "Liam", last: "Wilson" }, { first: "Emma", last: "Taylor" },
  { first: "Noah", last: "Anderson" }, { first: "Charlotte", last: "Brown" },
  // Chinese Australian
  { first: "Wei", last: "Chen" }, { first: "Mei", last: "Wong" },
  { first: "David", last: "Li" }, { first: "Jenny", last: "Zhang" },
  { first: "Kevin", last: "Liu" }, { first: "Amy", last: "Wang" },
  // Indian Australian
  { first: "Raj", last: "Sharma" }, { first: "Priya", last: "Patel" },
  { first: "Amit", last: "Singh" }, { first: "Anita", last: "Gupta" },
  // Greek Australian
  { first: "Nick", last: "Papadopoulos" }, { first: "Maria", last: "Konstantinos" },
  { first: "George", last: "Dimitriou" }, { first: "Sofia", last: "Andreou" },
  // Vietnamese Australian
  { first: "Minh", last: "Nguyen" }, { first: "Linh", last: "Tran" },
  { first: "Duc", last: "Pham" }, { first: "Huong", last: "Le" },
  // Lebanese Australian
  { first: "Sam", last: "Haddad" }, { first: "Layla", last: "Khoury" },
  { first: "Tony", last: "Aboud" }, { first: "Nadia", last: "Mansour" },
  // British Australian
  { first: "James", last: "Edwards" }, { first: "Emily", last: "Harrison" },
  { first: "William", last: "Clarke" }, { first: "Sophie", last: "Roberts" },
  // Additional diverse names
  { first: "Lucas", last: "O'Brien" }, { first: "Zara", last: "Mohammed" },
  { first: "Ethan", last: "Kim" }, { first: "Isabella", last: "Costa" },
  { first: "Oliver", last: "Murphy" }, { first: "Chloe", last: "Lee" },
  { first: "Benjamin", last: "Garcia" }, { first: "Mia", last: "Johnson" },
  { first: "Alexander", last: "White" }, { first: "Ava", last: "Martin" },
  { first: "Henry", last: "Davis" }, { first: "Amelia", last: "Jackson" },
  { first: "Sebastian", last: "Harris" }, { first: "Harper", last: "Lewis" },
  { first: "Daniel", last: "Walker" }, { first: "Ella", last: "Hall" },
  { first: "Matthew", last: "Allen" }, { first: "Grace", last: "Young" },
];

const NEW_YORK_NAMES = [
  // American names
  { first: "Michael", last: "Johnson" }, { first: "Sarah", last: "Williams" },
  { first: "Christopher", last: "Davis" }, { first: "Jessica", last: "Miller" },
  { first: "Brandon", last: "Smith" }, { first: "Ashley", last: "Anderson" },
  // Hispanic American
  { first: "Carlos", last: "Rodriguez" }, { first: "Maria", last: "Garcia" },
  { first: "Jose", last: "Martinez" }, { first: "Ana", last: "Lopez" },
  { first: "Miguel", last: "Hernandez" }, { first: "Sofia", last: "Gonzalez" },
  // Chinese American
  { first: "Kevin", last: "Chen" }, { first: "Michelle", last: "Wong" },
  { first: "Eric", last: "Lin" }, { first: "Jennifer", last: "Wu" },
  // Jewish American
  { first: "David", last: "Goldstein" }, { first: "Rachel", last: "Cohen" },
  { first: "Joshua", last: "Levy" }, { first: "Rebecca", last: "Rosen" },
  // Italian American
  { first: "Anthony", last: "Romano" }, { first: "Angela", last: "Russo" },
  { first: "Vincent", last: "DeLuca" }, { first: "Gina", last: "Marino" },
  // Korean American
  { first: "Jason", last: "Kim" }, { first: "Grace", last: "Park" },
  { first: "Brian", last: "Lee" }, { first: "Christina", last: "Choi" },
  // African American
  { first: "Marcus", last: "Washington" }, { first: "Jasmine", last: "Jackson" },
  { first: "Darnell", last: "Thompson" }, { first: "Aaliyah", last: "Harris" },
  { first: "Terrence", last: "Brown" }, { first: "Keisha", last: "Williams" },
  // Additional diverse names
  { first: "Ryan", last: "O'Connor" }, { first: "Samantha", last: "Adams" },
  { first: "Tyler", last: "Brooks" }, { first: "Nicole", last: "Rivera" },
  { first: "Jordan", last: "Foster" }, { first: "Lauren", last: "Murphy" },
  { first: "Dylan", last: "Sanders" }, { first: "Megan", last: "Powell" },
  { first: "Austin", last: "Bailey" }, { first: "Kayla", last: "Cooper" },
  { first: "Zachary", last: "Ward" }, { first: "Amanda", last: "Torres" },
];

const SYDNEY_NEIGHBOURHOODS = [
  "Surry Hills", "Bondi", "Newtown", "Paddington", "Marrickville",
  "Balmain", "Glebe", "Darlinghurst", "Redfern", "Manly",
  "Mosman", "Neutral Bay"
];

const NEW_YORK_NEIGHBOURHOODS = [
  "Williamsburg", "Park Slope", "Astoria", "Chelsea", "SoHo",
  "Tribeca", "Upper West Side", "Upper East Side", "Greenwich Village",
  "Harlem", "Long Island City", "DUMBO"
];

const SKILLS = [
  "Errands", "Tech Support", "Pet Care", "Moving Help", "Gardening",
  "Cooking", "Tutoring", "Cleaning", "Driving", "DIY", "Shopping", "Companionship"
];

// Task templates with personality
const TASK_TEMPLATES = {
  Errands: [
    { title: "Woolies run needed", description: "Just a few things from Woolworths - milk, bread, and some veggies. Happy to text you the list!" },
    { title: "Chemist pickup please", description: "Need to pick up a prescription from the pharmacy. I'll give you my details when matched." },
    { title: "Post office parcel", description: "Got a parcel waiting at the post office, just need someone to grab it for me." },
    { title: "Dry cleaning pickup", description: "Two items at the dry cleaners down the road. Receipt in hand!" },
    { title: "Return package to store", description: "Online order that didn't fit. Just needs returning to the shop." },
  ],
  "Tech Support": [
    { title: "iPhone setup help", description: "Just got a new phone and need help transferring everything from my old one." },
    { title: "Printer won't connect", description: "My printer and laptop aren't talking to each other. Can you work your magic?" },
    { title: "Help with Zoom", description: "Need to join a video call but keep getting error messages. Please help!" },
    { title: "Smart TV setup", description: "New TV arrived but I'm lost with all the streaming apps. Netflix, Stan, the works." },
    { title: "Computer running slow", description: "My laptop takes forever to start up. Hoping someone can speed it up!" },
  ],
  "Pet Care": [
    { title: "Quick dog walk", description: "My boy Max needs a 20 min walk around the block. He's a friendly labrador!" },
    { title: "Cat feeding while away", description: "Away for the day - just need someone to feed Whiskers and check her water." },
    { title: "Puppy sit for an hour", description: "Meeting ran long - can anyone watch my pup Bella for an hour?" },
    { title: "Fish feeding", description: "On holiday next week - just need someone to feed my fish daily." },
    { title: "Dog park companion", description: "My dog Luna needs socialising - can anyone take her to the park?" },
  ],
  "Moving Help": [
    { title: "Heavy box upstairs", description: "Just one really heavy box that needs to go up to the 3rd floor. No lift!" },
    { title: "Furniture assembly", description: "IKEA bookshelf that's defeated me. Instructions included but patience required!" },
    { title: "Couch shuffle", description: "Need to move the couch to the other side of the room. Too heavy for one person." },
    { title: "Garage cleanup partner", description: "Clearing out the garage - need an extra pair of hands for the heavy stuff." },
    { title: "Books to storage", description: "Moving 5 boxes of books to storage unit. 15 min drive from here." },
  ],
  Gardening: [
    { title: "Lawn mow needed", description: "Small backyard needs mowing. I have the mower, just need the person!" },
    { title: "Plant watering while away", description: "Off for a week - can someone water my balcony plants daily?" },
    { title: "Weed removal help", description: "Garden beds have gotten away from me. Need help pulling weeds." },
    { title: "Pot plant moving", description: "Few heavy pots need relocating in the courtyard. Back's not what it used to be!" },
    { title: "Herb garden setup", description: "Want to start a small herb garden. Could use tips and help planting!" },
  ],
  Cooking: [
    { title: "Meal prep help", description: "Want to batch cook for the week. Could use a kitchen buddy!" },
    { title: "Teach me to cook pasta", description: "Embarrassingly can't make pasta from scratch. Willing to learn!" },
    { title: "Baking for a birthday", description: "Nephew's birthday coming up - need help baking a cake." },
    { title: "Healthy meal ideas", description: "Trying to eat better - could use someone to show me quick healthy recipes." },
  ],
  Shopping: [
    { title: "Grocery shop with me", description: "Feeling a bit overwhelmed shopping alone lately. Company would be lovely." },
    { title: "Clothes shopping help", description: "Need a second opinion for a job interview outfit!" },
    { title: "Market trip buddy", description: "Want to check out the weekend markets. More fun with company!" },
    { title: "Heavy shopping carried", description: "Did a big shop - need help carrying bags from car to apartment." },
  ],
  Companionship: [
    { title: "Coffee and a chat", description: "New to the area and would love to meet someone for coffee and chat." },
    { title: "Walk buddy needed", description: "Trying to be more active - looking for someone to walk with regularly." },
    { title: "Board games afternoon", description: "Have Scrabble, chess, and cards. Just need someone to play with!" },
    { title: "Watch the game together", description: "Big match on this weekend - rather not watch alone!" },
  ],
  Cleaning: [
    { title: "Deep clean help", description: "Moving out soon, need help with the deep clean for bond back." },
    { title: "Oven cleaning nightmare", description: "My oven's seen better days. Need someone who knows the tricks!" },
    { title: "Window washing", description: "Windows are filthy but I can't reach the outside ones safely." },
  ],
  Driving: [
    { title: "Airport drop-off", description: "Early morning flight, need a lift to the airport at 5am. Will pay for fuel!" },
    { title: "Furniture pickup", description: "Bought a small table on Marketplace. Need help picking it up." },
    { title: "Medical appointment lift", description: "Have a procedure that means I can't drive home. Need a lift back." },
  ],
  DIY: [
    { title: "Picture hanging help", description: "Several frames to hang but I don't trust myself with the drill." },
    { title: "Leaky tap fix", description: "Bathroom tap won't stop dripping. Driving me mad!" },
    { title: "Door handle loose", description: "Front door handle is wobbly. Probably a simple fix but beyond me!" },
    { title: "Light bulb change", description: "High ceiling, tall ladder needed. Don't want to risk it myself." },
  ],
  Tutoring: [
    { title: "Math homework help", description: "Year 8 son struggling with algebra. Patient tutor needed!" },
    { title: "English essay review", description: "Uni essay due soon, would love a fresh pair of eyes to review it." },
    { title: "Learn basic Excel", description: "Work wants me to use spreadsheets. Have no idea where to start!" },
  ],
};

// Photo generation prompts
const PHOTO_PROMPTS = [
  { age: "25-30", gender: "woman", style: "casual, natural makeup" },
  { age: "30-35", gender: "man", style: "business casual, friendly" },
  { age: "35-40", gender: "woman", style: "professional, warm smile" },
  { age: "40-45", gender: "man", style: "casual, approachable" },
  { age: "45-50", gender: "woman", style: "elegant, natural" },
  { age: "50-55", gender: "man", style: "distinguished, friendly" },
  { age: "55-60", gender: "woman", style: "warm, motherly" },
  { age: "60-65", gender: "man", style: "kind, grandfatherly" },
  { age: "25-30", gender: "man", style: "athletic, energetic" },
  { age: "30-35", gender: "woman", style: "creative, artistic" },
];

const ETHNICITIES = {
  sydney: ["European Australian", "East Asian", "South Asian", "Middle Eastern", "Southeast Asian", "Mediterranean"],
  new_york: ["European American", "African American", "Latino/Hispanic", "East Asian", "South Asian", "Mediterranean"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch neighbourhood coordinates for location-aware task creation
    const { data: neighbourhoodData } = await supabase
      .from("neighbourhoods")
      .select("name, city, latitude, longitude");
    
    const neighbourhoodCoords: Record<string, { lat: number; lng: number }> = {};
    (neighbourhoodData || []).forEach((n: { city?: string; name?: string; latitude?: number; longitude?: number }) => {
      if (n.latitude && n.longitude && n.city && n.name) {
        neighbourhoodCoords[`${n.city}:${n.name}`] = { lat: n.latitude, lng: n.longitude };
      }
    });

    const { action, count = 200, generatePhotos = true } = await req.json();

    if (action === "cleanup") {
      // Delete existing demo data
      console.log("Cleaning up existing demo data...");
      
      // Get demo profile IDs
      const { data: demoProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_demo", true);
      
      const demoIds = demoProfiles?.map(p => p.id) || [];
      
      if (demoIds.length > 0) {
        // Delete tasks owned by demo users
        await supabase.from("tasks").delete().in("owner_id", demoIds);
        // Delete demo photos (by profile_id since demo users have no user_id)
        await supabase.from("user_photos").delete().in("profile_id", demoIds);
        // Delete demo profiles
        await supabase.from("profiles").delete().eq("is_demo", true);
      }
      
      return new Response(
        JSON.stringify({ success: true, deleted: demoIds.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action !== "generate") {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'generate' or 'cleanup'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting demo user generation: ${count} users`);
    const halfCount = Math.floor(count / 2);
    
    const results = {
      profilesCreated: 0,
      photosGenerated: 0,
      tasksCreated: 0,
      errors: [] as string[],
    };

    // Generate users for each city
    for (const city of ["sydney", "new_york"] as const) {
      const names = city === "sydney" ? SYDNEY_NAMES : NEW_YORK_NAMES;
      const neighbourhoods = city === "sydney" ? SYDNEY_NEIGHBOURHOODS : NEW_YORK_NEIGHBOURHOODS;
      const cityEthnicities = ETHNICITIES[city];

      for (let i = 0; i < halfCount; i++) {
        try {
          // Pick random attributes
          const name = names[i % names.length];
          const neighbourhood = neighbourhoods[Math.floor(Math.random() * neighbourhoods.length)];
          const numSkills = 2 + Math.floor(Math.random() * 3); // 2-4 skills
          const shuffledSkills = [...SKILLS].sort(() => Math.random() - 0.5);
          const userSkills = shuffledSkills.slice(0, numSkills);
          
          const trustTier = Math.random() > 0.4 ? "tier_2" : "tier_1";
          const tasksCompleted = 5 + Math.floor(Math.random() * 45); // 5-50
          const reliabilityScore = 4.2 + (Math.random() * 0.8); // 4.2-5.0
          
          const displayName = `${name.first} ${name.last.charAt(0)}.`;

          // Create profile
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .insert({
              display_name: displayName,
              city,
              neighbourhood,
              skills: userSkills,
              trust_tier: trustTier,
              tasks_completed: tasksCompleted,
              reliability_score: parseFloat(reliabilityScore.toFixed(1)),
              radius: 5 + Math.floor(Math.random() * 10), // 5-15 min walk
              credits: 10 + Math.floor(Math.random() * 40), // 10-50 credits
              availability: ["now", "later", "this-week"][Math.floor(Math.random() * 3)],
              is_demo: true,
            })
            .select()
            .single();

          if (profileError) {
            console.error("Profile creation error:", profileError);
            results.errors.push(`Profile ${displayName}: ${profileError.message}`);
            continue;
          }

          results.profilesCreated++;
          console.log(`Created profile ${results.profilesCreated}/${count}: ${displayName} in ${neighbourhood}`);

          // Generate AI photo if enabled and API key available
          if (generatePhotos && lovableApiKey) {
            try {
              const photoStyle = PHOTO_PROMPTS[Math.floor(Math.random() * PHOTO_PROMPTS.length)];
              const ethnicity = cityEthnicities[Math.floor(Math.random() * cityEthnicities.length)];
              
              const photoPrompt = `Generate a friendly, natural headshot portrait photo of a ${photoStyle.age} year old ${ethnicity} ${photoStyle.gender}. ${photoStyle.style}. Looking at camera with genuine warm smile. Soft natural lighting. Suitable for a community help app profile picture. No text or watermarks. Photorealistic.`;

              const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${lovableApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-image-preview",
                  messages: [{ role: "user", content: photoPrompt }],
                  modalities: ["image", "text"],
                }),
              });

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
                
                if (imageUrl && imageUrl.startsWith("data:image")) {
                  // Extract base64 data and upload to storage
                  const base64Data = imageUrl.split(",")[1];
                  const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                  
                  const fileName = `${profile.id}/profile.png`;
                  
                  const { error: uploadError } = await supabase.storage
                    .from("profile-photos")
                    .upload(fileName, imageBuffer, {
                      contentType: "image/png",
                      upsert: true,
                    });

                  if (!uploadError) {
                    const { data: urlData } = supabase.storage
                      .from("profile-photos")
                      .getPublicUrl(fileName);

                    // Record in user_photos table using profile_id (demo users have no user_id)
                    await supabase.from("user_photos").insert({
                      profile_id: profile.id,
                      photo_type: "profile",
                      photo_url: urlData.publicUrl,
                    });

                    results.photosGenerated++;
                    console.log(`Generated photo for ${displayName}`);
                  }
                }
              }
            } catch (photoError) {
              console.error("Photo generation error:", photoError);
              // Continue without photo
            }
          }

          // Generate tasks for this user (variable: 0-3 open tasks)
          const numOpenTasks = Math.floor(Math.random() * 4); // 0-3
          
          for (let t = 0; t < numOpenTasks; t++) {
            const category = userSkills[Math.floor(Math.random() * userSkills.length)];
            const templates = TASK_TEMPLATES[category as keyof typeof TASK_TEMPLATES] || TASK_TEMPLATES.Errands;
            const template = templates[Math.floor(Math.random() * templates.length)];
            
            // Make task neighbourhood-aware
            let description = template.description;
            if (Math.random() > 0.5) {
              description = description.replace(
                /the shop|the store|down the road|nearby/i,
                `in ${neighbourhood}`
              );
            }

            const urgency = Math.random() > 0.8 ? "urgent" : "normal";
            const timeEstimates = ["15 min", "30 min", "1 hour", "2 hours"];
            const physicalLevels = ["light", "light", "moderate", "heavy"];
            const availabilityTimes = [
              "Flexible",
              "This morning",
              "This afternoon",
              "Before 5pm",
              "After work hours",
              "This weekend",
              "Tomorrow",
            ];

            // Get coordinates for task location (with slight random offset)
            const coordKey = `${city}:${neighbourhood}`;
            const coords = neighbourhoodCoords[coordKey];
            const locationLat = coords ? coords.lat + (Math.random() - 0.5) * 0.004 : null; // ~200m offset
            const locationLng = coords ? coords.lng + (Math.random() - 0.5) * 0.004 : null;

            const { error: taskError } = await supabase.from("tasks").insert({
              owner_id: profile.id,
              title: template.title,
              description,
              original_description: description,
              category,
              urgency,
              status: "open",
              time_estimate: timeEstimates[Math.floor(Math.random() * timeEstimates.length)],
              physical_level: physicalLevels[Math.floor(Math.random() * physicalLevels.length)],
              availability_time: availabilityTimes[Math.floor(Math.random() * availabilityTimes.length)],
              people_needed: Math.random() > 0.9 ? 2 : 1,
              approx_address: neighbourhood,
              location_lat: locationLat,
              location_lng: locationLng,
            });

            if (!taskError) {
              results.tasksCreated++;
            }
          }

          // Small delay to avoid rate limiting
          if (generatePhotos && lovableApiKey && (i + 1) % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (userError) {
          console.error("User generation error:", userError);
          results.errors.push(`User generation error: ${userError}`);
        }
      }
    }

    console.log("Demo generation complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Seed error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
