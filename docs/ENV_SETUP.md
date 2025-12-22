# Environment Variables Setup Guide

## Quick Fix: Update Supabase Key

**Issue**: Authentication failing due to incorrect Supabase key

**Solution**: Update your `.env` file with the correct anon/public key:

```bash
VITE_SUPABASE_URL=https://qivqdltstmlxbcaldjzs.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpdnFkbHRzdG1seGJjYWxkanpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTYzNTQsImV4cCI6MjA4MTMzMjM1NH0.i56L6eLb1XSgbUNtUU4qLFHTS8xC68ZbVo7xhrDAP6k
```

## Steps to Fix

1. **Open `.env` file** in project root
2. **Update or add** `VITE_SUPABASE_PUBLISHABLE_KEY` with the key above
3. **Verify** `VITE_SUPABASE_URL` is set to `https://qivqdltstmlxbcaldjzs.supabase.co`
4. **Restart dev server**: Stop and run `npm run dev` again
5. **Test login**: Should now work

## Where to Find Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Find:
   - **Project URL**: Use for `VITE_SUPABASE_URL`
   - **anon public** key: Use for `VITE_SUPABASE_PUBLISHABLE_KEY`

## Important Notes

- ✅ The **anon/public** key is safe to expose in client-side code
- ❌ Never use the **service_role** key in frontend (it bypasses RLS)
- ✅ The key provided above is the correct anon key for this project
- ⚠️ After updating `.env`, you must restart the dev server

## Deployment

For production deployments:
- Set environment variables in your deployment platform
- Use the same values as in `.env`
- Restart/redeploy after updating

## Verification

After updating, verify:
1. ✅ No console errors about missing Supabase config
2. ✅ Login form works
3. ✅ Profile loads after login
4. ✅ No authentication errors in network tab

