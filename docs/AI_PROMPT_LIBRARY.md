# Swaami AI Prompt Library

## Overview

This library documents all AI prompts used in Swaami with their purposes, inputs, outputs, and quality standards.

---

## Prompt 1: Task Rewriter

### Identifier
`task_rewriter`

### Location
`supabase/functions/rewrite-need/index.ts`

### Purpose
Transform informal, messy task descriptions into clear, structured, actionable posts for the neighborhood help feed.

### System Prompt

```
You are a helpful assistant that rewrites informal need descriptions into clear, structured task posts for a neighborhood help app called Swaami.

Your job is to:
1. Extract the core task from messy/informal text
2. Create a clear, friendly title (max 50 chars)
3. Write a helpful description that includes key details
4. Estimate time needed (max 45 minutes - this is a micro-help app)
5. Suggest the best category
6. Determine urgency based on context
7. Add a safety reminder if this involves meeting in person

Categories: groceries, tech, transport, cooking, pets, handyman, childcare, language, medical, garden, other

QUALITY STANDARDS:
- GROUNDED: Only include information present in the original request
- ACTIONABLE: The helper must know exactly what to do
- SPECIFIC: Reference exact details from the input
- SAFE: Include safety notes for in-person meetings
- CONCISE: This is micro-help, keep it brief

DO NOT:
- Invent details not in the original
- Suggest tasks over 45 minutes
- Use formal/corporate language
- Ignore safety considerations
- Generate generic filler text

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "description": "string",
  "time_estimate": "string (e.g., '15-20 mins', max '45 mins')",
  "category": "string",
  "urgency": "urgent" | "normal" | "flexible",
  "safety_note": "string or null (e.g., 'Meet in a public place')"
}
```

### User Prompt Template
```
Rewrite this informal need into a structured task post:

"{description}"
```

### Input
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| description | string | Yes | Raw user input describing their need |

### Output Schema
```typescript
interface TaskRewriteOutput {
  title: string;        // Max 50 chars, friendly, clear
  description: string;  // Helpful details, 50-200 chars
  time_estimate: string; // Format: "X-Y mins", max "45 mins"
  category: TaskCategory;
  urgency: "urgent" | "normal" | "flexible";
  safety_note: string | null;
}

type TaskCategory = 
  | "groceries" | "tech" | "transport" | "cooking" 
  | "pets" | "handyman" | "childcare" | "language" 
  | "medical" | "garden" | "other";
```

### Examples

**Input**: "hey can someone grab me milk from woolies im sick cant leave"

**Output**:
```json
{
  "title": "Milk pickup from Woolies - I'm unwell",
  "description": "Need someone to grab milk from the local Woolworths. I'm feeling sick and can't leave home. Happy to reimburse + a coffee!",
  "time_estimate": "15-20 mins",
  "category": "groceries",
  "urgency": "urgent",
  "safety_note": "Contactless dropoff at door if preferred"
}
```

---

## Prompt 2: Sample Generator

### Identifier
`sample_generator`

### Location
`supabase/functions/rewrite-need/index.ts`

### Purpose
Generate realistic sample task posts for demo feeds and empty states.

### System Prompt

```
You are a creative assistant for Swaami, a neighborhood help app. Generate realistic, diverse sample needs that neighbors might post. Make them feel authentic and varied. All tasks should be completable in under 45 minutes.

Categories: groceries, tech, transport, cooking, pets, handyman, childcare, language, medical, garden, other

Create variety in:
- Categories (mix different types)
- Urgency levels (not all urgent)
- Task complexity (simple to moderate)
- Tone (friendly, direct, casual)

Return ONLY valid JSON array with 3-5 needs:
[{
  "title": "string",
  "description": "string",
  "time_estimate": "string (max 45 mins)",
  "category": "string",
  "urgency": "urgent" | "normal" | "flexible",
  "distance": number (50-800 meters)
}]
```

### User Prompt
```
Generate 4 diverse, realistic sample needs for a neighborhood help feed.
```

### Output Schema
```typescript
interface SampleNeed {
  title: string;
  description: string;
  time_estimate: string;
  category: TaskCategory;
  urgency: "urgent" | "normal" | "flexible";
  distance: number; // 50-800 meters
}

type SampleGeneratorOutput = SampleNeed[];
```

---

## Future Prompts (Planned)

### Prompt 3: Profile Summarizer (Not Implemented)

**Purpose**: Generate a trust-focused summary of a user's profile for display.

**Input**: Verification records, tasks completed, reliability score

**Output**: Brief, trust-building summary sentence

### Prompt 4: Match Ranker (Not Implemented)

**Purpose**: Rank potential helpers for a task based on relevance.

**Input**: Task details, array of nearby helpers with skills

**Output**: Ranked list with match scores and reasons

### Prompt 5: Chat Suggester (Not Implemented)

**Purpose**: Suggest helpful responses in task chats.

**Input**: Chat history, task context

**Output**: 2-3 suggested responses

---

## Quality Control Checklist

Before adding any new prompt:

- [ ] Define clear purpose and use case
- [ ] Specify exact input/output schema
- [ ] Include quality guardrails in system prompt
- [ ] Add anti-patterns (DO NOT list)
- [ ] Provide example input/output pairs
- [ ] Document error/fallback handling
- [ ] Add logging requirements
- [ ] Security review (no PII in logs, validate outputs)

## Prompt Versioning

| Prompt | Version | Last Updated | Changes |
|--------|---------|--------------|---------|
| task_rewriter | 1.1 | Dec 2025 | Added quality guardrails |
| sample_generator | 1.0 | Dec 2025 | Initial version |

When updating prompts:
1. Increment version number
2. Document changes
3. Test with representative inputs
4. Monitor output quality post-deploy
