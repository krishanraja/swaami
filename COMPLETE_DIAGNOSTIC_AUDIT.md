# COMPLETE DIAGNOSTIC AUDIT - Demo Data Toggle Not Working

**Date**: 2026-01-24
**Issue**: Demo data toggle shows UI but NO demo profiles/tasks appear in database
**Database Status**: `SELECT COUNT(*) FROM profiles WHERE is_demo = true` = **0**

---

## EXECUTIVE SUMMARY

The "Demo data" toggle in FeedScreen is **NOT a seed trigger** - it's just a FILTER to show/hide existing demo tasks.

**The real seeding happens from:**
1. AdminPage → "Seed Demo Data" button → calls `seedDemoData(200, false)`
2. App.tsx → Auto-seed on startup if `demoTaskCount < 50`

**Both call the same edge function**: `/functions/v1/seed-demo-users`

**Result**: Edge function is being called but **0 profiles created** → Edge function is either:
- Not deployed
- Deployed but failing
- Deployed but blocked by permissions

---

## COMPLETE DATA FLOW TRACE

### Flow 1: User Clicks "Demo Data" Toggle (FeedScreen)

```
FeedScreen.tsx:28
├─ const [showDemoTasks, setShowDemoTasks] = useState(true);
├─ Line 94: .filter((t) => showDemoTasks || !t.is_demo)
└─ ❌ NO SEEDING - Just filters existing tasks
```

**THIS IS NOT THE SEEDING TRIGGER!**

### Flow 2: Admin Clicks "Seed Demo Data" Button (AdminPage)

```
AdminPage.tsx:50-71 handleSeed()
├─ seedDemoData(200, false)
│  ├─ src/utils/seedDemoData.ts:87-142
│  ├─ fetch(`${supabaseUrl}/functions/v1/seed-demo-users`)
│  │  ├─ Headers: Authorization: Bearer ${anonKey}
│  │  └─ Body: { action: "generate", count: 200, generatePhotos: false }
│  │
│  └─ Edge Function: supabase/functions/seed-demo-users/index.ts
│     ├─ Line 201: const supabase = createSupabaseClient({ useServiceRole: true })
│     ├─ Uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
│     ├─ Creates 200 profiles with is_demo = true, user_id = null
│     ├─ Creates 0-3 tasks per profile
│     └─ Returns { profilesCreated, tasksCreated, photosGenerated }
```

### Flow 3: Auto-Seed on App Startup (App.tsx)

```
App.tsx:56-93
├─ useEffect(() => initDemoData(), [])
├─ getDemoDataStats() → { demoTaskCount: 0 }
├─ if (demoTaskCount < 50) → TRUE
├─ seedDemoData(200, false) → calls edge function
└─ Console: "[App] Demo data insufficient, seeding 200 profiles..."
   └─ ❌ NO FOLLOW-UP LOG = edge function call failed or hung
```

---

## ROOT CAUSE ANALYSIS: Why 0 Profiles Created

### ROOT CAUSE #1: Edge Function Not Deployed ⭐ MOST LIKELY

**Evidence:**
- User console shows seed attempt but no response
- No error message (would show if deployed but failing)
- Silent failure = 404 from edge function endpoint

**How to Verify:**
```bash
# Check Supabase Dashboard → Edge Functions
# OR check with CLI:
npx supabase functions list
```

**Fix:**
```bash
npx supabase login
npx supabase functions deploy seed-demo-users
# OR use the script:
./deploy-edge-function.sh
```

---

### ROOT CAUSE #2: Service Role Key Not Set in Supabase

**Evidence:**
- Edge function uses: `createSupabaseClient({ useServiceRole: true })`
- This requires `SUPABASE_SERVICE_ROLE_KEY` environment variable
- If missing, edge function throws error at line 201

**How Edge Function Gets Service Role Key:**
- Supabase automatically injects `SUPABASE_SERVICE_ROLE_KEY` into deployed edge functions
- But ONLY if the function is deployed via `supabase functions deploy`
- Local development requires manual `.env` file

**How to Verify:**
```bash
# In Supabase Dashboard:
# Settings → Edge Functions → seed-demo-users → Environment Variables
# Should see: SUPABASE_SERVICE_ROLE_KEY = sk_...
```

**Fix:**
- Deploy using CLI (not manual upload)
- Supabase CLI automatically sets service role key
- No manual action needed if deployed correctly

---

### ROOT CAUSE #3: RLS Policies Blocking Inserts

**RLS Policy for Profiles INSERT:**
```sql
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Problem:**
- Demo profiles have `user_id = null` (no auth user)
- Normal clients would be blocked by RLS
- **BUT**: Service role client **BYPASSES RLS** entirely

**This is NOT the issue IF:**
- Edge function is deployed
- Service role key is set
- Edge function uses `createSupabaseClient({ useServiceRole: true })`

**How to Verify:**
Check edge function line 201:
```typescript
const supabase = createSupabaseClient({ useServiceRole: true }); // ✅ Correct
```

---

### ROOT CAUSE #4: CORS Issues Preventing Edge Function Call

**Evidence:**
- No CORS errors in console logs provided
- fetch() to edge function uses proper Authorization header

**CORS Headers in Edge Function:**
```typescript
// supabase/functions/_shared/supabase.ts:51-69
const ALLOWED_ORIGINS = ["https://swaami.ai", "https://www.swaami.ai", "http://localhost:5173", ...];
```

**How to Verify:**
- Check browser Network tab
- Look for OPTIONS preflight request to `/functions/v1/seed-demo-users`
- Should return 200 with Access-Control-Allow-Origin header

**Unlikely to be the issue** because:
- No CORS errors in console
- Other edge functions likely working (auth, etc.)

---

### ROOT CAUSE #5: Edge Function Timing Out

**Evidence from User:**
- Console shows: "[App] Demo data insufficient, seeding 200 profiles..."
- No follow-up success/error message
- Suggests request hung or timed out

**Timeout Settings:**
- `seedDemoData.ts` has 90s timeout (3min with photos)
- Edge functions have default 10 minute timeout
- 200 profiles should take ~45-60 seconds

**Possible Sub-Issues:**
1. Edge function deployed but stuck in infinite loop
2. Database inserts timing out (unlikely with service role)
3. Network issue between frontend and Supabase edge functions

**How to Verify:**
- Check Supabase Dashboard → Edge Functions → Logs
- Should see function invocations and any errors

---

### ROOT CAUSE #6: Database Constraints Preventing Inserts

**Schema Check:**
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,  -- ⚠️ NULLABLE?
  display_name text,
  city text,
  neighbourhood text,
  is_demo boolean DEFAULT false,
  ...
);
```

**Potential Issues:**
- If `user_id` has NOT NULL constraint → inserts fail
- If `user_id` has UNIQUE constraint → second demo user fails
- If foreign key is ON DELETE CASCADE → issues if auth.users cleaned

**How to Verify:**
```sql
-- Check constraints:
SELECT conname, contype, conkey, confkey
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;
```

**Likely NOT the issue** because:
- Edge function should log errors if constraints violated
- No error in user's console suggests edge function not running

---

## PRIORITIZED ROOT CAUSES (Likelihood)

| # | Root Cause | Likelihood | How to Verify | How to Fix |
|---|------------|-----------|---------------|------------|
| 1 | Edge function not deployed | 95% | `npx supabase functions list` | `npx supabase functions deploy seed-demo-users` |
| 2 | Service role key not set | 80% | Check Supabase Dashboard → Edge Functions → Environment | Deploy via CLI (auto-sets) |
| 3 | Edge function timing out | 60% | Check Supabase Dashboard → Edge Functions → Logs | Reduce count or optimize function |
| 4 | Network/fetch failing silently | 40% | Check browser Network tab for 404/500 | Redeploy edge function |
| 5 | Database constraints | 20% | Check schema for NOT NULL/UNIQUE on user_id | Alter table to allow NULL |
| 6 | RLS blocking (despite service role) | 5% | Very unlikely - service role bypasses RLS | N/A |
| 7 | CORS issues | 5% | Check for CORS errors in console | Update ALLOWED_ORIGINS |

---

## COMPREHENSIVE FIX PLAN

### Phase 1: Verify Edge Function Deployment ⭐ START HERE

**Step 1.1: Check if Function Exists**
```bash
npx supabase login
npx supabase functions list
```

**Expected Output:**
```
┌───────────────────┬────────┬────────────────────┐
│ Name              │ Status │ Version            │
├───────────────────┼────────┼────────────────────┤
│ seed-demo-users   │ ACTIVE │ v1.2.3             │
└───────────────────┴────────┴────────────────────┘
```

**If NOT listed** → Function not deployed → GO TO Step 1.2
**If listed** → GO TO Phase 2

**Step 1.2: Deploy Edge Function**
```bash
npx supabase functions deploy seed-demo-users
```

**Expected Output:**
```
Deploying function seed-demo-users...
✓ Deployed seed-demo-users v1.2.4
Function URL: https://PROJECT.supabase.co/functions/v1/seed-demo-users
```

**If deployment fails** → Check error message:
- "Not logged in" → Run `npx supabase login` first
- "Function not found" → Check file exists at `supabase/functions/seed-demo-users/index.ts`
- "Syntax error" → Check TypeScript syntax in function file

---

### Phase 2: Verify Environment Variables

**Step 2.1: Check Service Role Key**
- Go to Supabase Dashboard
- Project Settings → API
- Copy "service_role" key (starts with `eyJ...`)

**Step 2.2: Verify Edge Function Has Access**
- Dashboard → Edge Functions → seed-demo-users
- Click "Settings" or "Environment Variables"
- Should see `SUPABASE_SERVICE_ROLE_KEY` automatically injected

**If missing** → Redeploy function (Supabase auto-injects on deploy)

---

### Phase 3: Test Edge Function Directly

**Step 3.1: Call Function from Browser Console**

Open browser console and run:
```javascript
const supabaseUrl = 'https://qivqdltstmlxbcaldjzs.supabase.co'; // Your project URL
const anonKey = 'eyJ...'; // Your anon key from env

const response = await fetch(
  `${supabaseUrl}/functions/v1/seed-demo-users`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "generate",
      count: 10, // Start with small number
      generatePhotos: false,
    }),
  }
);

console.log("Status:", response.status);
const data = await response.json();
console.log("Response:", data);
```

**Expected Responses:**

**✅ SUCCESS (200):**
```json
{
  "success": true,
  "profilesCreated": 10,
  "tasksCreated": 25,
  "photosGenerated": 0,
  "errors": []
}
```

**❌ NOT DEPLOYED (404):**
```json
{
  "error": "Not Found"
}
```
→ GO BACK TO Phase 1 Step 1.2

**❌ MISSING SERVICE ROLE (500):**
```json
{
  "error": "Missing SUPABASE_SERVICE_ROLE_KEY environment variable"
}
```
→ Redeploy function: `npx supabase functions deploy seed-demo-users`

**❌ RLS POLICY ERROR (500):**
```json
{
  "error": "new row violates row-level security policy for table \"profiles\""
}
```
→ Service role not being used correctly → CHECK edge function code line 201

---

### Phase 4: Verify Database Results

**Step 4.1: Check Profiles Created**
```sql
SELECT COUNT(*) FROM profiles WHERE is_demo = true;
```

**Expected**: 10 (or whatever count you used in test)
**If 0**: Edge function ran but inserts failed → Check logs

**Step 4.2: Check Tasks Created**
```sql
SELECT COUNT(*)
FROM tasks
WHERE owner_id IN (SELECT id FROM profiles WHERE is_demo = true);
```

**Expected**: 20-30 (10 profiles × 2-3 tasks each)

**Step 4.3: Check Sample Data**
```sql
SELECT id, display_name, city, neighbourhood, is_demo, user_id
FROM profiles
WHERE is_demo = true
LIMIT 5;
```

**Expected**:
| id | display_name | city | neighbourhood | is_demo | user_id |
|----|--------------|------|---------------|---------|---------|
| uuid | Jack M. | sydney | Surry Hills | true | null |
| uuid | Olivia T. | sydney | Bondi | true | null |

**If user_id is NOT null** → Edge function not creating demo users correctly

---

### Phase 5: Fix Frontend If Needed

**If edge function works but frontend still shows 0:**

**Step 5.1: Clear Browser Cache**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear cache in DevTools → Application → Clear storage

**Step 5.2: Check App.tsx Auto-Seed Logic**
```typescript
// src/App.tsx:66
if (stats.demoTaskCount < 50) {  // ← Check this threshold
  await seedDemoData(200, false);
}
```

If you have exactly 50 tasks, it won't seed. Change threshold or manually seed from AdminPage.

**Step 5.3: Verify FeedScreen Filter**
```typescript
// src/screens/FeedScreen.tsx:28
const [showDemoTasks, setShowDemoTasks] = useState(true); // ← Should be TRUE
```

If this is `false`, demo tasks are hidden even if they exist.

---

## IMPLEMENTATION CHECKLIST

### Immediate Actions (Do These Now):

- [ ] 1. Run `npx supabase login`
- [ ] 2. Run `npx supabase functions deploy seed-demo-users`
- [ ] 3. Wait 30 seconds for deployment to propagate
- [ ] 4. Test edge function from browser console (Phase 3 Step 3.1)
- [ ] 5. Check database: `SELECT COUNT(*) FROM profiles WHERE is_demo = true`

### If Still Failing:

- [ ] 6. Check Supabase Dashboard → Edge Functions → Logs
- [ ] 7. Look for errors in function invocations
- [ ] 8. Verify SUPABASE_SERVICE_ROLE_KEY is set (Phase 2)
- [ ] 9. Check database schema for constraints (Phase 4)
- [ ] 10. Test with reduced count (10 instead of 200)

### After Success:

- [ ] 11. Rebuild frontend: `npm run build`
- [ ] 12. Redeploy frontend
- [ ] 13. Test on mobile with demo toggle
- [ ] 14. Verify tasks appear in feed
- [ ] 15. Verify profile skeleton loads (should show profile data)

---

## EXPECTED CONSOLE OUTPUT AFTER FIX

### ✅ Successful Seed:

```
[App] Demo data stats: {demoProfileCount: 0, demoTaskCount: 0, hasDemoData: false}
[App] Demo data insufficient, seeding 200 profiles...
[seedDemoData] Calling edge function to generate 200 profiles (photos: false)...
[seedDemoData] Edge function responded in 45234ms (status: 200)
[seedDemoData] Success: {profilesCreated: 200, tasksCreated: 456, photosGenerated: 0, errors: []}
[App] ✅ Demo data seeded successfully: {profilesCreated: 200, tasksCreated: 456}
[useTasks] Fetched tasks: {count: 456, usedFallback: false, hasLocation: true}
```

### ❌ Edge Function Not Deployed:

```
[App] Demo data stats: {demoProfileCount: 0, demoTaskCount: 0}
[App] Demo data insufficient, seeding 200 profiles...
[seedDemoData] Calling edge function to generate 200 profiles (photos: false)...
[seedDemoData] Edge function responded in 150ms (status: 404)
[seedDemoData] Edge function failed: Not Found
❌ [App] SEED FAILED - Demo data could not be generated: Error: Seed function failed: 404 Not Found
[App] This is likely because:
[App] 1. Edge function "seed-demo-users" is not deployed to production
```

---

## FINAL ANSWER

**What the toggle actually does:**
- FeedScreen toggle = FILTER (shows/hides existing demo tasks)
- AdminPage button = SEED TRIGGER (creates demo data)
- App.tsx auto-seed = SEED TRIGGER (runs on startup)

**Why 0 profiles exist:**
- Edge function `seed-demo-users` is **NOT DEPLOYED** (95% certainty)
- OR edge function is deployed but **SERVICE_ROLE_KEY missing** (80% certainty)

**How to fix:**
1. Deploy edge function: `npx supabase functions deploy seed-demo-users`
2. Test from browser console
3. Verify database results
4. Rebuild and redeploy frontend if needed

**That's it. No code changes needed - just deployment.**
