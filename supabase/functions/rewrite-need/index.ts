import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Content safety patterns - block unsafe content
const BLOCKED_PATTERNS = [
  /\b(drugs?|cocaine|heroin|meth|weed|marijuana|pills|substances?)\b/i,
  /\b(gun|weapon|knife|firearm|ammunition)\b/i,
  /\b(escort|massage.*special|happy ending|intimate)\b/i,
  /\b(package.*midnight|pickup.*cash|no questions|discreet.*delivery)\b/i,
  /\b(password|credit card|bank account|social security|ssn)\b/i,
  /\b(hurt|attack|revenge|stalk|spy on|follow someone)\b/i,
];

function checkContentSafety(content: string): { safe: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      console.log(`[SAFETY] Blocked content pattern matched: ${pattern}`);
      return {
        safe: false,
        reason: "This content contains prohibited terms and cannot be posted.",
      };
    }
  }
  return { safe: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Incoming request`);

  try {
    const { description, type = "rewrite" } = await req.json();
    console.log(`[${requestId}] Type: ${type}, Description length: ${description?.length ?? 0}`);

    // Content safety check for rewrite requests
    if (type === "rewrite" && description) {
      const safetyCheck = checkContentSafety(description);
      if (!safetyCheck.safe) {
        console.log(`[${requestId}] Content rejected by safety filter`);
        return new Response(JSON.stringify({ 
          rejected: true, 
          reason: safetyCheck.reason 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error(`[${requestId}] LOVABLE_API_KEY is not configured`);
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
4. Estimate time needed (max 45 minutes - this is a micro-help app)
5. Suggest the best category
6. Determine urgency based on context
7. Add a safety reminder if this involves meeting in person

Categories: groceries, tech, transport, cooking, pets, handyman, childcare, language, medical, garden, other

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "description": "string",
  "time_estimate": "string (e.g., '15-20 mins', max '45 mins')",
  "category": "string",
  "urgency": "urgent" | "normal" | "flexible",
  "safety_note": "string or null (e.g., 'Meet in a public place')"
}`;
      userPrompt = `Rewrite this informal need into a structured task post:\n\n"${description}"`;
    } else if (type === "generate") {
      systemPrompt = `You are a creative assistant for Swaami, a neighborhood help app. Generate realistic, diverse sample needs that neighbors might post. Make them feel authentic and varied. All tasks should be completable in under 45 minutes.

Categories: groceries, tech, transport, cooking, pets, handyman, childcare, language, medical, garden, other

Return ONLY valid JSON array with 3-5 needs:
[{
  "title": "string",
  "description": "string",
  "time_estimate": "string (max 45 mins)",
  "category": "string",
  "urgency": "urgent" | "normal" | "flexible",
  "distance": number (50-800 meters)
}]`;
      userPrompt = "Generate 4 diverse, realistic sample needs for a neighborhood help feed.";
    }

    console.log(`[${requestId}] Calling AI gateway`);

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
      console.error(`[${requestId}] AI gateway error: ${response.status}`, errorText);
      
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
    
    console.log(`[${requestId}] AI response received, length: ${content?.length ?? 0}`);

    // Parse the JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[${requestId}] Could not parse AI response as JSON`);
      throw new Error("Could not parse AI response as JSON");
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log(`[${requestId}] Successfully parsed result`);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[requestId] Error:`, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
