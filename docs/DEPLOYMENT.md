# Swaami Deployment Guide

## Overview

Swaami runs on Lovable Cloud (powered by Supabase) with automatic deployment.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│    React + Vite + TailwindCSS + TypeScript          │
│              (Auto-deployed by Lovable)              │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│               Lovable Cloud (Supabase)               │
├─────────────────────────────────────────────────────┤
│  Edge Functions    │  Database   │  Auth  │ Storage │
│  - rewrite-need    │  profiles   │  JWT   │ photos  │
│  - send-phone-otp  │  tasks      │        │         │
│  - manage-endorse  │  matches    │        │         │
└─────────────────────────────────────────────────────┘
```

## Environment Variables

### Automatically Provided (Lovable Cloud)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Public API key
- `VITE_SUPABASE_PROJECT_ID` - Project identifier

### Edge Function Secrets (Configured in Cloud UI)
- `LOVABLE_API_KEY` - AI gateway access (auto-provisioned)
- `STRIPE_SECRET_KEY` - Stripe secret key for subscriptions (starts with `sk_test_` or `sk_live_`)
- `TWILIO_ACCOUNT_SID` - Phone verification
- `TWILIO_AUTH_TOKEN` - Twilio authentication
- `TWILIO_PHONE_NUMBER` - SMS sender number

**Note**: See [STRIPE_SETUP.md](STRIPE_SETUP.md) for detailed Stripe configuration instructions.

## Edge Functions

### Automatic Deployment
Edge functions in `supabase/functions/` are deployed automatically when code changes.

### Function List

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `rewrite-need` | AI task enhancement | No |
| `send-phone-otp` | Phone verification | No |
| `manage-endorsement` | Trust endorsements | Yes |

### Configuration
See `supabase/functions/config.toml` for JWT settings.

## Deployment Flow

1. **Code Change** → Push to main branch
2. **Build** → Vite production build
3. **Frontend** → CDN deployment (auto)
4. **Edge Functions** → Deno runtime deployment (auto)
5. **Database** → Migrations applied (manual approval)

## Health Checks

### Frontend
- Visit `/` - Landing page should load
- Visit `/join` - Onboarding should render

### Edge Functions
- Check logs in Lovable Cloud dashboard
- Each function logs request IDs for tracing

### Database
- Use `supabase--read-query` to verify tables
- Check RLS policies are active

## Rollback Procedure

1. **Frontend**: Revert commit in Lovable
2. **Edge Functions**: Re-deploy previous version
3. **Database**: Run reverse migration (if applicable)

## Monitoring

### Logs
- Edge function logs: Lovable Cloud → Functions → Logs
- Database logs: Analytics queries via Supabase

### Metrics
- Request latency tracked per function
- AI token usage logged per request

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] Secrets never logged (values masked)
- [ ] Content safety filters active
- [ ] CORS headers properly set
- [ ] JWT verification on sensitive functions
