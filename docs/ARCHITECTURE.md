# Swaami Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
├─────────────────────────────────────────────────────────────────┤
│  Pages          │  Screens        │  Components                  │
│  - Auth         │  - Feed         │  - NeedCard                  │
│  - Index        │  - Post         │  - BottomNav                 │
│  - NotFound     │  - Chat         │  - SkillChip                 │
│                 │  - Profile      │  - RadiusSlider              │
│                 │  - Join         │  - AvailabilitySelector      │
│                 │  - ChatsList    │                              │
├─────────────────────────────────────────────────────────────────┤
│                        Custom Hooks                              │
│  useAuth │ useProfile │ useTasks │ useMatches │ useMessages      │
├─────────────────────────────────────────────────────────────────┤
│                        Utilities                                 │
│  logger.ts │ validation.ts │ safety.ts │ utils.ts                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lovable Cloud (Supabase)                      │
├─────────────────────────────────────────────────────────────────┤
│  Edge Functions          │  Database (PostgreSQL)               │
│  - rewrite-need          │  - profiles                          │
│    (AI task enhancement) │  - tasks                             │
│                          │  - matches                           │
│                          │  - messages                          │
├─────────────────────────────────────────────────────────────────┤
│  Auth Service            │  Realtime                            │
│  - Email/Password        │  - tasks subscription                │
│  - Auto-confirm          │  - matches subscription              │
│                          │  - messages subscription             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lovable AI Gateway                            │
│  Model: google/gemini-2.5-flash                                  │
│  Purpose: Task description enhancement and structuring           │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| display_name | text | User's display name |
| phone | text | Phone number |
| radius | integer | Help radius in meters (100-2000) |
| skills | text[] | Array of skill IDs |
| availability | text | 'now' \| 'later' \| 'this-week' |
| credits | integer | Current credit balance (default: 5) |
| tasks_completed | integer | Count of completed tasks |
| reliability_score | numeric | 1.0-5.0 rating |
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

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| match_id | uuid | FK to matches.id |
| sender_id | uuid | FK to profiles.id |
| content | text | Message content |
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
2. Match created with status "pending"
3. Both users redirected to ChatScreen
4. Real-time messaging begins
5. Helper can mark "Arrived" → "Completed"
6. Credits transferred on completion

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
- Email/password with auto-confirm
- Session persisted in localStorage
- Protected routes redirect to /auth
