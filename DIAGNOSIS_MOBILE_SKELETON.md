# CRITICAL FAILURE DIAGNOSIS - Mobile Skeleton Loading Issue

**Date**: 2026-01-22
**Status**: 🔴 CRITICAL - Profile stuck in loading skeleton, no demo data visible
**Context**: Continuation of mobile-first architectural fixes (CP1-CP3 implemented)

---

## EXECUTIVE SUMMARY

**Issue**: Mobile app shows ProfileSkeleton loading state indefinitely. Demo data not appearing.

**Screenshot Evidence**:
- Profile tab selected (bottom nav highlighted)
- Grey skeleton boxes visible (header, stats, content areas)
- No actual profile content loaded
- No demo tasks visible in feed

**Critical Questions**:
1. Why is profile stuck in loading skeleton?
2. Why didn't demo data auto-seed?
3. Are RPC functions working?
4. Is this a deployment issue (code vs production mismatch)?

---

## POSSIBLE ROOT CAUSES (ALL MUST BE INVESTIGATED)

### Category 1: Profile Loading Failure

#### 1.1 Profile Fetch Timeout
**Code Path**: `src/contexts/AuthContext.tsx:82-125`

**Diagnosis**:
```typescript
// Line 87-97: Profile fetch with adaptive timeout
const timeout = getAdaptiveTimeout(); // Returns 5-20s based on network
const result = await withTimeout(
  supabase.from("profiles").select("*").eq("user_id", userId).single(),
  timeout,
  "Profile fetch timed out..."
);
```

**Possible Failures**:
- ❌ Network timeout (mobile on slow connection)
- ❌ RLS policy blocking profile read
- ❌ No profile exists for this user
- ❌ Database connection timeout
- ❌ Adaptive timeout too aggressive (5s on 4G might timeout on flaky mobile)

**Evidence Needed**:
- Browser console logs: `[AuthContext] Profile fetch completed in XXXXms` OR error
- Network tab: Check if request to `/rest/v1/profiles?user_id=eq.XXX` succeeds
- Database: Confirm profile row exists for authenticated user

#### 1.2 User Has No Profile
**Code Path**: `src/pages/Index.tsx:32`

**Diagnosis**:
```typescript
// Only show spinner if truly no profile
if (authState === "loading" && !profile) {
  return <div>Loading spinner...</div>;
}

// Line 53: Render skeleton if profile is null
return profile ? <ProfileScreen /> : <ProfileSkeleton />;
```

**Possible Failures**:
- ❌ User authenticated but profile not created during onboarding
- ❌ Profile creation failed silently
- ❌ User skipped onboarding somehow

**Evidence Needed**:
- Database query: `SELECT * FROM profiles WHERE user_id = 'authenticated-user-id'`
- Check if onboarding was completed
- Check localStorage: `swaami_onboarding_completed`

#### 1.3 RLS Policy Blocking Profile Access
**Database**: `profiles` table RLS policies

**Possible Failures**:
- ❌ User can't read their own profile (incorrect RLS policy)
- ❌ `user_id` column mismatch with auth user ID
- ❌ Profile exists but RLS denies access

**Evidence Needed**:
- Direct SQL query (bypass RLS): `SELECT * FROM profiles WHERE user_id = 'XXX'`
- Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'profiles'`
- Test with service role key (bypasses RLS)

---

### Category 2: Demo Data Not Seeding

#### 2.1 getDemoDataStats() Failing
**Code Path**: `src/utils/seedDemoData.ts:25-70`

**Diagnosis**:
```typescript
// Line 27-30: Count demo profiles
const { count: profileCount, error: profileError } = await supabase
  .from("profiles")
  .select("*", { count: "exact", head: true })
  .eq("is_demo", true);

// Line 52-56: Count demo tasks
const { count: taskCountResult, error: taskCountError } = await supabase
  .from("tasks")
  .select("*", { count: "exact", head: true })
  .eq("status", "open")
  .in("owner_id", demoProfileIds);
```

**Possible Failures**:
- ❌ RLS blocking anon user from reading profiles/tasks
- ❌ Query timing out on mobile network
- ❌ `is_demo` column doesn't exist (migration not run)
- ❌ Count query failing silently

**Evidence Needed**:
- Console logs: `[App] Demo data stats: { ... }` OR error
- Network tab: Check if `/rest/v1/profiles?is_demo=eq.true` request succeeds
- Database: Verify `is_demo` column exists in profiles table

#### 2.2 seedDemoData() Edge Function Failing
**Code Path**: `src/utils/seedDemoData.ts:75-110`

**Diagnosis**:
```typescript
// Line 87-101: Fetch edge function
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
      count: 200,
      generatePhotos: false,
    }),
  }
);

if (!response.ok) {
  throw new Error(`Seed function failed: ${response.status} ${errorText}`);
}
```

**Possible Failures**:
- ❌ Edge function not deployed to production
- ❌ CORS blocking fetch request
- ❌ Anon key unauthorized (edge function requires auth)
- ❌ Edge function timeout (generating 200 profiles takes time)
- ❌ Service role key not configured in edge function environment
- ❌ Network timeout on mobile before function completes
- ❌ Supabase Edge Functions feature not enabled in project

**Evidence Needed**:
- Console logs: `[App] Demo data seeded successfully` OR error
- Network tab: Check if POST to `/functions/v1/seed-demo-users` succeeds
- Response status: 200 = success, 401 = unauthorized, 404 = not deployed, 500 = error
- Supabase dashboard: Check if edge functions are deployed
- Check edge function logs in Supabase dashboard

#### 2.3 Demo Data Exists But Not Visible
**Code Path**: `src/screens/FeedScreen.tsx:94`

**Diagnosis**:
```typescript
// Client-side filter for demo toggle
const filteredTasks = tasks.filter((t) => showDemoTasks || !t.is_demo);
```

**Possible Failures**:
- ❌ Demo tasks exist but `showDemoTasks` is false
- ❌ Demo tasks exist but `is_demo` field is null (not true)
- ❌ Demo tasks exist but client-side filter has logic error
- ❌ Tasks loaded but not rendering due to other filter (category, distance, search)

**Evidence Needed**:
- Console logs: Task array content
- Check `showDemoTasks` state value
- Database: Count tasks with `is_demo = true`
- Network response: Check if tasks in response have `owner_is_demo = true`

---

### Category 3: RPC Functions Failing

#### 3.1 get_nearby_tasks Not Returning Results
**Database**: `public.get_nearby_tasks()`

**Possible Failures**:
- ❌ Function not deployed to production database
- ❌ User has no location data (lat/lng)
- ❌ Function timeout on complex distance calculation
- ❌ RLS blocking task access (even with SECURITY DEFINER)
- ❌ Demo tasks have NULL location_lat/location_lng
- ❌ Distance calculation excluding demo tasks

**Evidence Needed**:
- Console logs: `[useTasks] Fetching nearby tasks for location: {...}`
- Console logs: `[useTasks] Fetched tasks: { count: X, ... }`
- Network tab: Check `/rest/v1/rpc/get_nearby_tasks` response
- Database: `SELECT * FROM tasks WHERE is_demo = true` - check location fields

#### 3.2 get_public_tasks Not Returning Results
**Database**: `public.get_public_tasks()`

**Possible Failures**:
- ❌ Function not deployed
- ❌ RLS blocking even with SECURITY DEFINER
- ❌ No tasks in database with status = 'open'
- ❌ Function timeout

**Evidence Needed**:
- Console logs: Fallback to get_public_tasks message
- Network tab: Check `/rest/v1/rpc/get_public_tasks` response
- Database: `SELECT COUNT(*) FROM tasks WHERE status = 'open'`

---

### Category 4: Deployment Mismatch

#### 4.1 Code Deployed But Database Migrations Not Run
**Possible Failures**:
- ❌ RPC functions not deployed (migration file not applied)
- ❌ `is_demo` column not added to profiles/tasks
- ❌ Edge function deployed locally but not in production
- ❌ RLS policies not updated

**Evidence Needed**:
- Supabase dashboard: Check migration history
- Database: `SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'`
- Look for: `is_demo` column
- Database: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'`
- Look for: `get_nearby_tasks`, `get_public_tasks`, `seed-demo-users`

#### 4.2 Environment Variables Not Set
**Possible Failures**:
- ❌ `VITE_SUPABASE_URL` not set in production build
- ❌ `VITE_SUPABASE_PUBLISHABLE_KEY` not set
- ❌ Edge function service role key not configured
- ❌ Environment mismatch (dev vs staging vs production)

**Evidence Needed**:
- Console logs: Check for "Missing VITE_SUPABASE_URL" error
- Network tab: Check if API calls go to correct Supabase URL
- Build logs: Verify environment variables injected at build time

#### 4.3 Cached Bundle Running Old Code
**Possible Failures**:
- ❌ Mobile PWA running cached bundle from before fixes
- ❌ Our implemented code not actually deployed
- ❌ User's browser cache serving old JavaScript
- ❌ Service worker caching old app shell

**Evidence Needed**:
- Version check: See if console logs match new code patterns
- Look for: `[App] Demo data stats:` - this is NEW code
- Look for: `[Retry] Starting get_nearby_tasks` - this is NEW code
- Hard refresh test: Ctrl+Shift+R or clear cache

---

### Category 5: Network/Mobile-Specific Issues

#### 5.1 Mobile Network Too Slow
**Possible Failures**:
- ❌ All requests timing out on 2G/poor connection
- ❌ Adaptive timeout still too aggressive for this network
- ❌ Retries exhausted (5 attempts all failed)
- ❌ Edge function call takes >30s on slow mobile

**Evidence Needed**:
- Console logs: `[Retry] X failed after Y attempts:`
- Network tab: Check request durations
- Connection indicator: Check if app shows "Slow connection" banner

#### 5.2 User Offline When Page Loaded
**Possible Failures**:
- ❌ User was offline when app initialized
- ❌ Offline banner showing (red "You're offline" banner)
- ❌ All API calls failing immediately
- ❌ Skeleton showing because fetch never completed

**Evidence Needed**:
- Check for offline banner at top of screen
- Console logs: Network quality detection
- `navigator.onLine` value

---

## VERIFICATION CHECKLIST

### Step 1: Check Browser Console
```
Expected logs (if working):
[App] Demo data stats: { demoProfileCount: X, demoTaskCount: Y }
[App] Demo data sufficient: Y tasks
[AuthContext] Network quality: excellent, using timeout: 5000ms
[AuthContext] Auth session fetched in XXXXms
[AuthContext] User found, fetching profile in background...
[AuthContext] Auth init complete (UI unblocked) in XXXXms
[AuthContext] Profile fetch completed in YYYYms
[useTasks] Fetching nearby tasks...
[Retry] Starting get_nearby_tasks...
[useTasks] Fetched tasks: { count: Z }

Error patterns (if broken):
[App] Failed to seed demo data: [ERROR]
[AuthContext] Profile fetch failed after XXXXms: [ERROR]
[Retry] get_nearby_tasks failed after 5 attempts: [ERROR]
```

### Step 2: Check Network Tab
```
Requests to verify:
1. POST /functions/v1/seed-demo-users
   - Status: 200 = success, 404 = not deployed, 401 = unauthorized
   - Response: { success: true, profilesCreated: X, tasksCreated: Y }

2. GET /rest/v1/profiles?user_id=eq.XXX
   - Status: 200 = success, empty array = no profile
   - Response: [{ id, display_name, ... }]

3. POST /rest/v1/rpc/get_nearby_tasks OR get_public_tasks
   - Status: 200 = success, 404 = function doesn't exist
   - Response: [{ id, title, owner_is_demo, ... }]

4. GET /rest/v1/profiles?is_demo=eq.true&select=*
   - Check count header for number of demo profiles
```

### Step 3: Check Database Directly
```sql
-- Check if demo profiles exist
SELECT COUNT(*) as demo_profile_count
FROM profiles
WHERE is_demo = true;

-- Check if demo tasks exist
SELECT COUNT(*) as demo_task_count
FROM tasks t
JOIN profiles p ON t.owner_id = p.id
WHERE p.is_demo = true AND t.status = 'open';

-- Check if current user has profile
SELECT * FROM profiles WHERE user_id = auth.uid();

-- Check if RPC functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_nearby_tasks', 'get_public_tasks');

-- Check if is_demo column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_demo';
```

### Step 4: Test Individual Functions
```javascript
// In browser console (after opening /app)

// Test 1: Check demo data stats
const { getDemoDataStats } = await import('/src/utils/seedDemoData.ts');
const stats = await getDemoDataStats();
console.log('Demo stats:', stats);
// Expected: { demoProfileCount: X, demoTaskCount: Y }
// If error: RLS blocking, network timeout, or column doesn't exist

// Test 2: Manually seed demo data
const { seedDemoData } = await import('/src/utils/seedDemoData.ts');
const result = await seedDemoData(10, false); // Just 10 for testing
console.log('Seed result:', result);
// Expected: { success: true, profilesCreated: 10, tasksCreated: X }
// If error: Check error message for clues

// Test 3: Get network quality
const { getNetworkQuality } = await import('/src/lib/networkDetection.ts');
console.log('Network:', getNetworkQuality());
// Expected: { quality: 'excellent'/'good'/'poor'/'offline', ... }

// Test 4: Fetch profile directly
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
  .single();
console.log('Profile:', data, error);
// Expected: Profile object
// If null: User has no profile (onboarding not completed)
// If error: RLS blocking or other database issue
```

---

## REQUIRED INFORMATION FROM USER

To diagnose accurately, I need:

1. **Browser Console Logs** (can't access on mobile screenshot)
   - Open Chrome DevTools on mobile: `chrome://inspect`
   - Or use remote debugging
   - Look for logs starting with `[App]`, `[AuthContext]`, `[Retry]`, `[useTasks]`

2. **Network Tab Details**
   - Status codes for: `/functions/v1/seed-demo-users`, `/rest/v1/profiles`, `/rest/v1/rpc/*`
   - Response bodies (especially errors)
   - Request/response timings

3. **Supabase Dashboard Info**
   - Are edge functions deployed in production?
   - Are migrations applied? (Table Editor → check `profiles.is_demo` column exists)
   - What are the RLS policies on `profiles` and `tasks` tables?
   - Any errors in Edge Functions logs?

4. **Environment Info**
   - Is this on deployed production URL or local dev?
   - What's the Supabase project URL?
   - Are you testing as authenticated user or anonymous?

---

## MOST LIKELY CULPRITS (Prioritized)

### #1 (90% likelihood): Demo Data Not Seeded
- **Why**: Edge function call might be failing silently
- **Test**: Check console for `[App] Demo data stats:` log
- **Fix if**: Stats show 0 tasks, but no error logged

### #2 (80% likelihood): RLS Blocking Anonymous Access
- **Why**: Anonymous users can't read profiles/tasks with is_demo=true
- **Test**: Check network tab for 403 responses
- **Fix if**: RLS policy needs adjustment for demo data

### #3 (70% likelihood): Profile Fetch Timing Out
- **Why**: Mobile network too slow, adaptive timeout still failing
- **Test**: Check console for timeout errors
- **Fix if**: Need to increase timeout further or show better loading state

### #4 (60% likelihood): Edge Function Not Deployed
- **Why**: Local code works, production doesn't have the function
- **Test**: Network tab shows 404 for `/functions/v1/seed-demo-users`
- **Fix if**: Deploy edge functions to production

### #5 (50% likelihood): Cached Old Code Running
- **Why**: Mobile PWA cached before our fixes
- **Test**: Hard refresh or clear cache, see if behavior changes
- **Fix if**: Implement CP4 (service worker) for cache control

---

## NEXT STEPS (DO NOT EDIT CODE YET)

1. **Gather Evidence** (User must provide):
   - Console logs
   - Network tab screenshots
   - Supabase dashboard screenshots

2. **Run Verification Tests** (User can do in browser console):
   - Test getDemoDataStats()
   - Test seedDemoData(10, false)
   - Test direct profile query
   - Check network quality

3. **Database Inspection** (User or I can check):
   - Verify is_demo column exists
   - Verify RPC functions exist
   - Count demo profiles/tasks
   - Check RLS policies

4. **Create Targeted Fix** (After evidence gathered):
   - If demo data missing → Diagnose why seeding failed
   - If profile stuck → Diagnose profile fetch issue
   - If RLS blocking → Fix policies
   - If deployment mismatch → Deploy missing pieces

**NO CODE CHANGES UNTIL WE HAVE EVIDENCE.**
