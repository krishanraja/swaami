import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// LOGGING UTILITIES (10/10 Standard)
// ============================================================================

interface LogContext {
  [key: string]: unknown;
}

function log(requestId: string, level: "DEBUG" | "INFO" | "WARN" | "ERROR", message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
  console[level === "ERROR" ? "error" : level === "WARN" ? "warn" : "log"](
    `[${timestamp}] [${requestId}] [${level}] ${message}${contextStr}`
  );
}

// ============================================================================
// CONTENT SAFETY
// ============================================================================

const BLOCKED_PATTERNS = [
  /\b(drugs?|cocaine|heroin|meth|weed|marijuana|pills|substances?)\b/i,
  /\b(gun|weapon|knife|firearm|ammunition)\b/i,
  /\b(escort|massage.*special|happy ending|intimate)\b/i,
  /\b(package.*midnight|pickup.*cash|no questions|discreet.*delivery)\b/i,
  /\b(password|credit card|bank account|social security|ssn)\b/i,
  /\b(hurt|attack|revenge|stalk|spy on|follow someone)\b/i,
];

function checkContentSafety(content: string): { safe: boolean; reason?: string; matchedPattern?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return {
        safe: false,
        reason: "This content contains prohibited terms and cannot be posted.",
        matchedPattern: pattern.source,
      };
    }
  }
  return { safe: true };
}

// ============================================================================
// RESPONSE VALIDATION
// ============================================================================

const VALID_CATEGORIES = ["groceries", "tech", "transport", "cooking", "pets", "handyman", "childcare", "language", "medical", "garden", "other"];
const VALID_URGENCIES = ["urgent", "normal", "flexible"];
const VALID_PHYSICAL_LEVELS = ["light", "moderate", "heavy"];

interface AIResponse {
  title?: string;
  description?: string;
  time_estimate?: string;
  category?: string;
  urgency?: string;
  safety_note?: string | null;
  availability_time?: string;
  physical_level?: string;
  people_needed?: number;
  access_instructions?: string;
  clarification_needed?: {
    question: string;
    options: string[];
    field: string;
  };
}

function validateAIResponse(response: AIResponse, requestId: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // If clarification needed, that's a valid response
  if (response.clarification_needed) {
    if (!response.clarification_needed.question || !response.clarification_needed.options) {
      errors.push("Invalid clarification structure");
    }
    return { valid: errors.length === 0, errors };
  }

  if (!response.title || typeof response.title !== "string") {
    errors.push("Missing or invalid title");
  } else if (response.title.length > 60) {
    errors.push("Title exceeds 60 characters");
  }

  if (!response.description || typeof response.description !== "string") {
    errors.push("Missing or invalid description");
  }

  if (!response.time_estimate || typeof response.time_estimate !== "string") {
    errors.push("Missing or invalid time_estimate");
  }

  if (!response.category || !VALID_CATEGORIES.includes(response.category)) {
    errors.push(`Invalid category: ${response.category}`);
  }

  if (!response.urgency || !VALID_URGENCIES.includes(response.urgency)) {
    errors.push(`Invalid urgency: ${response.urgency}`);
  }

  if (response.physical_level && !VALID_PHYSICAL_LEVELS.includes(response.physical_level)) {
    response.physical_level = "light"; // Default fallback
  }

  if (errors.length > 0) {
    log(requestId, "WARN", "AI response validation failed", { errors });
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();

  // CORS preflight
  if (req.method === "OPTIONS") {
    log(requestId, "DEBUG", "CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  log(requestId, "INFO", "REQUEST_START", {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent")?.slice(0, 50),
  });

  try {
    // Parse request
    const body = await req.json();
    const { description, type = "rewrite", clarification_context } = body;

    log(requestId, "INFO", "REQUEST_PARSED", {
      type,
      descriptionLength: description?.length ?? 0,
      hasDescription: !!description,
      hasClarificationContext: !!clarification_context,
    });

    // Content safety check for rewrite requests
    if (type === "rewrite" && description) {
      const safetyCheck = checkContentSafety(description);
      
      log(requestId, "INFO", "SAFETY_CHECK", {
        safe: safetyCheck.safe,
        matchedPattern: safetyCheck.matchedPattern ?? null,
      });

      if (!safetyCheck.safe) {
        const duration = Date.now() - startTime;
        log(requestId, "WARN", "REQUEST_REJECTED_SAFETY", { duration, reason: safetyCheck.reason });
        
        return new Response(JSON.stringify({ 
          rejected: true, 
          reason: safetyCheck.reason 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      log(requestId, "ERROR", "CONFIG_ERROR", { error: "LOVABLE_API_KEY not configured" });
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    log(requestId, "DEBUG", "API_KEY_CHECK", { hasKey: true });

    // Build prompts
    let systemPrompt = "";
    let userPrompt = "";

    if (type === "rewrite") {
      systemPrompt = `You are a smart assistant that helps neighbors post clear, helpful task requests on Swaami, a neighborhood micro-help app.

Your job is to:
1. Analyze the input for COMPLETENESS - do you have enough info for a volunteer to decide if they can help?
2. If CRITICAL INFO IS MISSING, ask ONE clarifying question with quick-tap options
3. If you have enough info, create a structured task post with smart inferences

CRITICAL INFO CHECKLIST - Does the request specify:
- WHAT they need (required - if missing, you can't proceed)
- WHEN they need it (if missing, ask - timing matters for volunteers!)
- SIZE/SCOPE for physical tasks (lifting, moving, carrying - ask about size/weight if unclear)
- LOCATION context for pickup/delivery tasks (which store, how far, etc.)

SMART INFERENCE RULES - Extract these from context:
- Timing: "this arvo" → "Today afternoon", "tomorrow morning" → "Tomorrow AM", "ASAP" → "Now", "whenever" → "Flexible"
- Physical level: "carry groceries" → "light", "move furniture" → "moderate", "move couch upstairs" → "heavy"
- People needed: Single item → 1, Large furniture → 2, Moving multiple heavy items → 2-3
- Urgency: "urgent", "ASAP", "now" → "urgent", normal requests → "normal", "no rush" → "flexible"

Categories: groceries, tech, transport, cooking, pets, handyman, childcare, language, medical, garden, other

RESPONSE FORMAT:

If asking for clarification, return:
{
  "clarification_needed": {
    "question": "Clear, friendly question",
    "options": ["Option 1", "Option 2", "Option 3", "Other"],
    "field": "field_name being clarified (e.g., 'timing', 'size', 'location')"
  },
  "partial_inference": {
    "category": "inferred category",
    "physical_level": "light|moderate|heavy if applicable",
    "urgency": "inferred urgency"
  }
}

If complete, return:
{
  "title": "Clear title under 50 chars",
  "description": "Helpful description with key details, 200 chars max",
  "time_estimate": "e.g., '15-20 mins' (max 45 mins - this is micro-help)",
  "category": "one of the valid categories",
  "urgency": "urgent|normal|flexible",
  "availability_time": "When they need it (e.g., 'Now', 'Today 3-5pm', 'Tomorrow morning', 'This week - flexible')",
  "physical_level": "light|moderate|heavy",
  "people_needed": 1-3,
  "access_instructions": "Optional: How to meet/access if applicable",
  "safety_note": "Optional safety reminder for in-person meetings"
}

QUALITY RULES:
- GROUNDED: Only include info present in the request. If missing, ask or note it.
- ACTIONABLE: Volunteer must know exactly what to do.
- SPECIFIC: Reference actual details, not generic placeholders.
- NEIGHBORLY: Friendly tone, not corporate.
- ASK SMART QUESTIONS: One question at a time, with 3-4 quick-tap options.`;

      if (clarification_context) {
        // This is a follow-up after user answered a question
        userPrompt = `Original request: "${description}"

User's clarification: ${clarification_context}

Now create the complete structured task post with this additional context.`;
      } else {
        userPrompt = `Analyze this request and either ask a clarifying question if critical info is missing, or create a structured task post:

"${description}"`;
      }
    } else if (type === "generate") {
      systemPrompt = `You are a creative assistant for Swaami, a neighborhood help app. Generate realistic, diverse sample needs that neighbors might post. Make them feel authentic and varied. All tasks should be completable in under 45 minutes.

Categories: groceries, tech, transport, cooking, pets, handyman, childcare, language, medical, garden, other

Create variety in:
- Categories (mix different types)
- Urgency levels (not all urgent)
- Task complexity (simple to moderate)
- Tone (friendly, direct, casual - mix it up)

Return ONLY valid JSON array with 3-5 needs:
[{
  "title": "string",
  "description": "string",
  "time_estimate": "string (max 45 mins)",
  "category": "string",
  "urgency": "urgent" | "normal" | "flexible",
  "availability_time": "When needed",
  "physical_level": "light|moderate|heavy",
  "people_needed": 1,
  "distance": number (50-800 meters)
}]`;
      userPrompt = "Generate 4 diverse, realistic sample needs for a neighborhood help feed.";
    }

    // Call AI
    log(requestId, "INFO", "AI_CALL_START", {
      type,
      model: "google/gemini-2.5-flash",
      promptLength: systemPrompt.length + userPrompt.length,
      hasClarificationContext: !!clarification_context,
    });

    const aiStartTime = Date.now();

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

    const aiLatency = Date.now() - aiStartTime;

    if (!response.ok) {
      const errorText = await response.text();
      
      log(requestId, "ERROR", "AI_CALL_ERROR", {
        status: response.status,
        latencyMs: aiLatency,
        error: errorText.slice(0, 200),
      });
      
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

    log(requestId, "INFO", "AI_CALL_COMPLETE", {
      latencyMs: aiLatency,
      responseLength: content?.length ?? 0,
      hasContent: !!content,
    });

    // Parse JSON from response
    const jsonMatch = content?.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!jsonMatch) {
      log(requestId, "ERROR", "AI_PARSE_ERROR", { 
        error: "Could not extract JSON from AI response",
        contentPreview: content?.slice(0, 100),
      });
      throw new Error("Could not parse AI response as JSON");
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      log(requestId, "ERROR", "JSON_PARSE_ERROR", {
        error: parseError instanceof Error ? parseError.message : "Unknown parse error",
        jsonPreview: jsonMatch[0].slice(0, 100),
      });
      throw new Error("Invalid JSON in AI response");
    }

    // Validate response for rewrite type
    if (type === "rewrite" && !Array.isArray(result)) {
      const validation = validateAIResponse(result, requestId);
      if (!validation.valid) {
        log(requestId, "WARN", "AI_VALIDATION_FAILED", { errors: validation.errors });
        // Continue anyway but log the issues
      }
      
      // Apply defaults for optional fields
      if (!result.clarification_needed) {
        result.physical_level = result.physical_level || "light";
        result.people_needed = result.people_needed || 1;
        result.availability_time = result.availability_time || "Flexible";
      }
    }

    const totalDuration = Date.now() - startTime;

    log(requestId, "INFO", "REQUEST_SUCCESS", {
      type,
      totalDurationMs: totalDuration,
      aiLatencyMs: aiLatency,
      resultType: Array.isArray(result) ? "array" : "object",
      resultCount: Array.isArray(result) ? result.length : 1,
      hasClarification: !!result.clarification_needed,
    });

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;

    log(requestId, "ERROR", "REQUEST_ERROR", {
      error: message,
      stack: stack?.slice(0, 300),
      durationMs: duration,
    });

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
