# Swaami Data Flow Documentation

## Overview

This document maps all data flows in Swaami, from user input to database storage to AI processing and back to UI.

## Core Data Entities

```
profiles ──┬── tasks (owner_id)
           │
           ├── matches (helper_id)
           │
           ├── messages (sender_id)
           │
           ├── user_verifications (user_id)
           │
           ├── user_photos (user_id)
           │
           ├── social_connections (user_id)
           │
           └── endorsements (endorser_id / endorsed_id)
```

## Flow 1: User Onboarding

```
User Input          → Validation      → Database         → Response
─────────────────────────────────────────────────────────────────────
Email/Password      → Zod schema      → auth.users       → JWT token
                    → checkEmail()    → profiles (auto)  → Profile created
                                      ↳ trigger: handle_new_user

Display Name        → sanitizeText()  → profiles.display_name
City                → validateCity()  → profiles.city
Neighbourhood       → validateHood()  → profiles.neighbourhood
Phone (optional)    → E.164 format    → profiles.phone
```

### Verification Flow

```
Step 1: Email
  ├── Sign up → auth.users.email_confirmed_at
  └── Auto-insert → user_verifications(email)

Step 2: Phone (SMS or WhatsApp)
  ├── Request OTP → send-phone-otp edge function → Twilio
  ├── Verify OTP → Validate stored code
  └── Success → user_verifications(phone_sms | phone_whatsapp)

Step 3: Social Connect
  ├── OAuth flow → social_connections
  └── Success → user_verifications(social_google | social_apple)

Step 4: Photos
  ├── Upload → profile-photos bucket
  ├── Store URL → user_photos
  └── All 3 uploaded → user_verifications(photos_complete)

Step 5: Endorsement
  ├── Receive link → manage-endorsement (accept)
  └── Accept → user_verifications(endorsement)

Step 6: MFA
  └── Enable → user_verifications(mfa_enabled)

Trust Tier Calculation:
  trigger_recalculate_trust_tier() → calculate_trust_tier() → profiles.trust_tier
```

## Flow 2: Posting a Need

```
User Input              → AI Processing        → Database          → Realtime
─────────────────────────────────────────────────────────────────────────────────
Raw description         → Content safety check → (blocked if unsafe)
                        ↓
                        → rewrite-need function
                        ↓
                        → Lovable AI Gateway
                        ↓
                        → Structured response:
                          {
                            title,
                            description,
                            time_estimate,
                            category,
                            urgency,
                            safety_note
                          }
                        ↓
User confirms           → tasks.insert()       → tasks table        → supabase_realtime
                                               → task linked to
                                                 owner_id (profile)
```

### AI Enhancement Details

```
Input Context (sent to AI):
├── Raw user description
├── App context (neighborhood help, <45 min)
└── Category list

AI Output Schema:
├── title: string (max 50 chars)
├── description: string (helpful details)
├── time_estimate: string (max 45 mins)
├── category: enum
├── urgency: "urgent" | "normal" | "flexible"
└── safety_note: string | null

Quality Guardrails:
├── No generic advice
├── Tie to specific input
├── Clear actionable output
└── Safety-conscious suggestions
```

## Flow 3: Helping with a Task

```
Helper Action           → Database              → Notifications
───────────────────────────────────────────────────────────────
View feed               → tasks.select()
                        → filter by:
                          - neighbourhood proximity
                          - radius preference
                          - status = 'open'

Offer to help           → matches.insert()      → Realtime to owner
                        → status = 'pending'

Owner accepts           → matches.update()      → Realtime to helper
                        → status = 'accepted'
                        → tasks.status = 'matched'

Chat begins             → messages.insert()     → Realtime to both
                        → linked to match_id

Task completed          → tasks.status = 'completed'
                        → profiles.tasks_completed++
                        → profiles.credits adjusted
```

## Flow 4: Phone Verification (OTP)

```
Request                 → Edge Function         → External Service  → Storage
───────────────────────────────────────────────────────────────────────────────
Phone number            → send-phone-otp
+ channel (sms/wa)      ↓
                        → Validate E.164 format
                        ↓
                        → Generate 6-digit OTP
                        ↓
                        → Store in memory:
                          {
                            code,
                            expiresAt (5 min),
                            channel
                          }
                        ↓
                        → Call Twilio API       → SMS/WhatsApp sent
                        ↓
                        → Return success

Verify:
OTP code                → send-phone-otp (verify)
                        ↓
                        → Check stored code
                        → Validate expiry
                        → Match code
                        ↓
                        → Return verified + channel
```

## Flow 5: Endorsement System

```
Endorser (Tier 1+)      → Edge Function         → Database
───────────────────────────────────────────────────────────────
Generate link           → manage-endorsement
                        ↓
                        → Check tier >= 1
                        → Check count < 5
                        ↓
                        → endorsements.insert()
                          {
                            endorser_id,
                            token,
                            status: 'pending',
                            expires_at: +7 days
                          }
                        ↓
                        → Return shareable link

Endorsed User:
Accept link             → manage-endorsement (accept)
                        ↓
                        → Validate token
                        → Check not expired
                        → Check not self
                        → Check no existing endorsement
                        ↓
                        → endorsements.update()
                          {
                            endorsed_id,
                            status: 'accepted',
                            accepted_at
                          }
                        ↓
                        → user_verifications.insert(endorsement)
                        ↓
                        → Triggers trust tier recalculation
```

## Data Persistence Rules

### Always Store
- Raw user input (original_description in tasks)
- Timestamps (created_at, updated_at)
- Foreign key references (user_id, profile_id)
- Verification metadata (method, timestamp)

### Never Store
- Passwords (handled by Supabase Auth)
- Full OTP codes in database (in-memory only)
- Unvalidated external data
- PII in logs

### Soft Deletes
- Not currently implemented
- Recommended for: tasks, matches, endorsements
- Implementation: Add `deleted_at` column, filter in queries

## Future Recommendations

### Events Table (Not Yet Implemented)
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles,
  session_id TEXT,
  event_type TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ
);
```

### Insights Table (Not Yet Implemented)
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles,
  source_event_id UUID,
  dimension TEXT,
  score NUMERIC,
  label TEXT,
  llm_summary TEXT,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ
);
```

These would enable:
- Historical context for AI calls
- Profile-level scoring across interactions
- "Read before think" pattern for LLM
