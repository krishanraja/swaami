import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, type = "rewrite" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "rewrite") {
      systemPrompt = `You are a helpful assistant that rewrites informal need descriptions into clear, structured task posts for a neighborhood help app called Swaami.

Your job is to:
1. Extract the core task from messy/informal text
2. Create a clear, friendly title (max 50 chars)
3. Write a helpful description that includes key details
4. Estimate time needed
5. Suggest the best category
6. Determine urgency based on context

Categories: groceries, tech, transport, cooking, pets, handyman, childcare, language, medical, garden, other

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "description": "string",
  "time_estimate": "string (e.g., '15-20 mins')",
  "category": "string",
  "urgency": "urgent" | "normal" | "flexible"
}`;
      userPrompt = `Rewrite this informal need into a structured task post:\n\n"${description}"`;
    } else if (type === "generate") {
      systemPrompt = `You are a creative assistant for Swaami, a neighborhood help app. Generate realistic, diverse sample needs that neighbors might post. Make them feel authentic and varied.

Categories: groceries, tech, transport, cooking, pets, handyman, childcare, language, medical, garden, other

Return ONLY valid JSON array with 3-5 needs:
[{
  "title": "string",
  "description": "string",
  "time_estimate": "string",
  "category": "string",
  "urgency": "urgent" | "normal" | "flexible",
  "distance": number (50-800 meters)
}]`;
      userPrompt = "Generate 4 diverse, realistic sample needs for a neighborhood help feed.";
    }

    console.log(`Processing ${type} request`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Parse the JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in rewrite-need function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
