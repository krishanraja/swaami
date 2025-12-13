# Swaami

**Hyper-local neighbourhood help network**

Build stronger communities by connecting neighbours who need help with those who can give it.

## 🌟 Features

- **AI-Enhanced Task Posting** - Describe your need naturally, AI structures it perfectly
- **Verified Neighbours** - Trust tiers from phone, social, and endorsement verification
- **Real-time Matching** - Instant notifications when someone offers to help
- **Walking Distance Focus** - 500m default radius keeps it truly local
- **Credit System** - Help others, earn credits, get help back

## 🛡️ Security & Quality

- ✅ All ESLint errors resolved
- ✅ TypeScript strict mode
- ✅ Content safety filtering
- ✅ Input validation with Zod
- ✅ Row Level Security on all tables
- ✅ Accessibility (ARIA) compliant
- ✅ Offline-aware with graceful degradation

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI**: Lovable AI Gateway (Gemini 2.5 Flash)
- **Deployment**: Lovable Cloud

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── onboarding/ # Onboarding flow components
│   ├── trust/      # Verification & trust components
│   └── ui/         # shadcn/ui components
├── contexts/       # React contexts (Accessibility)
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client
├── lib/            # Utilities (logger, validation, safety)
├── pages/          # Route pages
├── screens/        # Main screen components
└── types/          # TypeScript definitions

docs/
├── ARCHITECTURE.md    # System design & database schema
├── AUDIT_STATUS.md    # Security & UX audit tracking
├── DESIGN_SYSTEM.md   # Visual design guidelines
├── FEATURES.md        # Feature documentation
├── HISTORY.md         # Changelog
├── ICP.md             # Ideal customer profile
├── MASTER_INSTRUCTIONS.md  # Development guidelines
└── PURPOSE.md         # Mission & values
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
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Edge function secrets (set in Supabase):
- `LOVABLE_API_KEY` - For AI task enhancement
- `STRIPE_SECRET_KEY` - For subscription payments
- `TWILIO_*` - For phone verification

## 📖 Documentation

See the `/docs` folder for detailed documentation:

- [Architecture](docs/ARCHITECTURE.md) - System design
- [Design System](docs/DESIGN_SYSTEM.md) - Visual guidelines
- [Audit Status](docs/AUDIT_STATUS.md) - Security & quality status
- [Purpose](docs/PURPOSE.md) - Mission & values
- [SEO Strategy](docs/SEO_STRATEGY.md) - Content marketing & SEO plan

## 🤝 Contributing

1. Read [MASTER_INSTRUCTIONS.md](docs/MASTER_INSTRUCTIONS.md)
2. Follow the coding standards
3. Run `npm run lint` before committing
4. Document changes in [HISTORY.md](docs/HISTORY.md)

## 📄 License

Private - All rights reserved
