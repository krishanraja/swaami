# Stripe Setup Guide

## Overview

Swaami uses Stripe for subscription payments (Swaami+). The Stripe integration is handled through Supabase Edge Functions.

## Required Stripe Keys

### Secret Key (Required)
- **Name**: `STRIPE_SECRET_KEY`
- **Format**: Should start with `sk_test_` (test mode) or `sk_live_` (production)
- **Location**: Set as a secret in Supabase Edge Functions
- **Used by**: 
  - `create-checkout` - Creates checkout sessions
  - `check-subscription` - Checks subscription status
  - `customer-portal` - Opens billing portal

### Publishable Key (Optional - for frontend)
- Currently not used in the frontend, but may be needed for future features
- Format: Starts with `pk_test_` or `pk_live_`

## Setting Up Stripe Keys in Supabase

1. **Get your Stripe Secret Key**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Navigate to **Developers** → **API keys**
   - Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)

2. **Set the Secret in Supabase**:
   - Go to your Supabase project dashboard
   - Navigate to **Edge Functions** → **Secrets**
   - Add a new secret:
     - **Name**: `STRIPE_SECRET_KEY`
     - **Value**: Your Stripe secret key (e.g., `sk_test_...` or `sk_live_...`)
   - ⚠️ **IMPORTANT**: Never commit this key to your codebase. Only set it in Supabase secrets.

### Your Current Configuration

✅ **Live Production Key**: Configure your Stripe secret key in Supabase Edge Function secrets.

**Quick Setup**: See [QUICK_SETUP_STRIPE.md](QUICK_SETUP_STRIPE.md) for step-by-step instructions.

**Manual Setup**: Set this key in your Supabase Edge Function secrets:
1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add secret:
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key from Stripe Dashboard (starts with `sk_live_` or `sk_test_`)
   - ⚠️ **Get your key**: Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys

## Important Notes

✅ **Key Format**: Your production key should start with `sk_live_` (test keys start with `sk_test_`).

⚠️ **Security Reminders**:
- **NEVER** commit your Stripe secret key to git or any code repository
- Only set it in Supabase Edge Function secrets
- This is a **live production key** - it will process real payments
- Keep this key secure and rotate it if compromised
- Use test keys (`sk_test_`) for development/testing

## Stripe Products & Prices

Current configuration:
- **Product ID**: `prod_TaYxIwz13dAY7m` (Swaami+)
- **Price ID**: `price_1SdNprHf9EbsrhltVKhL2PH6`

These are configured in:
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/create-checkout/index.ts`

## Testing

To test the Stripe integration:

1. **Test Mode**:
   - Use `sk_test_...` key
   - Use Stripe test cards: `4242 4242 4242 4242`

2. **Production Mode**:
   - Use `sk_live_...` key
   - Real payments will be processed

## Edge Functions Using Stripe

1. **create-checkout** (`supabase/functions/create-checkout/index.ts`)
   - Creates Stripe checkout sessions for Swaami+ subscriptions
   - Requires: `STRIPE_SECRET_KEY`

2. **check-subscription** (`supabase/functions/check-subscription/index.ts`)
   - Checks if user has active Swaami+ subscription
   - Updates `user_subscriptions` table
   - Requires: `STRIPE_SECRET_KEY`

3. **customer-portal** (`supabase/functions/customer-portal/index.ts`)
   - Opens Stripe billing portal for subscription management
   - Requires: `STRIPE_SECRET_KEY`

## Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Ensure the secret is set in Supabase Edge Functions secrets
- Check that the secret name is exactly `STRIPE_SECRET_KEY` (case-sensitive)

### "Invalid API Key"
- Verify the key starts with `sk_test_` or `sk_live_`
- Ensure you're using the Secret key, not the Publishable key
- Check that the key hasn't been revoked in Stripe dashboard

### "No Stripe customer found"
- This is normal for new users who haven't subscribed yet
- Customer is created automatically on first checkout

