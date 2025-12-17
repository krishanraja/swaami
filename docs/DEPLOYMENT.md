# Swaami Deployment Guide

## Overview

Swaami is deployed on Vercel for the frontend and uses Supabase for backend services (database, auth, storage, and edge functions).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│    React + Vite + TailwindCSS + TypeScript          │
│              (Deployed on Vercel)                    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                    Supabase                          │
├─────────────────────────────────────────────────────┤
│  Edge Functions    │  Database   │  Auth  │ Storage │
│  - create-checkout │  profiles   │  JWT   │ photos  │
│  - check-subscription│  tasks      │        │         │
│  - send-phone-otp  │  matches    │        │         │
│  - manage-endorsement│ messages   │        │         │
│  - customer-portal │  endorsements│       │         │
└─────────────────────────────────────────────────────┘
```

## Environment Variables

### Frontend (Vercel)
Set these in Vercel Dashboard → Project Settings → Environment Variables:
- `VITE_SUPABASE_URL` - Supabase project URL (e.g., `https://qivqdltstmlxbcaldjzs.supabase.co`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Public API key (anon key from Supabase)
- `VITE_SUPABASE_PROJECT_ID` - Project identifier (extract from URL)

**Important**: Set these for Production, Preview, and Development environments in Vercel.

### Edge Function Secrets (Supabase Dashboard)
Configure in Supabase Dashboard → Edge Functions → Secrets:

**Auto-Provided by Supabase (No Action Needed):**
- `SUPABASE_URL` - Automatically available to all edge functions
- `SUPABASE_ANON_KEY` - Automatically available to all edge functions
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically available to all edge functions

**Manual Configuration Required:**
- `STRIPE_SECRET_KEY` - Stripe secret key for subscriptions (starts with `sk_test_` or `sk_live_`)
- `TWILIO_ACCOUNT_SID` - Phone verification
- `TWILIO_AUTH_TOKEN` - Twilio authentication
- `TWILIO_PHONE_NUMBER` - SMS sender number (e.g., `+1234567890`)
- `OPENAI_API_KEY` - Optional, for AI features
- `GOOGLE_AI_API_KEY` - Optional, for AI features
- `RESEND_API_KEY` - Optional, for email sending
- `SUPABASE_DB_URL` - Optional, for direct database access

**Note**: See [STRIPE_SETUP.md](STRIPE_SETUP.md) for detailed Stripe configuration instructions.

## Deployment Steps

### 1. Vercel Frontend Deployment

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository

2. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all `VITE_*` variables
   - Set for Production, Preview, and Development

3. **Deploy**:
   - Vercel will auto-deploy on push to main branch
   - Or manually deploy: `vercel --prod`

### 2. Supabase Edge Functions Deployment

Deploy edge functions using Supabase CLI:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref qivqdltstmlxbcaldjzs

# Deploy all functions
npx supabase functions deploy create-checkout
npx supabase functions deploy check-subscription
npx supabase functions deploy send-phone-otp
npx supabase functions deploy manage-endorsement
npx supabase functions deploy customer-portal
npx supabase functions deploy seed-demo-users
```

Or use the PowerShell script:
```powershell
.\deploy-functions.ps1
```

### Function List

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `create-checkout` | Stripe checkout session | Yes |
| `check-subscription` | Check subscription status | Yes |
| `send-phone-otp` | Phone verification (SMS/WhatsApp) | No |
| `manage-endorsement` | Trust endorsements | Yes |
| `customer-portal` | Stripe billing portal | Yes |
| `seed-demo-users` | Seed demo data | No |

### Configuration
See `supabase/config.toml` for function settings.

## Health Checks

### Frontend
- Visit your Vercel deployment URL
- Visit `/` - Landing page should load
- Visit `/join` - Onboarding should render
- Check browser console for errors

### Edge Functions
- Check logs in Supabase Dashboard → Edge Functions → Logs
- Each function logs request IDs for tracing
- Test endpoints using Supabase Dashboard → Edge Functions → Test

### Database
- Use Supabase Dashboard → SQL Editor to verify tables
- Check RLS policies are active in Authentication → Policies
- Verify storage bucket exists in Storage

## Rollback Procedure

1. **Frontend**: 
   - Go to Vercel Dashboard → Deployments
   - Find previous deployment and click "Promote to Production"
   - Or revert commit and push to trigger new deployment

2. **Edge Functions**: 
   - Re-deploy previous version using Supabase CLI
   - Or revert Git commit and re-deploy

3. **Database**: 
   - Run reverse migration if applicable
   - Use Supabase Dashboard → Database → Migrations

## Monitoring

### Logs
- **Frontend**: Vercel Dashboard → Project → Logs
- **Edge Functions**: Supabase Dashboard → Edge Functions → Logs
- **Database**: Supabase Dashboard → Logs

### Metrics
- **Vercel**: Request latency, build times, bandwidth usage
- **Supabase**: Edge function execution time, database query performance
- **Stripe**: Subscription metrics in Stripe Dashboard

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] Secrets never logged (values masked)
- [ ] Content safety filters active
- [ ] CORS headers properly set
- [ ] JWT verification on sensitive functions
