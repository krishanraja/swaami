# Swaami Architecture

**Last Updated**: January 3, 2025

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
├─────────────────────────────────────────────────────────────────┤
│  Pages          │  Screens        │  Components                  │
│  - Auth         │  - Feed         │  - NeedCard                  │
│  - Index        │  - Post         │  - BottomNav                 │
│  - NotFound     │  - Chat         │  - SkillChip                 │
│  - Landing      │  - Profile      │  - RadiusSlider              │
│  - Join         │  - Join         │  - AvailabilitySelector      │
│  - FAQ          │  - ChatsList    │  - PersonDetailsDrawer       │
│  - Blog         │  - Verification │  - TierBadge                 │
│  - BlogPost     │                 │  - SplashScreen              │
│  - AdminPage    │                 │  - OfflineBanner             │
├─────────────────────────────────────────────────────────────────┤
│                        Custom Hooks                              │
│  useAuth │ useProfile │ useTasks │ useMatches │ useMessages      │
│  useTrustTier │ useSubscription │ useNetworkStatus │ useLiveActivity │
│  useNeighbourhoods │ useRetry │ useGamification │ useOnboardingStatus │
├─────────────────────────────────────────────────────────────────┤
│                        Utilities                                 │
│  logger.ts │ validation.ts │ safety.ts │ utils.ts │ seo.ts      │
│  stateMachine.ts                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (Backend)                            │
├─────────────────────────────────────────────────────────────────┤
│  Edge Functions          │  Database (PostgreSQL)               │
│  - rewrite-need          │  - profiles                          │
│  - create-checkout       │  - tasks                             │
│  - check-subscription    │  - matches                           │
│  - customer-portal       │  - messages                          │
│  - send-phone-otp        │  - user_verifications                │
│  - manage-endorsement    │  - user_photos                       │
│  - transcribe-audio      │  - social_connections                │
│  - seed-demo-users       │  - endorsements                      │
│                          │  - user_subscriptions                │
│                          │  - neighbourhoods                    │
├─────────────────────────────────────────────────────────────────┤
│  Auth Service            │  Realtime                            │
│  - Email/Password        │  - tasks subscription                │
│  - Email verification    │  - matches subscription              │
│  - JWT tokens            │  - messages subscription             │
├─────────────────────────────────────────────────────────────────┤
│  Storage                 │  Database Functions                  │
│  - profile-photos        │  - help_with_task (atomic)           │
│                          │  - calculate_trust_tier              │
│                          │  - handle_new_user trigger           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├─────────────────────────────────────────────────────────────────┤
│  Stripe            │  Twilio           │  AI Services           │
│  - Subscriptions   │  - SMS OTP        │  - Google AI (Gemini)  │
│  - Checkout        │  - WhatsApp OTP   │  - OpenAI (optional)   │
│  - Customer Portal │                   │                        │
├─────────────────────────────────────────────────────────────────┤
│  Vercel (Deployment)                                             │
│  - Frontend hosting with SPA routing                            │
│  - Environment variables                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| display_name | text | User's display name |
| phone | text | Phone number (E.164 format) |
| radius | integer | Help radius in meters (100-2000) |
| skills | text[] | Array of skill IDs |
| availability | text | 'now' \| 'later' \| 'this-week' |
| credits | integer | Current credit balance (default: 5) |
| tasks_completed | integer | Count of completed tasks |
| reliability_score | numeric | 1.0-5.0 rating |
| trust_tier | integer | 0, 1, or 2 (calculated) |
| city | text | User's city |
| neighbourhood | text | User's neighbourhood |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### tasks
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| owner_id | uuid | FK to profiles.id |
| helper_id | uuid | FK to profiles.id (nullable) |
| title | text | AI-enhanced title |
| description | text | AI-enhanced description |
| original_description | text | Original user input |
| time_estimate | text | e.g., "15-20 mins" |
| urgency | text | 'urgent' \| 'normal' \| 'flexible' |
| category | text | groceries, tech, pets, etc. |
| location_lat | numeric | Latitude (nullable) |
| location_lng | numeric | Longitude (nullable) |
| approx_address | text | Approximate location |
| status | text | 'open' \| 'matched' \| 'in-progress' \| 'completed' \| 'cancelled' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### matches
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| task_id | uuid | FK to tasks.id |
| helper_id | uuid | FK to profiles.id |
| status | text | 'pending' \| 'accepted' \| 'arrived' \| 'completed' \| 'cancelled' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraints**:
- Unique partial index prevents multiple active matches per task

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| match_id | uuid | FK to matches.id |
| sender_id | uuid | FK to profiles.id |
| content | text | Message content (sanitized) |
| created_at | timestamptz | |

### user_verifications
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to profiles.id |
| verification_type | text | email, phone_sms, phone_whatsapp, social_google, etc. |
| verified_at | timestamptz | |
| metadata | jsonb | Additional verification data |

### endorsements
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| endorser_id | uuid | FK to profiles.id |
| endorsed_id | uuid | FK to profiles.id (nullable until accepted) |
| token | text | Unique shareable token |
| status | text | 'pending' \| 'accepted' \| 'expired' \| 'revoked' |
| expires_at | timestamptz | +7 days from creation |
| accepted_at | timestamptz | |

### neighbourhoods
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| city | text | City identifier (e.g., 'sydney') |
| name | text | Neighbourhood name |
| created_at | timestamptz | |

## Data Flow

### Posting a Need
1. User enters natural language description
2. Frontend validates input (validation.ts)
3. Safety check runs (safety.ts)
4. Edge function `rewrite-need` called
5. AI enhances and structures the task
6. User confirms the preview
7. Task inserted into database
8. Realtime broadcasts to nearby users

### Helping with a Task
1. User clicks "Help" on a NeedCard
2. **Atomic operation**: `help_with_task()` database function:
   - Creates match with status "pending"
   - Updates task status to "matched"
   - Returns match ID
3. Both users redirected to ChatScreen
4. Real-time messaging begins
5. Helper can mark "Arrived" → "Completed"
6. Credits transferred on completion

### Trust Tier Calculation
```
Tier 0: New user (no verifications)
Tier 1: Phone OR social verified
Tier 2: Multiple verifications + endorsement
```

Triggered by:
- `trigger_recalculate_trust_tier()` → `calculate_trust_tier()` → `profiles.trust_tier`

## Security

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only view/modify their own data
- Tasks are visible to all authenticated users (for discovery)
- Messages only visible to match participants

### Input Validation
- All inputs validated with Zod schemas
- Content safety checks before AI processing
- Sanitization of user-generated content

### Authentication
- Email/password with email verification
- Session persisted in localStorage
- Protected routes redirect to /auth
- JWT tokens with auto-refresh

### Data Integrity
- Database constraint prevents multiple matches per task
- Atomic `help_with_task` function ensures consistency
- State machine validation prevents invalid transitions

## Error Handling

### Query Timeouts
- All queries have timeout protection
- Smart retry logic: don't retry on timeout errors
- Immediate error display after timeout

### Loader Protection
- All loaders have 10-second timeout
- Error states with retry buttons
- Dead ends eliminated

### Error Extraction
- Proper Supabase PostgrestError handling
- Readable error messages (no "[object Object]")
- Diagnostic logging for troubleshooting

## Edge Functions

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `rewrite-need` | AI task enhancement | Yes |
| `create-checkout` | Stripe checkout session | Yes |
| `check-subscription` | Check subscription status | Yes |
| `customer-portal` | Stripe billing portal | Yes |
| `send-phone-otp` | Phone verification (SMS/WhatsApp) | No |
| `manage-endorsement` | Trust endorsements | Yes |
| `transcribe-audio` | Voice-to-text | Yes |
| `seed-demo-users` | Seed demo data | No |

## Frontend Structure

```
src/
├── assets/          # Static assets (logo, images)
├── components/      # Reusable UI components
│   ├── onboarding/  # Onboarding flow components
│   ├── trust/       # Verification & trust components
│   ├── ui/          # shadcn/ui base components
│   └── dev/         # Development tools
├── contexts/        # React contexts (Accessibility)
├── data/            # Static data (blog posts)
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client
├── lib/             # Utilities
├── pages/           # Route pages
├── screens/         # Main screen components
├── types/           # TypeScript definitions
└── utils/           # Additional utilities
```

## Deployment

- **Frontend**: Vercel with SPA routing (`vercel.json`)
- **Backend**: Supabase (managed)
- **Edge Functions**: Deployed via Supabase CLI

See `docs/DEPLOYMENT.md` for detailed deployment instructions.
