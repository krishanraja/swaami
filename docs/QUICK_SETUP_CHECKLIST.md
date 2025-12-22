# Quick Setup Checklist

Print this out and check off each item as you complete it.

## Pre-Setup
- [ ] Have a Supabase account
- [ ] Have your project folder open
- [ ] Have a text editor ready

## Step 1: Create Project
- [ ] Created new Supabase project
- [ ] Project is ready (no longer loading)

## Step 2: Get Project Details
- [ ] Copied Project URL
- [ ] Copied anon public key
- [ ] Copied service_role key
- [ ] Extracted project ID from URL

## Step 3: Run Database Schema
- [ ] Opened SQL Editor in Supabase
- [ ] Opened `supabase/schema.sql` file
- [ ] Copied entire file contents
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run"
- [ ] Got success message (no errors)

## Step 4: Verify Tables
- [ ] Opened Table Editor
- [ ] Verified all 11 tables exist:
  - [ ] profiles
  - [ ] tasks
  - [ ] matches
  - [ ] messages
  - [ ] user_verifications
  - [ ] user_photos
  - [ ] social_connections
  - [ ] endorsements
  - [ ] user_subscriptions
  - [ ] otp_verifications
  - [ ] neighbourhoods

## Step 5: Check Storage
- [ ] Opened Storage
- [ ] Verified "profile-photos" bucket exists

## Step 6: Local Environment Variables
- [ ] Opened `.env` file
- [ ] Set `VITE_SUPABASE_URL`
- [ ] Set `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Set `VITE_SUPABASE_PROJECT_ID`
- [ ] Saved the file

## Step 7: Edge Function Secrets
- [ ] Opened Settings → Edge Functions → Secrets
- [ ] Note: Supabase keys (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) are automatically provided - don't add these!
- [ ] Added optional secrets (Stripe, Twilio, OpenAI, Google AI) if needed

## Step 8: Deploy Functions
- [ ] Installed Supabase CLI (if needed)
- [ ] Logged in: `supabase login`
- [ ] Deployed `create-checkout`
- [ ] Deployed `check-subscription`
- [ ] Deployed `send-phone-otp`
- [ ] Deployed `manage-endorsement`
- [ ] Deployed `seed-demo-users`
- [ ] Deployed `customer-portal`

## Step 9: Test Locally
- [ ] Ran `npm install`
- [ ] Ran `npm run dev`
- [ ] Opened app in browser
- [ ] Tried to sign up
- [ ] Received verification email
- [ ] Clicked verification link
- [ ] Got to onboarding screen

## Step 10: Email Template (Optional)
- [ ] Opened Authentication → Email Templates
- [ ] Updated "Confirm signup" template
- [ ] Saved template

## Step 11: Vercel Deployment (If Using)
- [ ] Set environment variables in Vercel
- [ ] Deployed to Vercel
- [ ] Tested production site

## ✅ All Done!
- [ ] Everything works
- [ ] Can sign up
- [ ] Can log in
- [ ] Profile loads correctly

---

**If you get stuck on any step, see `docs/IDIOT_PROOF_SETUP.md` for detailed instructions.**









