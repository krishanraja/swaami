# Idiot-Proof Supabase Setup Instructions

Follow these steps **in order**. Don't skip any steps. If something doesn't work, stop and check that step again.

## 🎯 What You're Doing

You're setting up a brand new Supabase project to replace the old shared one. This will take about 15-20 minutes.

---

## STEP 1: Create Your New Supabase Project

1. Go to https://supabase.com
2. Sign in (or create account if needed)
3. Click **"New Project"** button
4. Fill in:
   - **Name**: `swaami` (or whatever you want)
   - **Database Password**: Create a strong password (save it somewhere safe!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
5. Click **"Create new project"**
6. **WAIT** - This takes 2-3 minutes. Don't close the page.
7. When it says "Project is ready", you're done with this step.

---

## STEP 2: Get Your Project Details

You need to copy these values. **Write them down** or keep this tab open.

1. In Supabase Dashboard, click **Settings** (gear icon in left sidebar)
2. Click **API** (under Project Settings)
3. You'll see a section called **"Project URL"** - copy this entire URL
   - Looks like: `https://abcdefghijklmnop.supabase.co`
   - **This is your `VITE_SUPABASE_URL`**
4. Scroll down to **"Project API keys"**
5. Find the **"anon public"** key - click the eye icon to reveal it, then copy it
   - **This is your `VITE_SUPABASE_PUBLISHABLE_KEY`**
6. Find the **"service_role"** key - click the eye icon to reveal it, then copy it
   - **This is your `SUPABASE_SERVICE_ROLE_KEY`** (keep this secret!)
7. Look at your Project URL again - the part before `.supabase.co` is your project ID
   - Example: If URL is `https://abcdefghijklmnop.supabase.co`, then project ID is `abcdefghijklmnop`
   - **This is your `VITE_SUPABASE_PROJECT_ID`**

**✅ CHECKPOINT**: You should have 3 values written down:
- Project URL
- anon public key
- service_role key
- Project ID (extracted from URL)

---

## STEP 3: Set Up Your Database (The Big One)

This is the most important step. Don't skip it.

1. In Supabase Dashboard, click **SQL Editor** (in left sidebar)
2. Click **"New query"** button
3. Open the file `supabase/schema.sql` from your project folder
   - It's in the root of your project: `swaami/supabase/schema.sql`
4. **Copy the ENTIRE contents** of that file (Ctrl+A, Ctrl+C)
5. **Paste it** into the SQL Editor in Supabase Dashboard
6. Click **"Run"** button (or press Ctrl+Enter)
7. **WAIT** - This takes 30-60 seconds
8. You should see "Success. No rows returned" or similar success message
9. If you see errors, scroll down and read them. Common issues:
   - If it says "already exists" - that's OK, just means you ran it twice
   - If it says "permission denied" - check you're logged in as project owner
   - If you see other errors, copy them and ask for help

**✅ CHECKPOINT**: The SQL ran successfully (no red errors).

---

## STEP 4: Verify Database Was Created

Let's make sure everything worked.

1. In Supabase Dashboard, click **Table Editor** (in left sidebar)
2. You should see a list of tables. Check that these exist:
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
3. If all tables are there, you're good! ✅
4. If some are missing, go back to Step 3 and run the SQL again.

**✅ CHECKPOINT**: You can see all 11 tables in the Table Editor.

---

## STEP 5: Check Storage Bucket

1. In Supabase Dashboard, click **Storage** (in left sidebar)
2. You should see a bucket called **"profile-photos"**
3. If it's there, you're good! ✅
4. If it's not there, go back to Step 3 and run the SQL again (the bucket creation is in the SQL file).

**✅ CHECKPOINT**: You can see the "profile-photos" bucket.

---

## STEP 6: Set Up Environment Variables (Local Development)

This is for running the app on your computer.

1. In your project folder, find the file `.env` (or create it if it doesn't exist)
2. Open it in a text editor
3. Replace the values with your actual project details:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_public_key_here
VITE_SUPABASE_PROJECT_ID=your-project-id-here
```

**Example** (don't use these, use YOUR values):
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.example
VITE_SUPABASE_PROJECT_ID=abcdefghijklmnop
```

4. **Save the file**

**✅ CHECKPOINT**: Your `.env` file has the correct values (double-check the URLs match).

---

## STEP 7: Set Up Edge Function Secrets

This is for the backend functions that run on Supabase.

**IMPORTANT**: Supabase automatically provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to all edge functions. You don't need to (and can't) set these as secrets - they're already available!

1. In Supabase Dashboard, click **Settings** (gear icon)
2. Click **Edge Functions** (under Project Settings)
3. Click **"Secrets"** tab
4. Click **"Add new secret"** button
5. **Only add these secrets if you're using these features**:

   **If using Stripe payments:**
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
   - Click **"Add"**

   **If using Twilio phone verification:**
   - Name: `TWILIO_ACCOUNT_SID`
   - Value: Your Twilio Account SID
   - Click **"Add"**
   
   - Name: `TWILIO_AUTH_TOKEN`
   - Value: Your Twilio Auth Token
   - Click **"Add"**
   
   - Name: `TWILIO_PHONE_NUMBER`
   - Value: Your Twilio phone number (e.g., `+1234567890`)
   - Click **"Add"**

   **If using Lovable AI:**
   - Name: `LOVABLE_API_KEY`
   - Value: Your Lovable API key
   - Click **"Add"**

**✅ CHECKPOINT**: You've added any optional secrets you need. The Supabase keys are automatically available - you don't need to set them!

---

## STEP 8: Deploy Edge Functions

You need the Supabase CLI for this. If you don't have it, install it first.

### Install Supabase CLI (if needed):

1. Go to https://supabase.com/docs/guides/cli
2. Follow the installation instructions for your operating system
3. After installing, run: `supabase login`
4. Follow the prompts to log in

### Deploy Functions:

Open a terminal in your project folder and run these commands **one at a time**:

```bash
supabase functions deploy create-checkout
```

Wait for it to finish, then:

```bash
supabase functions deploy check-subscription
```

Wait, then:

```bash
supabase functions deploy send-phone-otp
```

Wait, then:

```bash
supabase functions deploy manage-endorsement
```

Wait, then:

```bash
supabase functions deploy seed-demo-users
```

Wait, then:

```bash
supabase functions deploy customer-portal
```

**If you get errors:**
- Make sure you're logged in: `supabase login`
- Make sure you're in the project folder
- Check that your project is linked: `supabase link --project-ref YOUR-PROJECT-ID`

**✅ CHECKPOINT**: All 6 functions deployed successfully (you'll see "Deployed function X" messages).

---

## STEP 9: Test Your Setup

Let's make sure everything works.

1. **Start your app locally:**
   ```bash
   npm install
   npm run dev
   ```

2. **Open your browser** to the URL it shows (usually `http://localhost:5173`)

3. **Try to sign up:**
   - Click "Sign up" or "Create account"
   - Enter an email and password
   - Submit the form
   - You should see a message about email verification

4. **Check your email** for the verification link (check spam folder too)

5. **Click the verification link** in the email

6. **You should be redirected** to your app and see the onboarding screen

**If something doesn't work:**
- Check the browser console (F12) for errors
- Check that your `.env` file has the correct values
- Make sure you ran the SQL schema (Step 3)
- Check Supabase Dashboard → Logs for any errors

**✅ CHECKPOINT**: You can sign up and get redirected to onboarding.

---

## STEP 10: Configure Email Templates (Optional but Recommended)

Make your verification emails look nice.

1. In Supabase Dashboard, click **Authentication** (in left sidebar)
2. Click **Email Templates**
3. Click on **"Confirm signup"** template
4. Open the file `supabase/email-templates/confirm-signup.html` from your project
5. Copy its contents
6. Paste into the email template editor in Supabase
7. Click **"Save"**

**✅ CHECKPOINT**: Email template is updated.

---

## STEP 11: Set Up Vercel (For Production)

If you're deploying to Vercel:

1. Go to https://vercel.com and sign in
2. Import your project (or create new project)
3. Go to **Project Settings** → **Environment Variables**
4. Add these variables (same values as your `.env` file):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
5. Make sure to set them for **Production**, **Preview**, and **Development**
6. Deploy your project

**✅ CHECKPOINT**: Your app is deployed and working on Vercel.

---

## 🎉 You're Done!

Your Supabase backend is now set up and ready to use. The app should work exactly like it did before, but now it's using your own dedicated project.

---

## 🆘 Troubleshooting

### "Profile not found" error
- Go back to Step 3 and make sure the SQL ran completely
- Check that the `handle_new_user` trigger exists in Database → Functions

### Edge functions not working
- Check that secrets are set (Step 7)
- Check function logs in Supabase Dashboard → Edge Functions → Logs

### Can't sign up
- Check your `.env` file has correct values
- Check browser console for errors
- Verify email confirmation is set up in Authentication → Settings

### Database errors
- Make sure you ran the full `schema.sql` file
- Check that all tables exist (Step 4)
- Check RLS policies are enabled in Authentication → Policies

### Still stuck?
1. Check the browser console (F12) for errors
2. Check Supabase Dashboard → Logs
3. Check edge function logs
4. Make sure all environment variables are set correctly
5. Verify the SQL schema ran successfully

---

## Quick Reference

**Where to find things in Supabase Dashboard:**
- **Project URL & Keys**: Settings → API
- **Database Tables**: Table Editor
- **Storage Buckets**: Storage
- **Edge Functions**: Edge Functions
- **Secrets**: Settings → Edge Functions → Secrets
- **SQL Editor**: SQL Editor
- **Logs**: Logs (in left sidebar)

**Important Files:**
- `supabase/schema.sql` - Database setup (run this in SQL Editor)
- `.env` - Local environment variables
- `supabase/functions/_shared/supabase.ts` - Edge function utilities (already done)

---

**Remember**: If something doesn't work, go back to the step where it should have been set up and double-check everything. Most issues are from missing environment variables or not running the SQL schema.
