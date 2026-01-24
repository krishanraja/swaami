# Swaami Project Instructions

**Master Index and Quick Reference**

**Last Updated**: January 27, 2025  
**Version**: 1.0.0

## Quick Navigation

| Document | Purpose | Status |
|----------|---------|--------|
| [PURPOSE.md](./PURPOSE.md) | What the tool is and is not, core problem statement, target audiences | ✅ Current |
| [ICP.md](./ICP.md) | Ideal customer profiles with demographics, pain points, buying triggers | ✅ Current |
| [VALUE_PROP.md](./VALUE_PROP.md) | Value propositions per audience, differentiation, jobs-to-be-done | ✅ Current |
| [OUTCOMES.md](./OUTCOMES.md) | Expected user outcomes and success metrics (immediate, 30-day, 90-day) | ✅ Current |
| [FEATURES.md](./FEATURES.md) | Complete feature inventory with implementation status | ✅ Current |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical system architecture, database schema, data flows, AI integration | ✅ Current |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Design tokens (colors, typography, spacing, shadows, components) | ✅ Current |
| [VISUAL_GUIDELINES.md](./VISUAL_GUIDELINES.md) | Visual design principles, layout patterns, video specs, card/button styles | ✅ Current |
| [BRANDING.md](./BRANDING.md) | Brand voice, tone, messaging pillars, copy guidelines, word choices | ✅ Current |
| [HISTORY.md](./HISTORY.md) | Product evolution through phases, major pivots, key learnings | ✅ Current |
| [COMMON_ISSUES.md](./COMMON_ISSUES.md) | Recurring bugs and solutions, pipeline failure points, checklists | ✅ Current |
| [DECISIONS_LOG.md](./DECISIONS_LOG.md) | Key architectural and product decisions with dates, rationale, trade-offs | ✅ Current |
| [REPLICATION_GUIDE.md](./REPLICATION_GUIDE.md) | Step-by-step rebuild instructions, setup, configuration, verification | ✅ Current |
| [MASTER_INSTRUCTIONS.md](./MASTER_INSTRUCTIONS.md) | AI assistant behavior guidelines, diagnostic protocols, quality rules | ✅ Current |
| [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md) | Production readiness audit report, issues found, fixes applied | ✅ Current |

## Current Version Info

- **Version**: 1.0.0
- **Status**: ✅ Production Ready
- **Last Major Update**: January 27, 2025
- **Production Deployment**: Ready

## Terminology Standards

### Core Concepts

- **Neighbor**: A verified user on the platform (not "user" or "member")
- **Task**: A request for help (not "need" or "request" in user-facing copy)
- **Match**: Connection between a task owner and helper
- **Trust Tier**: Verification level (Tier 0, 1, or 2)
- **Credit**: Virtual currency for reciprocity (not "points" or "tokens")
- **Neighbourhood**: Geographic area (Australian spelling maintained)

### Technical Terms

- **Edge Function**: Supabase serverless function
- **RLS**: Row Level Security (Supabase security feature)
- **Realtime**: Supabase real-time subscriptions
- **AI Enhancement**: AI-powered task description improvement

## Critical Design Rules

### 1. Trust First
- All interactions require verified neighbors
- Trust tiers visible on all profiles
- Safety checks before all operations

### 2. Hyperlocal Focus
- Default radius: 500m (walking distance)
- All tasks within user's selected radius
- Neighbourhood-based matching

### 3. Micro-Task Design
- Maximum task duration: 45 minutes
- Quick posts, quick matches
- AI-enhanced descriptions

### 4. Reciprocal Community
- Everyone both gives and receives
- Credit system for balance
- No "helpers" vs "needy" distinction

### 5. Safety Always
- Content safety checks before AI
- Message sanitization
- Public meeting reminders

### 6. Simple, Not Clever
- One feed, one button to help, one chat
- Resist feature creep
- Every addition must earn its place

## Design System Quick Reference

### Colors
- **Primary**: Swaami Yellow (HSL: 48, 85%, 75%)
- **Accent**: Deep Yellow (HSL: 48, 90%, 50%)
- **Success**: Green (HSL: 145, 43%, 59%)
- **Destructive**: Red (HSL: 0, 84%, 60%)

### Typography
- **Display**: DM Sans (headings)
- **Body**: Inter (body text)
- **Scale**: 12px (xs) to 36px (4xl)

### Spacing
- **Scale**: 8px (gap-2) to 32px (gap-8)
- **Border Radius**: 16px default (1rem)

### Components
- **Buttons**: swaami, swaami-outline, ghost variants
- **Cards**: rounded-xl, shadow-sm default
- **Touch Targets**: Minimum 44x44px

## Development Standards

### Code Quality
- ✅ TypeScript strict mode
- ✅ 0 ESLint errors
- ✅ All errors properly handled
- ✅ Structured logging with context

### Error Handling
- All loaders have 10-second timeout
- Error states with retry buttons
- No dead ends
- Proper Supabase error extraction

### Data Integrity
- Atomic operations for critical paths
- State machine validation
- Double-submission protection
- Database constraints prevent race conditions

### Security
- Row Level Security on all tables
- Input validation with Zod
- Content safety checks
- No PII in logs or error messages

## Quick Links by Role

### For Developers
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [MASTER_INSTRUCTIONS.md](./MASTER_INSTRUCTIONS.md) - Development guidelines
- [COMMON_ISSUES.md](./COMMON_ISSUES.md) - Troubleshooting
- [DECISIONS_LOG.md](./DECISIONS_LOG.md) - Architecture decisions

### For Designers
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design tokens
- [VISUAL_GUIDELINES.md](./VISUAL_GUIDELINES.md) - Visual principles
- [BRANDING.md](./BRANDING.md) - Brand guidelines

### For Product Managers
- [PURPOSE.md](./PURPOSE.md) - Mission and values
- [ICP.md](./ICP.md) - Customer profiles
- [VALUE_PROP.md](./VALUE_PROP.md) - Value propositions
- [OUTCOMES.md](./OUTCOMES.md) - Success metrics
- [FEATURES.md](./FEATURES.md) - Feature inventory

### For QA/Auditors
- [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md) - Audit report
- [COMMON_ISSUES.md](./COMMON_ISSUES.md) - Known issues
- [HISTORY.md](./HISTORY.md) - Change log

### For New Team Members
- [REPLICATION_GUIDE.md](./REPLICATION_GUIDE.md) - Setup guide
- [PURPOSE.md](./PURPOSE.md) - What we're building
- [HISTORY.md](./HISTORY.md) - How we got here

## Document Maintenance

### Update Frequency
- **Core Documents**: Updated as features change
- **HISTORY.md**: Updated with each release
- **PRODUCTION_AUDIT.md**: Updated after audits
- **COMMON_ISSUES.md**: Updated as issues are found/fixed

### Version Control
- All documents tracked in git
- "Last Updated" dates maintained
- Major changes logged in HISTORY.md

### Contributing
1. Read [MASTER_INSTRUCTIONS.md](./MASTER_INSTRUCTIONS.md) first
2. Update relevant documents when making changes
3. Update "Last Updated" date
4. Add entry to HISTORY.md for significant changes

---

**For questions or updates to this index, see [MASTER_INSTRUCTIONS.md](./MASTER_INSTRUCTIONS.md)**
