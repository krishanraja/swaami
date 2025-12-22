# Supabase Migration Checklist

This checklist ensures your new Supabase project is properly configured after migration from a shared project.

## Prerequisites

- New Supabase project created
- Access to Supabase Dashboard
- Environment variables ready

## Step 1: Database Schema Setup

1. **Run the consolidated schema**:
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/schema.sql`
   - Execute the SQL script
   - Verify no errors

2. **Verify tables created**:
   - Check that all tables exist:
     - `profiles`
     - `tasks`
     - `matches`
     - `messages`
     - `user_verifications`
     - `user_photos`
     - `social_connections`
     - `endorsements`
     - `user_subscriptions`
     - `otp_verifications`
     - `neighbourhoods`

3. **Verify RLS is enabled**:
   - All tables should have RLS enabled
   - Check in Dashboard → Authentication → Policies

4. **Verify storage bucket**:
   - Check Dashboard → Storage
   - `profile-photos` bucket should exist and be public

## Step 2: Environment Variables

### Client-Side (Vite) - `.env` file

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Where to find**:
- `VITE_SUPABASE_URL`: Dashboard → Settings → API → Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Dashboard → Settings → API → anon public key
- `VITE_SUPABASE_PROJECT_ID`: Extract from URL (the part before `.supabase.co`)

### Edge Functions - Supabase Secrets

**IMPORTANT**: Supabase automatically provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to all edge functions. You don't need to set these as secrets - they're already available!

**Only set these secrets** if you're using these features (in Dashboard → Project Settings → Edge Functions → Secrets):

**Required for core features:**
```env
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)  # Required for subscriptions
TWILIO_ACCOUNT_SID=your_twilio_account_sid       # Required for phone verification
TWILIO_AUTH_TOKEN=your_twilio_auth_token         # Required for phone verification
TWILIO_PHONE_NUMBER=+1234567890                  # Required for phone verification
```

**Optional secrets (only if using these features):**
```env
OPENAI_API_KEY=your_openai_api_key              # Optional, for AI features
GOOGLE_AI_API_KEY=your_google_ai_api_key        # Optional, for AI features
RESEND_API_KEY=your_resend_api_key              # Optional, for email sending
SUPABASE_DB_URL=your_db_connection_string       # Optional, for direct DB access
```

**Note**: The Supabase keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are automatically available to edge functions - you don't need to set them manually.

## Step 3: Edge Functions Deployment

1. **Deploy all edge functions**:
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy check-subscription
   supabase functions deploy send-phone-otp
   supabase functions deploy manage-endorsement
   supabase functions deploy seed-demo-users
   supabase functions deploy customer-portal
   ```

2. **Verify functions are deployed**:
   - Check Dashboard → Edge Functions
   - All functions should be listed

3. **Test function endpoints** (optional):
   - Use Dashboard → Edge Functions → Test
   - Or use curl/Postman with proper auth headers

## Step 4: Authentication Configuration

1. **Email settings**:
   - Dashboard → Authentication → Email Templates
   - Verify email templates are configured
   - Update redirect URLs if needed

2. **OAuth providers** (if using):
   - Dashboard → Authentication → Providers
   - Configure Google/Apple OAuth
   - Update redirect URLs

3. **Email confirmation**:
   - Dashboard → Authentication → Settings
   - Configure email confirmation settings
   - Set redirect URL to your app's `/join` route

## Step 5: Verify Multi-Project Safety

✅ **Checklist**:
- [ ] No hardcoded project IDs in code (check `supabase/config.toml`)
- [ ] No old anon keys in code
- [ ] No old service role keys in code
- [ ] Storage bucket name is unique (`profile-photos`)
- [ ] All environment variables point to new project
- [ ] Edge functions use new project secrets

## Step 6: Testing

### Auth Flow Testing

1. **Sign Up**:
   - Create new account
   - Verify email confirmation works
   - Check profile is created automatically

2. **Sign In**:
   - Login with existing account
   - Verify session persists
   - Check profile loads correctly

3. **Onboarding**:
   - Complete onboarding flow
   - Verify profile updates
   - Check phone verification works

4. **Profile Creation**:
   - Verify `handle_new_user()` trigger works
   - Check profile row exists after signup
   - Test profile fetch in app

### Database Testing

1. **RLS Policies**:
   - Test user can only see own data
   - Test public data is accessible
   - Test task/message permissions

2. **Functions**:
   - Test `get_public_tasks()` RPC
   - Test `get_nearby_tasks()` RPC
   - Test `help_with_task()` RPC

3. **Storage**:
   - Test photo upload
   - Verify public access works
   - Check file permissions

## Step 7: Production Deployment (Vercel)

1. **Set environment variables in Vercel**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all `VITE_*` variables
   - Set for Production, Preview, and Development

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Verify**:
   - Check app loads
   - Test auth flows
   - Verify API calls work

## Troubleshooting

### Profile not found errors
- Check `handle_new_user()` trigger exists
- Verify trigger is enabled
- Check RLS policies allow profile creation

### Edge function errors
- Verify secrets are set correctly
- Check function logs in Dashboard
- Ensure environment variables match

### Storage upload failures
- Verify bucket exists and is public
- Check storage policies
- Verify user authentication

### RLS policy errors
- Check policies are enabled
- Verify user is authenticated
- Check policy conditions match user data

## Support

If issues persist:
1. Check Supabase Dashboard logs
2. Review browser console errors
3. Check edge function logs
4. Verify all environment variables are set correctly






