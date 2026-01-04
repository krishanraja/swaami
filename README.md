# Swaami

**Hyper-local neighbourhood help network**

Build stronger communities by connecting neighbours who need help with those who can give it.

## 🌟 Features

- **AI-Enhanced Task Posting** - Describe your need naturally, AI structures it perfectly
- **Verified Neighbours** - Trust tiers from phone, social, and endorsement verification
- **Real-time Matching** - Instant notifications when someone offers to help
- **Walking Distance Focus** - 500m default radius keeps it truly local
- **Credit System** - Help others, earn credits, get help back
- **Person Details Drawer** - See detailed profiles before committing to help

## 🛡️ Security & Quality

- ✅ All ESLint errors resolved
- ✅ TypeScript strict mode
- ✅ Content safety filtering
- ✅ Input validation with Zod
- ✅ Row Level Security on all tables
- ✅ Accessibility (ARIA) compliant
- ✅ Offline-aware with graceful degradation
- ✅ Race condition prevention (atomic operations)
- ✅ Dead end elimination (loader timeouts)

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **AI**: Google AI (Gemini) / OpenAI
- **Payments**: Stripe
- **Deployment**: Vercel (frontend) + Supabase (backend)

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── onboarding/ # Onboarding flow components
│   ├── trust/      # Verification & trust components
│   └── ui/         # shadcn/ui components
├── contexts/       # React contexts (Accessibility)
├── data/           # Static data (blog posts)
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client
├── lib/            # Utilities (logger, validation, safety, stateMachine)
├── pages/          # Route pages
├── screens/        # Main screen components
├── types/          # TypeScript definitions
└── utils/          # Additional utilities

supabase/
├── functions/      # Edge functions
├── migrations/     # Database migrations
└── email-templates/# Email templates

docs/
├── ARCHITECTURE.md    # System design & database schema
├── AUDIT_STATUS.md    # Security & UX audit tracking
├── DESIGN_SYSTEM.md   # Visual design guidelines
├── FEATURES.md        # Feature documentation
├── HISTORY.md         # Changelog
├── MASTER_INSTRUCTIONS.md  # Development guidelines
├── PURPOSE.md         # Mission & values
└── [...]              # Additional documentation
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## 🔒 Environment Variables

Required in `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Note**: `VITE_SUPABASE_PUBLISHABLE_KEY` is the anon/public key from Supabase Dashboard → Settings → API. This is safe to expose in client-side code.

See `.env.example` for the correct format.

### Edge Function Secrets

Set in Supabase Dashboard → Edge Functions → Secrets:

**Auto-Provided (No Action Needed):**
- `SUPABASE_URL` - Automatically available
- `SUPABASE_ANON_KEY` - Automatically available
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically available

**Manual Configuration Required:**
- `STRIPE_SECRET_KEY` - For subscription payments (get from Stripe Dashboard → Developers → API keys)
- `TWILIO_ACCOUNT_SID` - For phone verification
- `TWILIO_AUTH_TOKEN` - For phone verification
- `TWILIO_PHONE_NUMBER` - For phone verification
- `OPENAI_API_KEY` - Optional, for AI features
- `GOOGLE_AI_API_KEY` - Optional, for AI features
- `RESEND_API_KEY` - Optional, for email sending

⚠️ **Security**: Never commit API keys to git. Only set them in Supabase secrets.

## ✉️ Email Verification

Swaami uses Supabase Auth for email verification with a beautifully branded email template. 

**Setup Required**: 
1. Copy the email template from `supabase/email-templates/confirm-signup.html`
2. Paste it into Supabase Dashboard → Authentication → Email Templates → "Confirm signup"
3. Configure redirect URLs in Authentication → URL Configuration

See [Email Verification Setup Guide](docs/EMAIL_VERIFICATION_SETUP.md) for detailed instructions.

## 📖 Documentation

See the `/docs` folder for detailed documentation:

### Core Documentation
- [Architecture](docs/ARCHITECTURE.md) - System design & database schema
- [Design System](docs/DESIGN_SYSTEM.md) - Visual guidelines
- [Features](docs/FEATURES.md) - Feature list & status
- [Purpose](docs/PURPOSE.md) - Mission & values
- [Master Instructions](docs/MASTER_INSTRUCTIONS.md) - Development guidelines

### Setup & Deployment
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment instructions
- [Environment Setup](docs/ENV_SETUP.md) - Environment configuration
- [Stripe Setup](docs/STRIPE_SETUP.md) - Payment integration
- [Email Verification Setup](docs/EMAIL_VERIFICATION_SETUP.md) - Email configuration

### Audit & Status
- [Audit Status](docs/AUDIT_STATUS.md) - Security & quality status
- [Audit Summary](docs/AUDIT_SUMMARY.md) - Adversarial audit findings
- [History](docs/HISTORY.md) - Changelog

### Troubleshooting
- [Common Issues](docs/COMMON_ISSUES.md) - Troubleshooting guide

## 🔄 Recent Updates

**January 2025:**
- Fixed neighbourhood dropdown stuck in loading state
- Fixed authentication error message display
- Comprehensive documentation update

**December 2024:**
- Completed adversarial audit (27 failures identified, P0 fixes complete)
- Added Person Details Drawer for trust building
- Production readiness achieved

See [HISTORY.md](docs/HISTORY.md) for complete changelog.

## 🤝 Contributing

1. Read [MASTER_INSTRUCTIONS.md](docs/MASTER_INSTRUCTIONS.md)
2. Follow the coding standards
3. Run `npm run lint` before committing
4. Document changes in [HISTORY.md](docs/HISTORY.md)

## 📄 License

Private - All rights reserved
