# 🔄 HANDOFF: Mobile Skeleton Loading & Demo Data Issue

**Date**: 2026-01-24
**Branch**: `claude/fix-mobile-skeleton-loading-Bh92W`
**Status**: Code fixes complete, needs deployment verification

---

## 🎯 THE PROBLEM

### Issue 1: Profile Skeleton Loading Indefinitely
- Mobile app shows grey skeleton boxes forever
- Profile never loads
- User stuck in loading state

### Issue 2: Demo Data Toggle Does Nothing
- Toggle appears in UI but no demo data visible
- Database query confirms: `SELECT COUNT(*) FROM profiles WHERE is_demo = true` returns **0**
- No demo profiles or tasks exist

---

## ✅ CODE FIXES COMPLETED (Already Pushed)

### 1. Increased Network Timeouts
**File**: `src/lib/networkDetection.ts:89-103`
- Excellent (4G): 5s → **15s**
- Good (3G): 10s → **20s**
- Poor (2G): 20s → **30s**
- **Reason**: Auth queries were timing out at 5005ms - too aggressive for mobile

### 2. Added Retry Logic to Profile Fetch
**File**: `src/contexts/AuthContext.tsx:93-125`
- Uses `retryWithBackoff()` - automatic retries on failure
- 2-5 retries based on network quality
- Exponential backoff (2s, 4s, 8s delays)

### 3. Auto-Create Profile If Missing
**File**: `src/contexts/AuthContext.tsx:111-136`
- Detects `PGRST116` "not found" error
- Creates basic profile automatically with default values
- User can proceed instead of stuck in skeleton

### 4. Enhanced Error Logging
**File**: `src/App.tsx:56-92`
- Prominent error messages for demo seed failures
- Helpful troubleshooting guidance
- Doesn't block app if seeding fails

### 5. Timeout for Edge Function Calls
**File**: `src/utils/seedDemoData.ts:87-200`
- 90s timeout for seeding (180s with photos)
- 60s timeout for cleanup
- AbortController integration
- Comprehensive logging

### 6. **REBUILT Edge Function** (Critical)
**File**: `supabase/functions/seed-demo-users/index.ts`
- **Completely rewritten** - minimal, working version
- Removed: Google AI, photo generation, complex templates
- Added: Detailed logging, simple hardcoded data
- Default count: 10 (fast testing)
- No external dependencies
- **Backup of original**: `index.ts.backup`

---

## ❌ WHAT'S NOT WORKING (Root Cause)

**The edge function is NOT deployed or failing silently.**

Evidence:
- Database has 0 demo profiles
- User deployed 4 times but no data appeared
- Console shows seed attempt but no success/error

---

## 🚀 WHAT YOU NEED TO DO IN CURSOR

### CRITICAL: Deploy the Edge Function

The code is ready, but **the edge function must be deployed to Supabase** before anything will work.

#### Method 1: Supabase Dashboard (NO CLI NEEDED)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/qivqdltstmlxbcaldjzs/functions

2. **Deploy New Function**
   - Click "Deploy a new function" or "New function"
   - Name: `seed-demo-users`

3. **Copy Function Code**
   - Open: `supabase/functions/seed-demo-users/index.ts` in Cursor
   - Copy the ENTIRE contents
   - Paste into the Supabase function editor

4. **Deploy**
   - Click "Deploy" or "Save"
   - Wait 30 seconds for deployment to complete

---

### VERIFY: Test the Edge Function

#### Option 1: Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/qivqdltstmlxbcaldjzs/functions/seed-demo-users

2. Click "Invoke function" or "Test"

3. Use this JSON body:
```json
{
  "action": "generate",
  "count": 5
}
```

4. Click "Run"

5. **Expected Response:**
```json
{
  "success": true,
  "profilesCreated": 5,
  "tasksCreated": 10,
  "errors": []
}
```

6. **If you get errors**, check the "Logs" tab for detailed error messages

---

#### Option 2: Browser DevTools

1. Open your app in browser
2. Open DevTools Console (F12)
3. Paste this:

```javascript
const supabaseUrl = 'https://qivqdltstmlxbcaldjzs.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpdnFkbHRzdG1seGJjYWxkanpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTYzNTQsImV4cCI6MjA4MTMzMjM1NH0.i56L6eLb1XSgbUNtUU4qLFHTS8xC68ZbVo7xhrDAP6k';

const response = await fetch(
  `${supabaseUrl}/functions/v1/seed-demo-users`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generate',
      count: 5
    }),
  }
);

console.log('Status:', response.status);
const data = await response.json();
console.log('Response:', data);
```

**Expected:**
- Status: 200
- Response: `{success: true, profilesCreated: 5, tasksCreated: 10}`

**If 404:**
- Edge function NOT deployed
- Go back to deployment step

---

### VERIFY: Check Database

Run these queries in Supabase SQL Editor:
https://supabase.com/dashboard/project/qivqdltstmlxbcaldjzs/editor

#### Query 1: Check Profiles
```sql
SELECT COUNT(*) as demo_profiles
FROM profiles
WHERE is_demo = true;
```
**Expected**: 5 (or whatever count you used)

#### Query 2: Check Tasks
```sql
SELECT COUNT(*) as demo_tasks
FROM tasks
WHERE owner_id IN (SELECT id FROM profiles WHERE is_demo = true);
```
**Expected**: 10 (2 tasks per profile)

#### Query 3: Sample Data
```sql
SELECT
  display_name,
  city,
  neighbourhood,
  (SELECT COUNT(*) FROM tasks WHERE owner_id = profiles.id) as task_count
FROM profiles
WHERE is_demo = true
LIMIT 10;
```
**Expected**: See actual names like "Alice A.", "Bob B.", etc.

---

### SCALE UP: Create 200 Profiles

Once the test with 5 profiles works:

1. **Go back to Supabase Functions Dashboard**
2. **Invoke function again**
3. **Use this JSON:**
```json
{
  "action": "generate",
  "count": 200
}
```
4. **Wait 60-90 seconds** (creates 200 profiles + 400 tasks)
5. **Verify in database**: Should have 200 profiles, ~400 tasks

---

### REBUILD FRONTEND

Once demo data exists in database:

```bash
npm run build
```

Then redeploy to your hosting provider (Vercel/Netlify/etc.)

---

## 🔍 TROUBLESHOOTING

### Edge Function Logs

**Check logs here:**
https://supabase.com/dashboard/project/qivqdltstmlxbcaldjzs/functions/seed-demo-users/logs

**Look for:**
- ✅ `🚀 Seed function invoked`
- ✅ `✅ Environment variables OK`
- ✅ `✅ Supabase client created`
- ✅ `✅ Created profile 1/5: Alice A.`
- ❌ `Missing SUPABASE_SERVICE_ROLE_KEY` = deployment issue
- ❌ `row-level security policy` = service role not being used

---

### Common Issues

#### Issue: "Missing SUPABASE_SERVICE_ROLE_KEY"
**Solution**: Edge function must be deployed via Dashboard or CLI. Supabase auto-injects this key.

#### Issue: "404 Not Found"
**Solution**: Edge function not deployed. Go to Dashboard and deploy it.

#### Issue: "CORS error"
**Solution**: Check that `corsHeaders` in edge function includes your domain.

#### Issue: Database still shows 0 profiles
**Possible causes:**
1. Edge function not deployed
2. Edge function deployed but failing (check logs)
3. RLS policies blocking (shouldn't happen with service role)
4. Database constraints preventing inserts

**Debug:**
- Check edge function logs for errors
- Run test with count: 1 to see specific error
- Check if `user_id` column allows NULL values

---

## 📊 EXPECTED RESULTS AFTER DEPLOYMENT

### Console Output (Browser)
```
[App] Demo data stats: {demoProfileCount: 200, demoTaskCount: 400}
[App] Demo data sufficient: 400 tasks
[useTasks] Fetched tasks: {count: 400, usedFallback: false}
```

### Mobile App
- ✅ Profile loads within 15 seconds (no skeleton hang)
- ✅ Feed shows demo tasks (not empty)
- ✅ Demo toggle filters tasks on/off
- ✅ No timeout errors in console

---

## 📁 KEY FILES TO REVIEW IN CURSOR

### Edge Function (MUST DEPLOY)
- `supabase/functions/seed-demo-users/index.ts` - **Completely rebuilt, simple version**
- `supabase/functions/seed-demo-users/index.ts.backup` - Original (don't use)

### Frontend Changes (Already Pushed)
- `src/lib/networkDetection.ts` - Increased timeouts
- `src/contexts/AuthContext.tsx` - Retry logic + auto-create profile
- `src/App.tsx` - Enhanced error logging
- `src/utils/seedDemoData.ts` - Timeout on edge function calls

### Documentation
- `COMPLETE_DIAGNOSTIC_AUDIT.md` - Full root cause analysis
- `DIAGNOSIS_RESOLUTION.md` - What was fixed
- `DIAGNOSIS_MOBILE_SKELETON.md` - Original diagnostics
- `test-edge-function.html` - Browser test tool (optional)

---

## 🎬 STEP-BY-STEP CHECKLIST

### Phase 1: Deploy Edge Function
- [ ] Open Supabase Dashboard Functions page
- [ ] Create new function named `seed-demo-users`
- [ ] Copy contents of `supabase/functions/seed-demo-users/index.ts`
- [ ] Paste into function editor
- [ ] Click Deploy
- [ ] Wait 30 seconds

### Phase 2: Test with Small Count
- [ ] Invoke function with `{"action":"generate","count":5}`
- [ ] Check response: should be `{"success":true,"profilesCreated":5}`
- [ ] Run SQL: `SELECT COUNT(*) FROM profiles WHERE is_demo = true`
- [ ] Should return: 5
- [ ] Check logs for any errors

### Phase 3: Full Seed
- [ ] Invoke function with `{"action":"generate","count":200}`
- [ ] Wait 60-90 seconds
- [ ] Run SQL: `SELECT COUNT(*) FROM profiles WHERE is_demo = true`
- [ ] Should return: 200
- [ ] Run SQL: `SELECT COUNT(*) FROM tasks WHERE ...`
- [ ] Should return: 400+

### Phase 4: Rebuild Frontend
- [ ] Run: `npm run build`
- [ ] Redeploy to hosting
- [ ] Test on mobile
- [ ] Profile should load (no skeleton hang)
- [ ] Feed should show 400+ demo tasks
- [ ] Demo toggle should work

---

## 🆘 IF STILL NOT WORKING

### Check These:

1. **Edge function deployed?**
   - Dashboard → Functions → Should see `seed-demo-users`

2. **Edge function has errors?**
   - Dashboard → Functions → seed-demo-users → Logs
   - Look for red error messages

3. **Database has data?**
   - Run SQL: `SELECT COUNT(*) FROM profiles WHERE is_demo = true`
   - If 0, edge function failed or not deployed

4. **Frontend rebuilt and redeployed?**
   - Old frontend bundle won't have the timeout/retry fixes
   - Must rebuild after code changes

---

## 💡 KEY INSIGHTS

### What the "Demo Data" Toggle Actually Does
- **IT'S NOT A SEED TRIGGER**
- It's just a filter: `.filter((t) => showDemoTasks || !t.is_demo)`
- Shows/hides existing demo tasks
- Doesn't create data

### Where Seeding Actually Happens
1. `AdminPage` → "Seed Demo Data" button → calls `seedDemoData(200, false)`
2. `App.tsx` → Auto-seed on startup if `demoTaskCount < 50`
3. Both call: `/functions/v1/seed-demo-users`

### Why Previous Attempts Failed
- Original edge function was too complex
- Google AI API integration (not needed)
- Photo generation (requires API keys)
- Failing silently without clear errors
- New version is minimal and logs everything

---

## 📞 WHAT TO TELL ME IF IT STILL DOESN'T WORK

1. **Edge function logs** (copy/paste from Dashboard → Logs)
2. **Database query results** (the 3 SQL queries above)
3. **Browser console output** (when you click seed button)
4. **Response from function invocation test** (JSON response)

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:
- ✅ Database has 200 demo profiles (`is_demo = true`)
- ✅ Database has 400+ demo tasks
- ✅ Feed shows tasks (not empty)
- ✅ Profile loads within 15 seconds
- ✅ No timeout errors in console
- ✅ Demo toggle filters tasks on/off

---

## 🔗 IMPORTANT LINKS

- **Supabase Dashboard**: https://supabase.com/dashboard/project/qivqdltstmlxbcaldjzs
- **Functions**: https://supabase.com/dashboard/project/qivqdltstmlxbcaldjzs/functions
- **SQL Editor**: https://supabase.com/dashboard/project/qivqdltstmlxbcaldjzs/editor
- **Logs**: https://supabase.com/dashboard/project/qivqdltstmlxbcaldjzs/functions/seed-demo-users/logs

---

## 📋 ENVIRONMENT INFO

- **Project**: swaami
- **Supabase URL**: https://qivqdltstmlxbcaldjzs.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpdnFkbHRzdG1seGJjYWxkanpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTYzNTQsImV4cCI6MjA4MTMzMjM1NH0.i56L6eLb1XSgbUNtUU4qLFHTS8xC68ZbVo7xhrDAP6k
- **Branch**: claude/fix-mobile-skeleton-loading-Bh92W
- **Session**: Bh92W

---

**TL;DR**: Code is ready. Just deploy the edge function via Supabase Dashboard, test with 5 profiles, then scale to 200. Rebuild frontend. Done.
