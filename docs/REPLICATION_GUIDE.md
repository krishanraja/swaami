# Swaami Replication Guide

## Overview

This guide explains how to fork and replicate Swaami for a different neighborhood app or similar community platform.

## Prerequisites

- Supabase account
- Twilio account (for phone verification)
- Understanding of React/TypeScript

## Step 1: Fork the Project

1. Clone the Swaami repository
2. Set up your own Supabase project
3. Configure environment variables

## Step 2: Configure Supabase

The project uses Supabase for backend services.

### Database
Tables are automatically created via migrations. Review in Supabase Dashboard → Database.

### Secrets
Add your own secrets in Supabase Dashboard → Edge Functions → Secrets:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `GOOGLE_AI_API_KEY` (for AI task enhancement)
- `OPENAI_API_KEY` (for audio transcription, optional)

## Step 3: Customize Branding

### Logo
Replace the logo files:
- `src/assets/swaami-icon.png` - Icon used in app headers
- `src/assets/swaami-wordmark.png` - Wordmark used alongside icon on landing page

### Colors
Update `src/index.css`:
```css
:root {
  --primary: YOUR_PRIMARY_HSL;
  --secondary: YOUR_SECONDARY_HSL;
  /* etc */
}
```

### App Name
Search and replace "Swaami" with your app name in:
- `index.html` (title, meta tags)
- `src/pages/Landing.tsx`
- `src/screens/JoinScreen.tsx`
- All component references

## Step 4: Customize Categories

Edit task categories in:
- `supabase/functions/rewrite-need/index.ts` (AI prompt)
- `src/components/NeedCard.tsx` (icons)
- Any filter components

Default categories:
```
groceries, tech, transport, cooking, pets, 
handyman, childcare, language, medical, garden, other
```

## Step 5: Adjust Geography

### Default Location
Update default city/neighborhood in:
- `src/components/onboarding/CitySelector.tsx`
- `src/components/onboarding/NeighbourhoodSelector.tsx`

### Radius Settings
Modify default radius in:
- `src/components/RadiusSlider.tsx`
- Database defaults for `profiles.radius`

## Step 6: Trust Tier Customization

### Verification Types
Current verifications in `verification_type` enum:
- email, phone_sms, phone_whatsapp
- social_google, social_apple
- photos_complete, endorsement, mfa_enabled

To add/remove verification types:
1. Create a migration to alter the enum
2. Update `calculate_trust_tier` function
3. Modify `src/screens/VerificationScreen.tsx`

### Tier Requirements
Edit `calculate_trust_tier` in database to change tier thresholds.

## Step 7: Phone Verification Provider

Currently uses Twilio. To switch providers:

1. Update `supabase/functions/send-phone-otp/index.ts`
2. Change the API call to your provider
3. Update secrets accordingly

## Step 8: AI Enhancement

The `rewrite-need` function uses an AI service for task enhancement.

To customize AI behavior:
1. Edit prompts in `supabase/functions/rewrite-need/index.ts`
2. Adjust categories, time limits, safety notes

## Step 9: Storage

Profile photos stored in `profile-photos` bucket (public).

To add more storage:
1. Create buckets in Cloud → Storage
2. Update storage policies for RLS

## Step 10: Deploy

1. Frontend: Deploy to your hosting platform (Vercel, Netlify, etc.)
2. Edge Functions: Auto-deployed on save
3. Database: Migrations applied automatically

## Common Customizations

| Feature | Files to Modify |
|---------|-----------------|
| App name | `index.html`, Landing, Join screens |
| Colors | `src/index.css`, `tailwind.config.ts` |
| Logo | `src/assets/swaami-icon.png`, `src/assets/swaami-wordmark.png` |
| Categories | `rewrite-need`, NeedCard |
| Max task time | `rewrite-need` prompt |
| Radius default | RadiusSlider, profiles table |
| Verification steps | VerificationScreen, trust functions |

## Troubleshooting

### "Edge function error"
Check secrets are configured in Cloud → Secrets.

### "RLS policy violation"
Ensure user is authenticated and policies match your use case.

### "AI not responding"
Check GOOGLE_AI_API_KEY exists and has available quota.

## Support

For platform issues: Check your hosting provider's support documentation.
For project-specific help: Review docs/ folder
