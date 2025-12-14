# Swaami - Neighbourhood Micro-Help App

Swaami is a hyper-local, credit-based micro-help network that connects neighbours for small, reciprocal tasks. No money changes hands - just community credits.

## 🎯 Core Concept

- **Radius-based**: Users only see needs within their walking radius (100-2000m)
- **Credit system**: Help others to earn credits, spend credits to get help
- **Micro-tasks**: Small tasks under 45 minutes (groceries, tech help, pet sitting, etc.)
- **AI-enhanced**: Natural language task posting, automatically structured by AI

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **AI**: Lovable AI Gateway (Google Gemini 2.5 Flash)
- **State**: React Query + Zustand patterns
- **Routing**: React Router v6

## 📁 Project Structure

```
src/
├── assets/          # Static assets (logo, images)
├── components/      # Reusable UI components
│   └── ui/          # shadcn/ui base components
├── hooks/           # Custom React hooks
├── lib/             # Utilities (logger, validation, safety)
├── pages/           # Route pages
├── screens/         # Main screen components
├── types/           # TypeScript type definitions
└── integrations/    # External service integrations

supabase/
├── functions/       # Edge functions
└── migrations/      # Database migrations

docs/                # Project documentation
```

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🔐 Environment Variables

Required environment variables (auto-provided by Lovable Cloud):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## 📊 Database Tables

- `profiles` - User profiles with skills, radius, credits
- `tasks` - Help requests with AI-enhanced metadata
- `matches` - Connections between helpers and requesters
- `messages` - Chat messages within matches

See `docs/ARCHITECTURE.md` for full schema details.

## 🔗 Key Features

1. **Onboarding Flow**: Phone → OTP → Radius → Skills → Availability
2. **Feed**: Category-filtered needs within user's radius
3. **Post**: AI-enhanced task creation
4. **Chat**: Real-time messaging with task status updates
5. **Profile**: Edit settings, view stats, manage skills

## 📝 Documentation

### Core Documentation
- [Architecture](./ARCHITECTURE.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Features](./FEATURES.md)
- [Common Issues](./COMMON_ISSUES.md)
- [Decisions Log](./DECISIONS_LOG.md)

### Adversarial Audit (2024-12-14)
- **[Audit Summary](./AUDIT_SUMMARY.md)** - Executive summary and key findings
- **[System & State Map](./AUDIT_SYSTEM_STATE_MAP.md)** - Complete system mapping and state analysis
- **[UI & UX Audit](./AUDIT_UI_UX.md)** - Screen-level contracts and UX failures
- **[Data Pipeline Audit](./AUDIT_DATA_PIPELINE.md)** - Data integrity and event safety analysis
- **[AI Systems Audit](./AUDIT_AI_SYSTEMS.md)** - AI dependencies and safety analysis
- **[Failure Register](./AUDIT_FAILURE_REGISTER.md)** - Complete register of 27 identified failures
- **[Fix Prioritization](./AUDIT_FIX_PRIORITIZATION.md)** - Top 10 prioritized fixes with implementation details
