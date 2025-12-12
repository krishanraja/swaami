# Swaami Replication Guide

## Overview

This guide explains how to fork and replicate Swaami for a different neighborhood app or similar community platform.

## Prerequisites

- Lovable account
- Twilio account (for phone verification)
- Understanding of React/TypeScript

## Step 1: Remix the Project

1. Open Swaami in Lovable
2. Go to Settings → Remix this project
3. Name your remix (e.g., "MyNeighborhood")

## Step 2: Configure Lovable Cloud

The remixed project will have its own Lovable Cloud instance.

### Database
Tables are automatically created via migrations. Review in Cloud → Database.

### Secrets
Add your own secrets in Cloud → Secrets:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

`LOVABLE_API_KEY` is auto-provisioned.

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

The `rewrite-need` function uses Lovable AI (auto-provisioned).

To customize AI behavior:
1. Edit prompts in `supabase/functions/rewrite-need/index.ts`
2. Adjust categories, time limits, safety notes

## Step 9: Storage

Profile photos stored in `profile-photos` bucket (public).

To add more storage:
1. Create buckets in Cloud → Storage
2. Update storage policies for RLS

## Step 10: Deploy

1. Frontend: Click "Publish" in Lovable
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
Check LOVABLE_API_KEY exists and credits available.

## Support

For Lovable platform issues: support@lovable.dev
For project-specific help: Review docs/ folder
