# Swaami AI Guidelines

## Overview

This document defines how AI (LLM) is used in Swaami, including prompt standards, quality guardrails, and integration patterns.

## AI Provider

**Lovable AI Gateway** (auto-provisioned)
- Endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Model: `google/gemini-2.5-flash` (default)
- API Key: `LOVABLE_API_KEY` (auto-configured)

## Current AI Functions

### 1. rewrite-need

**Purpose**: Transform informal task descriptions into structured, clear posts.

**Input**:
```json
{
  "description": "raw user text",
  "type": "rewrite"
}
```

**Output Schema**:
```json
{
  "title": "string (max 50 chars)",
  "description": "string (helpful details)",
  "time_estimate": "string (max 45 mins)",
  "category": "groceries|tech|transport|cooking|pets|handyman|childcare|language|medical|garden|other",
  "urgency": "urgent|normal|flexible",
  "safety_note": "string or null"
}
```

### 2. generate (sample needs)

**Purpose**: Generate realistic sample tasks for demo/empty states.

**Output**: Array of 3-5 sample needs with same schema as rewrite.

## Prompt Engineering Standards

### System Prompt Structure

```
1. Role definition (who the AI is)
2. Context (what app, what purpose)
3. Specific instructions (numbered list)
4. Constraints (what NOT to do)
5. Output format (exact JSON structure)
```

### Quality Guardrails

Every AI prompt MUST include these instructions:

```
Quality Standards:
1. GROUNDED: Every output must tie directly to the user's input. 
   If information is missing, indicate it—don't invent.

2. ACTIONABLE: The output must be immediately usable. 
   No vague suggestions like "communicate more."

3. SPECIFIC: Reference exact details from the input.
   "Your request for grocery pickup" not "your request."

4. SAFE: Include safety considerations for in-person meetings.
   Suggest public places, daylight hours, etc.

5. CONCISE: Micro-tasks mean micro-descriptions.
   Keep titles under 50 chars, descriptions under 200.
```

### Anti-Patterns to Block

```
DO NOT:
- Generate generic advice ("be flexible", "communicate clearly")
- Invent details not in the original request
- Suggest tasks longer than 45 minutes
- Ignore safety considerations
- Use corporate/formal language
- Add unnecessary complexity
```

## Content Safety

### Pre-AI Check

Before any AI call, run content safety filter:

```typescript
const BLOCKED_PATTERNS = [
  /drugs?|cocaine|heroin|meth/i,
  /gun|weapon|knife|firearm/i,
  /escort|intimate|sexual/i,
  /password|credit card|ssn/i,
  /hurt|attack|revenge|stalk/i,
];

function checkContentSafety(content: string): { safe: boolean; reason?: string }
```

### Post-AI Validation

After receiving AI response:
1. Parse JSON strictly (reject malformed)
2. Validate against expected schema
3. Check time_estimate <= 45 mins
4. Verify category is in allowed list
5. Ensure no blocked content in output

## Logging Standards

Every AI call MUST log:

```typescript
// Before call
console.log(`[${requestId}] AI_CALL_START`, {
  type: "rewrite" | "generate",
  inputLength: description?.length,
  hasContext: !!userContext,
});

// After call
console.log(`[${requestId}] AI_CALL_COMPLETE`, {
  success: true,
  responseLength: content?.length,
  latencyMs: endTime - startTime,
  model: "google/gemini-2.5-flash",
});

// On error
console.error(`[${requestId}] AI_CALL_ERROR`, {
  status: response.status,
  error: errorText,
});
```

## Future Enhancements

### Context-Aware Prompts

When profile context is available:

```typescript
const userContext = {
  trustTier: profile.trust_tier,
  pastCategories: ["tech", "groceries"], // from past tasks
  reliabilityScore: 4.8,
  neighbourhood: "Surry Hills",
};

// Enhance prompt with context
systemPrompt += `
The user is a ${userContext.trustTier} neighbor in ${userContext.neighbourhood}.
They have previously helped with: ${userContext.pastCategories.join(", ")}.
Reliability: ${userContext.reliabilityScore}/5.
Consider this context when enhancing their post.
`;
```

### Response Insights

Future schema additions:

```json
{
  "title": "...",
  "description": "...",
  // ... standard fields ...
  
  "quality_checks": {
    "grounded": true,
    "actionable": true,
    "specific": true
  },
  "surprise_or_tension": "Note: This request for tech help mentions urgency—ensure availability.",
  "suggested_improvements": "Consider adding preferred time window."
}
```

### Standard LLM Modes

Define reusable prompt templates:

| Mode | Input | Output | Use Case |
|------|-------|--------|----------|
| `task_enhancer` | Raw description | Structured task | Posting needs |
| `sample_generator` | None | Array of samples | Empty states |
| `profile_summarizer` | Verifications, tasks | Profile summary | Trust display |
| `match_suggester` | Task + helpers | Ranked matches | Smart matching |

## Rate Limits & Error Handling

### Rate Limits
- 429: "Rate limit exceeded. Please try again later."
- 402: "AI credits exhausted. Please add credits."

### Graceful Degradation

If AI fails, fall back to:
```typescript
const fallback = {
  title: description.slice(0, 50),
  description: description,
  time_estimate: "30 mins",
  category: "other",
  urgency: "normal",
  safety_note: null,
};
```

## Security Considerations

1. **Never log full AI responses** in production (may contain PII)
2. **Validate all AI outputs** before database writes
3. **Rate limit AI calls** per user/session
4. **Monitor for prompt injection** in user inputs
5. **Keep API key server-side only** (edge functions)
