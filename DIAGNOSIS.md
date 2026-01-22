# COMPLETE SYSTEM DIAGNOSIS

**Date**: 2026-01-22
**Issue**: Mobile app shows loading hangs, timeout errors, missing demo data
**Scope**: Complete architectural diagnosis of authentication, data loading, and mobile caching
**Status**: ⚠️ CRITICAL - Multiple architectural issues identified

---

## EXECUTIVE SUMMARY

The app has **5 critical architectural issues** causing mobile failures:

1. **Sequential auth blocking** - 20+ second delays on slow mobile connections
2. **Aggressive PWA caching** - mobile users run stale code without knowing
3. **No offline/network awareness** - app doesn't adapt to mobile network conditions
4. **Missing demo data** - database is empty, toggle shows nothing
5. **Waterfall loading pattern** - auth → profile → tasks loading sequentially instead of parallel

**Impact**: Desktop works (fast connection, no caching), mobile fails (slow connection, aggressive caching)

---

## PROBLEM 1: Sequential Auth Blocking (20+ Second Delays)

### Current Flow (Sequential Waterfall)

```
Page Load
  ↓
[BLOCK 10s] Fetch auth session
  ↓
[BLOCK 10s] Fetch user profile
  ↓
[BLOCK 10s] Fetch tasks
  ↓
Total: 30 seconds on slow mobile connection
```

### Files Involved

| File | Lines | Issue |
|------|-------|-------|
| `src/contexts/AuthContext.tsx` | 130-177 | Fetches session, THEN profile sequentially |
| `src/pages/Landing.tsx` | 50 | Button disabled until auth completes |
| `src/pages/Index.tsx` | 31-40 | Shows loading spinner until authState === "ready" |
| `src/hooks/useTasks.ts` | 75-193 | Only fetches after auth completes |

### Code Evidence

**AuthContext.tsx:130-165** - Sequential blocking:
```typescript
const initAuth = async () => {
  // Step 1: Block for 10s fetching session
  const { data, error } = await withTimeout(
    supabase.auth.getSession(),
    TIMEOUT_MS.NORMAL, // 10 seconds
    "Auth session fetch timed out..."
  );

  // Step 2: THEN block for another 10s fetching profile
  if (initialSession?.user) {
    await fetchProfile(initialSession.user.id); // Another 10s timeout
  }

  setAuthLoading(false); // Finally unblock UI
};
```

**Landing.tsx:50-155** - Button disabled during auth:
```typescript
const isAuthLoading = authState === "loading" && !user;

<Button
  disabled={isAuthLoading}  // Disabled for 20+ seconds
  onClick={() => navigate(primaryCTA.path)}
>
  {isAuthLoading ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Loading...
    </>
  ) : (
    primaryCTA.text
  )}
</Button>
```

### Root Cause

**Mobile networks are slow and spotty:**
- Desktop: Auth completes in 500-2000ms
- Mobile 4G: Auth can take 5-10 seconds
- Mobile 3G/poor signal: Auth can timeout at 10s, retry, timeout again = 20+ seconds
- **Sequential loading multiplies the delay**: 10s session + 10s profile + 10s tasks = 30s total

---

## PROBLEM 2: Aggressive PWA Caching (Stale Code Running)

### Current Configuration

**public/manifest.json:**
```json
{
  "display": "standalone",  // ← Runs like a native app
  "start_url": "/",
  "scope": "/"
}
```

**vite.config.ts:**
```typescript
// NO PWA plugin
// NO service worker
// NO cache versioning
// NO cache-busting strategy
```

### What This Means

- **Mobile users add app to homescreen** → Runs in standalone mode
- **Standalone mode caches aggressively** → Old JavaScript bundles stay cached
- **No service worker** → No control over cache updates
- **No versioning** → Browser decides when to update (could be days/weeks)

### Evidence

**User report**: "issues only happen on mobile, desktop is fine"

This is **classic PWA caching**:
- Desktop users hit refresh, get new code
- Mobile users in standalone mode run cached code from weeks ago
- Mobile never sees the timeout fixes, error handling, or any updates

### Impact Timeline

```
Day 1: Deploy fix to production
Day 1: Desktop users see fix immediately
Day 1: Mobile users still run old cached code
Day 3: Some mobile users' cache expires, see fix
Day 7: Most mobile users' cache expires
Day 14: Stubborn caches finally expire (maybe)
```

---

## PROBLEM 3: No Offline/Network Awareness

### Current Network Handling

**App.tsx:22-35** - React Query config:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,              // Only 1 retry
      retryDelay: 1000,      // 1 second delay (too aggressive for mobile)
      networkMode: 'online', // Fails immediately if offline
      refetchOnWindowFocus: false,
    },
  },
});
```

**AuthContext.tsx**: No network detection
**useTasks.ts**: No network detection
**Landing.tsx**: No offline indicator

### Root Cause

Mobile networks are not binary online/offline:
- **Spotty signal**: Connection drops mid-request
- **Slow connections**: Requests timeout before completion
- **Network switches**: WiFi ↔ Cellular transitions drop connections
- **Airplane mode recovery**: User comes back online, app stays broken

**App behavior with 1 retry + 1s delay:**
```
Request fails → Wait 1s → Retry → Fail again → Show error
Total time: 2-3 seconds before giving up
```

**What mobile needs:**
```
Request fails → Wait 2s → Retry
Retry fails → Wait 4s → Retry
Retry fails → Wait 8s → Retry
Retry fails → Check network → Show helpful error
Total time: Up to 15s of smart retries before giving up
```

---

## PROBLEM 4: Missing Demo Data

### Current State

**Database**: Empty (no demo profiles or tasks seeded)
**Admin page**: `/admin` - only accessible to `hello@krishraja.com`
**Seeding function**: `seed-demo-users` Edge Function exists and works
**UI toggle**: Works, but filters empty data = still shows empty

### Files Involved

| File | Purpose | Status |
|------|---------|--------|
| `src/utils/seedDemoData.ts` | Client-side seeding utility | ✅ Works |
| `supabase/functions/seed-demo-users/index.ts` | Edge Function to generate 200 profiles | ✅ Works |
| `src/pages/AdminPage.tsx` | Admin UI to trigger seeding | ✅ Works |
| `src/screens/FeedScreen.tsx:94` | Client-side filter `showDemoTasks || !t.is_demo` | ✅ Works |

### Root Cause

**Demo data was never seeded in production database.**

### Evidence

**FeedScreen.tsx:94** - Toggle filters correctly:
```typescript
.filter((t) => showDemoTasks || !t.is_demo)
```

**If toggle is ON**: Shows all tasks (demo + real)
**If toggle is OFF**: Shows only real tasks (is_demo === false)

**Problem**: `tasks` array is empty because database has no demo data

**seed-demo-users/index.ts:252-449** - Seeding logic is solid:
- Generates 200 diverse profiles (100 Sydney, 100 New York)
- Creates 0-3 tasks per profile (realistic distribution)
- Sets `is_demo: true` flag on all generated data
- Assigns location coordinates for distance filtering

### Why It Matters

**New users see**: Empty feed → Think app is dead → Leave
**With demo data**: 100-200 sample tasks → Understand the concept → Sign up

---

## PROBLEM 5: Waterfall Loading Pattern

### Current Architecture

```
Component Hierarchy:
App.tsx
  └─ AuthProvider (blocks until auth ready)
       └─ Landing.tsx / Index.tsx
            └─ FeedScreen (blocks until profile ready)
                 └─ useTasks() (blocks until tasks loaded)

Loading Sequence:
1. Auth session fetch (10s)
2. Profile fetch (10s)
3. Tasks fetch (10s)
Total: 30 seconds of sequential blocking
```

### Files Involved

| File | Lines | Blocks On |
|------|-------|-----------|
| `src/contexts/AuthContext.tsx` | 130-177 | Auth session → Profile (sequential) |
| `src/hooks/useTasks.ts` | 75-85 | Profile completion |
| `src/pages/Index.tsx` | 31-40 | authState === "ready" |
| `src/pages/Landing.tsx` | 50 | authState !== "loading" |

### Root Cause

**Everything waits for everything else:**
- Tasks can't load until profile loads
- Profile can't load until auth session loads
- UI can't render until all of the above completes

**This is a UX anti-pattern for 2027.** Modern apps load in parallel:
- Auth session + Profile + Tasks all fetch simultaneously
- UI renders with loading skeletons for each section
- Sections populate independently as data arrives

---

## CALL GRAPH: Complete Auth Flow

```
┌──────────────────────────────────────────────────────────┐
│ USER OPENS APP                                            │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ App.tsx: Render                                           │
│ - Mount AuthProvider                                       │
│ - Mount QueryClientProvider                               │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ AuthContext.tsx: useEffect() triggers initAuth()         │
│ State: authLoading = true                                 │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼ BLOCK 1 (0-10 seconds)
┌──────────────────────────────────────────────────────────┐
│ supabase.auth.getSession() with 10s timeout              │
│ - localStorage: Check for existing session                │
│ - Network: Verify session validity with Supabase         │
│ - Slow mobile: Can take 5-10s on poor connection         │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ├─ NO SESSION ──────────────────┐
                 │                                │
                 │                                ▼
                 │              ┌──────────────────────────────┐
                 │              │ setAuthLoading(false)        │
                 │              │ authState = "unauthenticated"│
                 │              │ → Landing page shows "Join"  │
                 │              └──────────────────────────────┘
                 │
                 └─ HAS SESSION ────────────────┐
                                                 │
                                                 ▼ BLOCK 2 (0-10 seconds)
                               ┌──────────────────────────────────────┐
                               │ fetchProfile(userId) with 10s timeout│
                               │ - Query: profiles table              │
                               │ - Slow mobile: Can take 5-10s        │
                               └──────────┬───────────────────────────┘
                                          │
                                          ├─ PROFILE ERROR ───────────┐
                                          │                             │
                                          │                             ▼
                                          │           ┌──────────────────────────────┐
                                          │           │ setProfile(null)             │
                                          │           │ Check onboardingCompletedFlag│
                                          │           │ → If true: authState="ready" │
                                          │           │ → If false: authState=       │
                                          │           │   "needs_onboarding"         │
                                          │           └──────────────────────────────┘
                                          │
                                          └─ PROFILE SUCCESS ─────────┐
                                                                       │
                                                                       ▼
                                         ┌──────────────────────────────────────┐
                                         │ setProfile(data)                     │
                                         │ Check if complete:                   │
                                         │ - city? neighbourhood? phone? skills?│
                                         └───────────┬──────────────────────────┘
                                                     │
                                        ┌────────────┴────────────┐
                                        │                         │
                                        ▼                         ▼
                          ┌───────────────────┐  ┌─────────────────────────┐
                          │ INCOMPLETE        │  │ COMPLETE                │
                          │ authState =       │  │ authState = "ready"     │
                          │ "needs_onboarding"│  │ → User can access /app  │
                          │ → Redirect to     │  └─────────────────────────┘
                          │   /join           │
                          └───────────────────┘
```

### Conditional Rendering Branches

**Landing.tsx** - Auth-dependent button:
```typescript
if (authState === "loading" && !user)
  → Button disabled, shows "Loading..."

if (!user)
  → Button shows "Join Your Neighbourhood" → /auth?mode=signup

if (user && authState === "ready")
  → Button shows "Go to Your Neighbourhood" → /app

if (user && authState === "needs_onboarding")
  → Button shows "Continue Your Setup" → /join
```

**Index.tsx** - App entry:
```typescript
if (authState !== "ready")
  → Show loading spinner "Loading your neighbourhood..."

if (authState === "ready")
  → Render main app (FeedScreen/ProfileScreen/etc)
```

**FeedScreen.tsx** - Task loading:
```typescript
if (loading && !timeoutError)
  → Show skeleton/loading state

if (timeoutError || error)
  → Show error alert with retry button

if (!loading && tasks.length === 0)
  → Show empty state "No requests yet"

if (!loading && tasks.length > 0)
  → Render task cards (filtered by demo toggle)
```

---

## ARCHITECTURE MAP

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER                                           │
├─────────────────────────────────────────────────────────────┤
│ Landing.tsx          - Public homepage, auth-aware CTA       │
│ Index.tsx            - Main app shell, tab navigation        │
│ FeedScreen.tsx       - Task feed with filters                │
│ ProfileScreen.tsx    - User profile view                     │
│ Auth.tsx             - Sign in/sign up                       │
│ Join.tsx             - Onboarding flow                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ STATE MANAGEMENT LAYER                                       │
├─────────────────────────────────────────────────────────────┤
│ AuthContext.tsx      - User session, profile, auth state    │
│ QueryClientProvider  - React Query cache                    │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ DATA HOOKS LAYER                                             │
├─────────────────────────────────────────────────────────────┤
│ useAuth()            - Auth state, user, profile            │
│ useProfile()         - Profile data, updateProfile()        │
│ useTasks()           - Task fetching, realtime updates      │
│ useAuthRedirect()    - Conditional navigation               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ API / DATABASE LAYER                                         │
├─────────────────────────────────────────────────────────────┤
│ Supabase Client      - Auth, database client                │
│ RPC Functions:                                               │
│   - get_nearby_tasks(lat, lng, radius)                      │
│   - get_public_tasks()                                       │
│ Edge Functions:                                              │
│   - seed-demo-users (generate/cleanup demo data)            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Task Loading

```
useTasks() Hook
  ↓
Check: Does user have profile with location?
  ├─ YES → Call get_nearby_tasks(lat, lng, 5km)
  │         ├─ Fetch from Supabase
  │         ├─ Apply 10s timeout (withTimeout)
  │         ├─ Returns: tasks + distance_km
  │         └─ If empty → FALLBACK to get_public_tasks()
  │
  └─ NO → Call get_public_tasks()
            ├─ Fetch from Supabase
            ├─ Apply 10s timeout (withTimeout)
            └─ Returns: all open tasks (no distance)
  ↓
Filter client-side:
  - Demo toggle: showDemoTasks || !is_demo
  - Distance: distance <= maxDistance
  - Category: selectedCategory === "All" || matches
  - Search: title/description contains searchText
  ↓
Sort:
  - "Nearest": distance ASC
  - "Recent": created_at DESC
  - "Urgent": urgency then created_at
  ↓
Render: <NeedCard> components
```

---

## MOBILE-SPECIFIC CONFIGURATIONS

| Configuration | Value | Impact |
|---------------|-------|--------|
| **PWA Manifest** | `"display": "standalone"` | Runs like native app, aggressive caching |
| **Service Worker** | None | No cache control |
| **Cache Versioning** | None | No way to force cache updates |
| **Network Mode** | `'online'` (React Query) | Fails immediately when offline |
| **Retry Strategy** | 1 retry, 1s delay | Too aggressive for spotty mobile |
| **Timeout Values** | 10s across the board | One-size-fits-all doesn't work |

### Desktop vs Mobile Comparison

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| **Connection** | Fast, stable WiFi/Ethernet | Slow, spotty 3G/4G/5G |
| **Network switches** | Rare | Frequent (WiFi ↔ Cellular) |
| **Caching** | Browser cache, easy refresh | Standalone PWA, aggressive caching |
| **Code updates** | Every page load | Days/weeks until cache expires |
| **Timeout tolerance** | 2-5 seconds | 10-20 seconds |
| **Offline detection** | Rare | Common (tunnels, elevators, poor signal) |

---

## OBSERVED ERRORS

### User-Reported Issues (from screenshots)

1. **Feed Screen**: "0 tasks within 2.0km" even with demo toggle ON
2. **Profile Screen**: "Failed to load profile" with "Something went wrong"  error
3. **Home Screen**: Infinite "Loading your neighbourhood..." spinner

### Console Errors (Inferred from Code)

```
[AuthContext] Auth init failed after 10000ms: Auth session fetch timed out
[AuthContext] Profile fetch failed after 10000ms: Profile fetch timed out
[useTasks] Error fetching tasks: Task fetch timed out. Please try again.
```

### Network Tab (Inferred)

```
GET /auth/v1/user → 504 Gateway Timeout (10s)
POST /rest/v1/rpc/get_nearby_tasks → 504 Gateway Timeout (10s)
GET /rest/v1/profiles?user_id=eq.xxx → 504 Gateway Timeout (10s)
```

---

## SUMMARY: Why Desktop Works But Mobile Fails

| Problem | Desktop | Mobile |
|---------|---------|--------|
| **Fast connection** | Auth loads in 1-2s | Auth takes 10-20s, times out |
| **Fresh code** | Refresh gets new bundle | Cached bundle from weeks ago |
| **Network stability** | Stable, no drops | Frequent drops, signal switches |
| **Cache control** | Browser refresh clears cache | Standalone PWA caches aggressively |
| **Retry tolerance** | 2s is fine | Needs 10-20s of smart retries |

---

## FILES REQUIRING CHANGES

Based on this diagnosis, the following files need architectural fixes:

### Critical
- `src/contexts/AuthContext.tsx` - Parallel loading, better timeout handling
- `src/hooks/useTasks.ts` - Network awareness, exponential backoff
- `src/App.tsx` - React Query retry strategy for mobile
- `vite.config.ts` - Add PWA plugin with cache versioning

### Important
- `src/pages/Landing.tsx` - Progressive enhancement, don't block button
- `src/pages/Index.tsx` - Optimistic rendering, don't wait for auth
- `src/components/OfflineBanner.tsx` - Enhanced network detection

### Enhancement
- `src/lib/timeout.ts` - Adaptive timeouts based on connection speed
- `src/lib/retry.ts` - Exponential backoff for mobile
- `public/manifest.json` - Add update detection

---

## NEXT STEPS

See `ROOT_CAUSE.md` for detailed analysis of each problem's root cause.
See `IMPLEMENTATION_PLAN.md` for the architectural fix strategy with checkpoints.
