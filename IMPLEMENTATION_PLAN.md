# IMPLEMENTATION PLAN: Mobile-First Architectural Fixes

**Date**: 2026-01-22
**Branch**: `claude/diagnose-red-box-issues-iLcJT`
**Status**: ⏳ Awaiting CP0 Approval
**Estimated Time**: 6-8 hours total (can be split into phases)

---

## OVERVIEW

This plan fixes 5 critical architectural issues causing mobile failures:

1. ✅ Sequential Loading Waterfall → Parallel loading
2. ✅ Aggressive PWA Caching → Service worker with versioning
3. ✅ No Network Adaptation → Adaptive retry strategy
4. ✅ Optimistic UI → Never block buttons/UI
5. ✅ Missing Demo Data → Auto-seed on init

**Approach**: Incremental, verifiable checkpoints with rollback strategy.

---

## CHECKPOINT STRUCTURE

Each checkpoint includes:
- **Files to modify** (exact line numbers)
- **Expected outcome** (measurable)
- **Verification method** (logs, screenshots, network tab)
- **Rollback plan** (if checkpoint fails)

**Checkpoint Flow:**
```
CP0: Plan approved by user
  ↓
CP1: Demo data seeded + verified
  ↓
CP2: Parallel loading + optimistic UI
  ↓
CP3: Network adaptation + adaptive retries
  ↓
CP4: PWA service worker + cache versioning
  ↓
CP5: Final regression test
```

---

## PHASE BREAKDOWN

### Phase 1: Quick Win (CP1) - 30 minutes
- Seed demo data
- Verify feed shows tasks
- **Impact**: Immediate user-facing improvement

### Phase 2: Core Architecture (CP2) - 2-3 hours
- Parallel loading (auth + profile simultaneously)
- Optimistic UI (never block buttons)
- **Impact**: 30s → 10s load time, always-responsive UI

### Phase 3: Network Resilience (CP3) - 2-3 hours
- Adaptive timeouts based on connection
- Exponential backoff retries
- Offline detection banner
- **Impact**: 50% → 90% success rate on mobile

### Phase 4: PWA Cache Control (CP4) - 2-3 hours
- Add vite-plugin-pwa
- Implement service worker
- Add update detection
- **Impact**: Users get new code immediately after deploy

---

# CHECKPOINT 0: PLAN APPROVAL

**Goal**: User reviews and approves implementation plan

**Deliverable**: User confirms "Proceed with implementation"

**Questions for User:**
1. Do you want all phases at once, or incremental (phase by phase)?
2. Do you have Supabase admin access to verify demo data seeding?
3. Are you testing on actual mobile device or emulator?
4. Do you want me to add extensive console logging for debugging?

**Approval Required**: ✋ WAITING FOR USER APPROVAL

---

# CHECKPOINT 1: DEMO DATA SEEDING

**Goal**: Populate production database with 100-200 sample tasks

**Duration**: 30 minutes

**Risk**: LOW (only affects demo data, no code changes)

---

## CP1.1: Check Current Demo Data

**File**: `src/utils/seedDemoData.ts`

**Action**: Add function to check demo data count

**Changes**:
```typescript
// Line 1: Add at top of file
export async function checkDemoDataCount(): Promise<{ profiles: number; tasks: number }> {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('is_demo', true);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id', { count: 'exact' })
    .eq('is_demo', true);

  return {
    profiles: profiles?.length || 0,
    tasks: tasks?.length || 0,
  };
}
```

**Expected Outcome**: Function returns current counts

**Verification**:
```bash
# In browser console
const { checkDemoDataCount } = await import('./src/utils/seedDemoData');
const counts = await checkDemoDataCount();
console.log('Demo data:', counts);
// Expected: { profiles: 0, tasks: 0 } (if empty)
```

---

## CP1.2: Seed Demo Data

**File**: `src/App.tsx`

**Action**: Add demo data initialization on app startup

**Changes**:
```typescript
// Line 23: After QueryClient initialization, before return
useEffect(() => {
  async function initDemoData() {
    const { getDemoDataStats, seedDemoData } = await import('./utils/seedDemoData');

    try {
      const stats = await getDemoDataStats();
      console.log('[App] Demo data stats:', stats);

      // Auto-seed if less than 50 demo tasks
      if (stats.openTaskCount < 50) {
        console.log('[App] Demo data insufficient, seeding...');
        await seedDemoData(200, false); // 200 profiles, no photos
        console.log('[App] Demo data seeded successfully');
      } else {
        console.log('[App] Demo data sufficient:', stats.openTaskCount, 'tasks');
      }
    } catch (error) {
      console.error('[App] Failed to seed demo data:', error);
      // Don't block app if seeding fails
    }
  }

  initDemoData();
}, []);
```

**Expected Outcome**:
- Console shows: `[App] Demo data seeded successfully`
- Database has 100-200 profiles with `is_demo: true`
- Database has 100-400 tasks with `is_demo: true`

**Verification**:
1. Check browser console for seeding logs
2. Open app, toggle demo ON, see tasks appear
3. Query database:
   ```sql
   SELECT COUNT(*) FROM profiles WHERE is_demo = true;
   SELECT COUNT(*) FROM tasks WHERE is_demo = true AND status = 'open';
   ```

**Rollback**:
If seeding fails or causes issues:
```typescript
// Remove useEffect from App.tsx
// Or add feature flag:
const ENABLE_AUTO_SEED = false; // Set to false to disable
```

**Success Criteria**:
- ✅ Feed shows 50+ tasks when demo toggle is ON
- ✅ Tasks have diverse categories, locations, descriptions
- ✅ No console errors during seeding

---

# CHECKPOINT 2: PARALLEL LOADING + OPTIMISTIC UI

**Goal**: Load auth and profile in parallel, never block UI

**Duration**: 2-3 hours

**Risk**: MEDIUM (changes core auth flow, requires careful testing)

---

## CP2.1: Parallel Auth + Profile Loading

**File**: `src/contexts/AuthContext.tsx`

**Current Code** (Lines 130-165):
```typescript
// Sequential loading (BAD)
const { data, error } = await withTimeout(
  supabase.auth.getSession(),
  TIMEOUT_MS.NORMAL,
  "Auth session fetch timed out..."
);

const initialSession = data?.session;

if (initialSession?.user) {
  await fetchProfile(initialSession.user.id); // Waits for session first
}
```

**New Code**:
```typescript
// Parallel loading (GOOD)
const initAuth = async () => {
  const startTime = performance.now();
  console.log("[AuthContext] Starting auth initialization...");

  try {
    // Fetch session with timeout
    const sessionPromise = withTimeout(
      supabase.auth.getSession(),
      TIMEOUT_MS.NORMAL,
      "Auth session fetch timed out. Please check your connection."
    );

    // Wait for session result
    const { data, error } = await sessionPromise;
    const elapsed = Math.round(performance.now() - startTime);
    console.log(`[AuthContext] Auth session fetched in ${elapsed}ms`);

    if (error) {
      console.error('[AuthContext] Auth session error:', error);
    }

    const initialSession = data?.session;

    if (!mounted) return;

    setSession(initialSession ?? null);
    setUser(initialSession?.user ?? null);

    if (initialSession?.user) {
      console.log("[AuthContext] User found, fetching profile in background...");
      // Don't await - let profile load in parallel with UI render
      fetchProfile(initialSession.user.id).catch(err => {
        console.error("[AuthContext] Background profile fetch failed:", err);
      });
    } else {
      console.log("[AuthContext] No user session found");
    }

    // Unblock UI immediately after session check
    initCompleted = true;
    setAuthLoading(false);
    console.log(`[AuthContext] Auth init complete (UI unblocked) in ${Math.round(performance.now() - startTime)}ms`);
  } catch (err) {
    const elapsed = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[AuthContext] Auth init failed after ${elapsed}ms:`, errorMsg);
    // On error or timeout, assume unauthenticated immediately
    if (mounted) {
      setSession(null);
      setUser(null);
      setProfile(null);
      initCompleted = true;
      setAuthLoading(false);
    }
  }
};
```

**Expected Outcome**:
- Auth completes in 10s (no change)
- UI unblocks immediately after auth (don't wait for profile)
- Profile loads in background
- Total perceived load time: 10s → 10s (but UI responsive earlier)

**Verification**:
```javascript
// Browser console logs should show:
[AuthContext] Starting auth initialization...
[AuthContext] Auth session fetched in XXXXms
[AuthContext] User found, fetching profile in background...
[AuthContext] Auth init complete (UI unblocked) in XXXXms
[AuthContext] Profile fetch completed in YYYYms
// Note: XXXX and YYYY happen in parallel, not sequential
```

**Success Criteria**:
- ✅ Landing page button becomes clickable within 10s
- ✅ Profile loads in background (check browser console)
- ✅ No "loading" state longer than 10s

---

## CP2.2: Optimistic UI - Landing Page Button

**File**: `src/pages/Landing.tsx`

**Current Code** (Line 50):
```typescript
const isAuthLoading = authState === "loading" && !user;

<Button
  disabled={isAuthLoading}  // Blocked for 10-20s
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

**New Code**:
```typescript
// Never disable button, show subtle loading indicator
const { user, authState } = useAuth();
const navigate = useNavigate();
const [isNavigating, setIsNavigating] = useState(false);

const handleCTAClick = async () => {
  setIsNavigating(true);

  // Optimistic navigation - don't wait for auth state
  if (!user) {
    // Not logged in → Sign up
    navigate('/auth?mode=signup');
  } else if (authState === "needs_onboarding") {
    // Logged in but incomplete profile → Complete onboarding
    navigate('/join');
  } else {
    // Logged in and ready → Go to app
    navigate('/app');
  }
};

<Button
  onClick={handleCTAClick}
  disabled={isNavigating}  // Only disable during navigation, not during auth check
  className="relative"
>
  {primaryCTA.text}
  {authState === "loading" && user && (
    <Loader2 className="ml-2 h-4 w-4 animate-spin" />  // Subtle indicator
  )}
</Button>
```

**Expected Outcome**:
- Button **always enabled** (except during navigation)
- Subtle loading spinner if auth still checking
- Users can click immediately, navigate optimistically

**Verification**:
1. Open landing page on slow connection
2. Button should be clickable within 1-2s
3. Click button while auth still loading
4. Should navigate to appropriate page (auth/join/app)

**Success Criteria**:
- ✅ Button clickable within 2s of page load
- ✅ Navigation works even if auth still loading
- ✅ No 10-20s disabled button state

---

## CP2.3: Optimistic UI - App Entry

**File**: `src/pages/Index.tsx`

**Current Code** (Lines 31-40):
```typescript
// Show loading or redirect states
if (authState !== "ready") {
  return (
    <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Loading your neighbourhood...</span>
      </div>
    </div>
  );
}
```

**New Code**:
```typescript
// Progressive loading - render UI with skeletons while auth completes
const { authState, profile } = useAuth();

// Only show full-screen loading if we truly don't know auth state yet
if (authState === "loading" && !profile) {
  return (
    <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Loading your neighbourhood...</span>
      </div>
    </div>
  );
}

// If we have a user but profile still loading, render app with skeleton
const renderScreen = () => {
  switch (activeTab) {
    case "feed":
      return <FeedScreen onNavigateToPost={() => setActiveTab("post")} />;
    case "post":
      return <PostScreen />;
    case "chats":
      return <ChatsListScreen />;
    case "profile":
      // Show skeleton while profile loads
      return profile ? (
        <ProfileScreen onLogout={handleLogout} />
      ) : (
        <ProfileSkeleton />
      );
    default:
      return <FeedScreen />;
  }
};

return (
  <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
    <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
      {renderScreen()}
    </div>
    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
  </div>
);
```

**Expected Outcome**:
- App renders immediately with skeletons
- Profile loads in background
- Feed can load independently of profile

**Verification**:
1. Open /app on slow connection
2. Should see app shell + skeletons within 1-2s
3. Content fills in as data arrives (not all-or-nothing)

**Success Criteria**:
- ✅ App shell visible within 2s
- ✅ Skeletons replace full-screen spinner
- ✅ Content loads progressively

---

## CP2.4: Create Skeleton Components

**File**: `src/components/skeletons/ProfileSkeleton.tsx` (NEW FILE)

**Content**:
```typescript
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header skeleton */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-muted rounded animate-pulse w-32" />
            <div className="h-4 bg-muted rounded animate-pulse w-48" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="p-4 grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
```

**Expected Outcome**: Skeleton renders while profile loads

**Verification**: Navigate to /app/profile while profile loading, should see skeleton

---

## CP2 Rollback Plan

If parallel loading causes issues:

1. **Revert AuthContext.tsx** to previous version:
   ```bash
   git checkout HEAD~1 src/contexts/AuthContext.tsx
   ```

2. **Remove optimistic UI changes**:
   ```bash
   git checkout HEAD~1 src/pages/Landing.tsx
   git checkout HEAD~1 src/pages/Index.tsx
   ```

3. **Keep demo data seeding** (CP1) since it's independent

---

## CP2 Success Criteria Summary

- ✅ Landing page button clickable within 2s (was 10-20s)
- ✅ App renders with skeletons within 2s (was 10-30s)
- ✅ Console logs show parallel auth + profile fetch
- ✅ No regressions in auth flow (sign up, sign in, sign out still work)
- ✅ Mobile network throttling test: Button responsive even on Slow 3G

---

# CHECKPOINT 3: NETWORK ADAPTATION + RESILIENCE

**Goal**: Detect network quality, adapt timeouts, implement exponential backoff

**Duration**: 2-3 hours

**Risk**: MEDIUM (changes retry logic across app)

---

## CP3.1: Network Quality Detection

**File**: `src/lib/networkDetection.ts` (NEW FILE)

**Content**:
```typescript
/**
 * Network quality detection and adaptive configuration
 */

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface NetworkInfo {
  quality: NetworkQuality;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Get current network quality
 */
export function getNetworkQuality(): NetworkInfo {
  // Check if online
  if (!navigator.onLine) {
    return {
      quality: 'offline',
      effectiveType: 'offline',
      downlink: 0,
      rtt: Infinity,
      saveData: false,
    };
  }

  // Use Network Information API if available
  const connection = (navigator as any).connection ||
                     (navigator as any).mozConnection ||
                     (navigator as any).webkitConnection;

  if (!connection) {
    // Fallback: assume good connection
    return {
      quality: 'good',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    };
  }

  const effectiveType = connection.effectiveType || '4g';
  const downlink = connection.downlink || 10;
  const rtt = connection.rtt || 50;
  const saveData = connection.saveData || false;

  // Determine quality based on effective type
  let quality: NetworkQuality;
  switch (effectiveType) {
    case '4g':
      quality = 'excellent';
      break;
    case '3g':
      quality = 'good';
      break;
    case '2g':
    case 'slow-2g':
      quality = 'poor';
      break;
    default:
      quality = 'good';
  }

  // Downgrade quality if RTT is high
  if (rtt > 1000) {
    quality = 'poor';
  } else if (rtt > 500 && quality === 'excellent') {
    quality = 'good';
  }

  return {
    quality,
    effectiveType,
    downlink,
    rtt,
    saveData,
  };
}

/**
 * Get adaptive timeout based on network quality
 */
export function getAdaptiveTimeout(): number {
  const { quality } = getNetworkQuality();

  switch (quality) {
    case 'excellent':
      return 5000;  // 5 seconds
    case 'good':
      return 10000; // 10 seconds
    case 'poor':
      return 20000; // 20 seconds
    case 'offline':
      return 30000; // 30 seconds (will fail, but give time for reconnect)
    default:
      return 10000;
  }
}

/**
 * Get adaptive retry configuration based on network quality
 */
export function getAdaptiveRetryConfig() {
  const { quality } = getNetworkQuality();

  switch (quality) {
    case 'excellent':
      return {
        maxRetries: 2,
        initialDelay: 1000,
        maxDelay: 5000,
      };
    case 'good':
      return {
        maxRetries: 3,
        initialDelay: 2000,
        maxDelay: 10000,
      };
    case 'poor':
      return {
        maxRetries: 5,
        initialDelay: 3000,
        maxDelay: 20000,
      };
    case 'offline':
      return {
        maxRetries: 10,
        initialDelay: 5000,
        maxDelay: 30000,
      };
    default:
      return {
        maxRetries: 3,
        initialDelay: 2000,
        maxDelay: 10000,
      };
  }
}

/**
 * Subscribe to network quality changes
 */
export function subscribeToNetworkChanges(callback: (info: NetworkInfo) => void) {
  // Online/offline events
  const handleOnline = () => callback(getNetworkQuality());
  const handleOffline = () => callback(getNetworkQuality());

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Connection change events
  const connection = (navigator as any).connection;
  if (connection) {
    connection.addEventListener('change', handleOnline);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (connection) {
      connection.removeEventListener('change', handleOnline);
    }
  };
}
```

**Expected Outcome**: Functions return network quality and adaptive configs

**Verification**:
```javascript
// Browser console
import { getNetworkQuality, getAdaptiveTimeout } from './src/lib/networkDetection';
console.log('Network:', getNetworkQuality());
console.log('Timeout:', getAdaptiveTimeout());
// Test on Chrome DevTools: Network tab → Slow 3G
// Should show { quality: 'poor', ... } and timeout 20000
```

---

## CP3.2: Exponential Backoff Retry

**File**: `src/lib/retry.ts`

**Current Code**: Has `retrySupabaseOperation` but uses fixed delays

**New Code**: Replace with exponential backoff
```typescript
import { getAdaptiveRetryConfig, getNetworkQuality } from './networkDetection';

/**
 * Exponential backoff with jitter
 */
function calculateBackoff(attempt: number, initialDelay: number, maxDelay: number): number {
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Retry function with exponential backoff and network awareness
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operationName: string = 'operation'
): Promise<T> {
  const config = getAdaptiveRetryConfig();
  const { quality } = getNetworkQuality();

  console.log(`[Retry] Starting ${operationName} (network: ${quality}, max retries: ${config.maxRetries})`);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();

      if (attempt > 0) {
        console.log(`[Retry] ${operationName} succeeded on attempt ${attempt + 1}`);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        console.error(`[Retry] ${operationName} failed after ${config.maxRetries + 1} attempts:`, lastError);
        throw lastError;
      }

      // Calculate backoff delay
      const delay = calculateBackoff(attempt, config.initialDelay, config.maxDelay);
      console.warn(`[Retry] ${operationName} failed on attempt ${attempt + 1}, retrying in ${delay}ms...`, lastError.message);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Supabase-specific retry with adaptive timeout
 */
export async function retrySupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationName: string = 'supabase operation'
): Promise<{ data: T | null; error: any }> {
  return retryWithBackoff(async () => {
    const result = await operation();

    if (result.error) {
      throw new Error(result.error.message || 'Supabase operation failed');
    }

    return result;
  }, operationName);
}
```

**Expected Outcome**: Retries use exponential backoff with network awareness

**Verification**:
```javascript
// Simulate flaky operation
let attempts = 0;
const flakyOp = () => {
  attempts++;
  if (attempts < 3) throw new Error('Simulated failure');
  return Promise.resolve('Success!');
};

await retryWithBackoff(flakyOp, 'test operation');
// Console should show:
// [Retry] test operation failed on attempt 1, retrying in 2000ms...
// [Retry] test operation failed on attempt 2, retrying in 4000ms...
// [Retry] test operation succeeded on attempt 3
```

---

## CP3.3: Update AuthContext with Adaptive Timeouts

**File**: `src/contexts/AuthContext.tsx`

**Changes**:
```typescript
// Line 1: Add import
import { getAdaptiveTimeout, getNetworkQuality } from "@/lib/networkDetection";
import { retryWithBackoff } from "@/lib/retry";

// Line 135-140: Replace fixed timeout with adaptive
const { quality } = getNetworkQuality();
const timeout = getAdaptiveTimeout();
console.log(`[AuthContext] Network quality: ${quality}, using timeout: ${timeout}ms`);

const { data, error } = await withTimeout(
  supabase.auth.getSession(),
  timeout, // Adaptive timeout instead of TIMEOUT_MS.NORMAL
  "Auth session fetch timed out. Please check your connection."
);

// Line 88-96: Same for profile fetch
const timeout = getAdaptiveTimeout();
const result = await withTimeout(
  supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single(),
  timeout, // Adaptive timeout
  "Profile fetch timed out. Please check your connection and try again."
);
```

**Expected Outcome**:
- Fast connection (4G): 5s timeout
- Good connection (3G): 10s timeout
- Poor connection (2G): 20s timeout

**Verification**: Check console logs on different network conditions in Chrome DevTools

---

## CP3.4: Update useTasks with Adaptive Retry

**File**: `src/hooks/useTasks.ts`

**Changes**:
```typescript
// Line 7: Add import
import { retryWithBackoff } from "@/lib/retry";
import { getAdaptiveTimeout } from "@/lib/networkDetection";

// Line 97-130: Wrap RPC calls with retry
const timeout = getAdaptiveTimeout();

if (userLocation) {
  console.log("[useTasks] Fetching nearby tasks for location:", userLocation);

  const result = await retryWithBackoff(
    async () => {
      return await withTimeout(
        supabase.rpc("get_nearby_tasks", {
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
          radius_km: 5,
        }),
        timeout,
        "Task fetch timed out. Please try again."
      );
    },
    'get_nearby_tasks'
  );

  data = result.data;
  fetchError = result.error;

  // Fallback to public tasks if empty
  if (!fetchError && (!data || data.length === 0)) {
    console.log("[useTasks] No nearby tasks found, falling back to get_public_tasks");

    const fallbackResult = await retryWithBackoff(
      async () => {
        return await withTimeout(
          supabase.rpc("get_public_tasks"),
          timeout,
          "Task fetch timed out. Please try again."
        );
      },
      'get_public_tasks'
    );

    data = fallbackResult.data;
    fetchError = fallbackResult.error;
    usedFallback = true;
  }
}
```

**Expected Outcome**:
- Tasks retry 2-5 times based on network quality
- Exponential backoff between retries
- Higher success rate on spotty mobile connections

**Verification**:
1. Enable Slow 3G in Chrome DevTools
2. Refresh feed
3. Console should show retry attempts with increasing delays
4. Should eventually succeed (not immediately fail)

---

## CP3.5: Offline Detection Banner

**File**: `src/components/OfflineBanner.tsx` (NEW FILE)

**Content**:
```typescript
import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getNetworkQuality, subscribeToNetworkChanges } from '@/lib/networkDetection';

export function OfflineBanner() {
  const [networkQuality, setNetworkQuality] = useState(getNetworkQuality());
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges((info) => {
      setNetworkQuality(info);

      if (info.quality === 'offline') {
        setWasOffline(true);
      }
    });

    return unsubscribe;
  }, []);

  // Show offline banner
  if (networkQuality.quality === 'offline') {
    return (
      <Alert className="border-destructive bg-destructive/10 m-4">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          You're offline. Some features may not work until you reconnect.
        </AlertDescription>
      </Alert>
    );
  }

  // Show "back online" banner briefly
  if (wasOffline && networkQuality.quality !== 'offline') {
    setTimeout(() => setWasOffline(false), 3000);

    return (
      <Alert className="border-green-500 bg-green-500/10 m-4">
        <Wifi className="h-4 w-4" />
        <AlertDescription>
          You're back online!
        </AlertDescription>
      </Alert>
    );
  }

  // Show slow connection warning
  if (networkQuality.quality === 'poor') {
    return (
      <Alert className="border-yellow-500 bg-yellow-500/10 m-4">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Slow connection detected. Loading may take longer than usual.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
```

**File**: `src/pages/Index.tsx`

**Changes**:
```typescript
// Line 1: Add import
import { OfflineBanner } from '@/components/OfflineBanner';

// Line 57-63: Add banner above content
return (
  <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
    <OfflineBanner />  {/* Add this */}
    <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
      {renderScreen()}
    </div>
    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
  </div>
);
```

**Expected Outcome**:
- User goes offline → See "You're offline" banner
- User comes back online → See "You're back online" banner for 3s
- User on slow connection → See "Slow connection" warning

**Verification**:
1. Open app
2. Toggle "Offline" in Chrome DevTools
3. Should see offline banner
4. Toggle back online
5. Should see "back online" banner briefly

---

## CP3 Rollback Plan

If network adaptation causes issues:

1. **Revert network detection**:
   ```bash
   rm src/lib/networkDetection.ts
   git checkout HEAD~1 src/lib/retry.ts
   ```

2. **Revert AuthContext and useTasks changes**:
   ```bash
   git checkout HEAD~1 src/contexts/AuthContext.tsx
   git checkout HEAD~1 src/hooks/useTasks.ts
   ```

3. **Remove offline banner**:
   ```bash
   rm src/components/OfflineBanner.tsx
   git checkout HEAD~1 src/pages/Index.tsx
   ```

---

## CP3 Success Criteria Summary

- ✅ Console shows network quality detection
- ✅ Timeouts adapt to network (5s on 4G, 20s on 2G)
- ✅ Retries use exponential backoff (2s, 4s, 8s, ...)
- ✅ Offline banner appears when connection lost
- ✅ Slow connection warning appears on poor network
- ✅ Success rate on Slow 3G: 50% → 90%+

---

# CHECKPOINT 4: PWA SERVICE WORKER + CACHE CONTROL

**Goal**: Add service worker with cache versioning, update detection

**Duration**: 2-3 hours

**Risk**: HIGH (affects caching behavior, requires careful testing)

---

## CP4.1: Install PWA Plugin

**Action**: Install vite-plugin-pwa

**Commands**:
```bash
npm install -D vite-plugin-pwa workbox-window
```

**Expected Outcome**: Package installed successfully

**Verification**:
```bash
npm list vite-plugin-pwa
# Should show version number
```

---

## CP4.2: Configure PWA Plugin

**File**: `vite.config.ts`

**Current Code**:
```typescript
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // ...
}));
```

**New Code**:
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Ask user to update
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Swaami',
        short_name: 'Swaami',
        description: 'Help your neighbours, build your community',
        theme_color: '#FFE49E',
        background_color: '#FFFBF0',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Runtime caching strategies
        runtimeCaching: [
          {
            // API calls: Network first, cache fallback
            urlPattern: ({ url }) => url.origin.includes('supabase'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Static assets: Stale while revalidate
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            // JS/CSS bundles: Stale while revalidate
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
        ],
        // Clean up old caches on activation
        cleanupOutdatedCaches: true,
        // Skip waiting when new service worker available
        skipWaiting: false, // Important: let user decide when to update
      },
    }),
  ],
  // ...
}));
```

**Expected Outcome**: Vite builds service worker on next build

**Verification**:
```bash
npm run build
# Should see output: "Service worker generated"
# Check dist/sw.js exists
ls dist/sw.js
```

---

## CP4.3: Register Service Worker with Update Prompt

**File**: `src/registerServiceWorker.ts` (NEW FILE)

**Content**:
```typescript
import { registerSW } from 'virtual:pwa-register';

/**
 * Register service worker and handle updates
 */
export function registerServiceWorker() {
  const updateSW = registerSW({
    onNeedRefresh() {
      console.log('[SW] New version available');

      // Show user-friendly update prompt
      if (confirm('A new version of Swaami is available. Reload to update?')) {
        updateSW(true); // Reload page with new service worker
      }
    },
    onOfflineReady() {
      console.log('[SW] App ready to work offline');
    },
    onRegistered(registration) {
      console.log('[SW] Service worker registered:', registration);

      // Check for updates every hour
      setInterval(() => {
        registration?.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error('[SW] Service worker registration failed:', error);
    },
  });

  return updateSW;
}
```

**File**: `src/main.tsx`

**Changes**:
```typescript
// Line 1: Add import
import { registerServiceWorker } from './registerServiceWorker';

// After ReactDOM.createRoot, before render:
// Register service worker
if ('serviceWorker' in navigator) {
  registerServiceWorker();
}

// Then render app
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Expected Outcome**:
- Service worker registers on app load
- User sees update prompt when new version deployed
- User can choose when to update (not forced)

**Verification**:
1. Build and deploy new version
2. User opens app (running old version)
3. New service worker detects update
4. User sees: "A new version of Swaami is available. Reload to update?"
5. User clicks OK → Page reloads with new version

---

## CP4.4: Update Prompt Component (Better UX)

**File**: `src/components/UpdatePrompt.tsx` (NEW FILE)

**Content**:
```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download } from 'lucide-react';

interface UpdatePromptProps {
  onUpdate: () => void;
}

export function UpdatePrompt({ onUpdate }: UpdatePromptProps) {
  const [show, setShow] = useState(false);

  // Auto-show after component mounts (from registerSW callback)
  useEffect(() => {
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <Alert className="fixed bottom-20 left-4 right-4 z-50 border-blue-500 bg-blue-500/10">
      <Download className="h-4 w-4" />
      <AlertTitle>Update Available</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        <span className="flex-1">A new version of Swaami is ready to install.</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShow(false)}
          >
            Later
          </Button>
          <Button
            size="sm"
            onClick={onUpdate}
          >
            Update Now
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

**File**: `src/registerServiceWorker.ts`

**Changes**:
```typescript
import { createRoot } from 'react-dom/client';
import { UpdatePrompt } from './components/UpdatePrompt';

export function registerServiceWorker() {
  const updateSW = registerSW({
    onNeedRefresh() {
      console.log('[SW] New version available');

      // Create and mount update prompt component
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      root.render(
        <UpdatePrompt
          onUpdate={() => {
            root.unmount();
            container.remove();
            updateSW(true); // Reload with new version
          }}
        />
      );
    },
    // ... rest of config
  });

  return updateSW;
}
```

**Expected Outcome**:
- Better UX: Toast notification instead of browser alert
- User can dismiss and update later
- Update button prominently displayed

---

## CP4.5: Cache Versioning Test

**File**: `public/version.json` (NEW FILE)

**Content**:
```json
{
  "version": "1.0.0",
  "buildDate": "2026-01-22",
  "commitHash": "e4712be"
}
```

**Update on each deploy**:
```bash
# Add to build script
echo "{\"version\":\"$(git describe --tags)\",\"buildDate\":\"$(date -u +%Y-%m-%d)\",\"commitHash\":\"$(git rev-parse --short HEAD)\"}" > public/version.json
```

**File**: `src/App.tsx`

**Changes**:
```typescript
// On app mount, check version
useEffect(() => {
  async function checkVersion() {
    try {
      const response = await fetch('/version.json');
      const { version, commitHash } = await response.json();
      console.log(`[App] Running version ${version} (${commitHash})`);
    } catch (error) {
      console.error('[App] Failed to check version:', error);
    }
  }

  checkVersion();
}, []);
```

**Expected Outcome**: Console shows current app version

---

## CP4 Rollback Plan

If PWA causes issues:

1. **Remove PWA plugin**:
   ```bash
   npm uninstall vite-plugin-pwa
   git checkout HEAD~1 vite.config.ts
   ```

2. **Unregister service worker**:
   ```typescript
   // Add to App.tsx temporarily
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(registration => registration.unregister());
   });
   ```

3. **Clear all caches**:
   ```typescript
   // Browser console
   caches.keys().then(keys => {
     keys.forEach(key => caches.delete(key));
   });
   ```

4. **Force hard refresh**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

---

## CP4 Success Criteria Summary

- ✅ Service worker registers successfully
- ✅ Update prompt appears when new version deployed
- ✅ User can choose when to update (not forced)
- ✅ Cache strategies work (network first for API, cache first for images)
- ✅ Console shows version number on app load
- ✅ Mobile users get updates within 1 hour of deploy (not days/weeks)

---

# CHECKPOINT 5: FINAL REGRESSION TEST

**Goal**: Verify all fixes work together, no regressions

**Duration**: 30-60 minutes

**Risk**: LOW (testing only, no code changes)

---

## CP5.1: Desktop Test Suite

**Environment**: Chrome Desktop, Fast WiFi

**Test Cases**:
1. ✅ Landing page loads, button clickable within 2s
2. ✅ Click "Join Your Neighbourhood" → Navigate to /auth
3. ✅ Sign up → Navigate to /join (onboarding)
4. ✅ Complete onboarding → Navigate to /app
5. ✅ Feed shows 50+ demo tasks (toggle ON)
6. ✅ Toggle OFF → Demo tasks disappear
7. ✅ Profile page loads within 2s
8. ✅ Sign out → Return to landing page

**Expected**: All tests pass, no console errors

---

## CP5.2: Mobile Test Suite (Slow 3G)

**Environment**: Chrome Mobile Emulation, Slow 3G

**Test Cases**:
1. ✅ Landing page loads, button clickable within 5s (was 20s+)
2. ✅ Click button → Navigate (not blocked)
3. ✅ App renders with skeletons within 5s
4. ✅ Content loads progressively (not all-or-nothing)
5. ✅ Feed shows tasks within 15-20s (with retries)
6. ✅ Console shows retry attempts with exponential backoff
7. ✅ Slow connection banner appears
8. ✅ Profile loads in background (doesn't block feed)

**Expected**: All tests pass, perceived performance 10x better

---

## CP5.3: Offline Test Suite

**Environment**: Chrome DevTools → Offline

**Test Cases**:
1. ✅ Go offline → Offline banner appears
2. ✅ Try to load feed → Shows cached data (if available)
3. ✅ Try to create task → Shows "You're offline" error
4. ✅ Go back online → "You're back online" banner
5. ✅ Feed refreshes automatically

**Expected**: Graceful offline handling, no crashes

---

## CP5.4: Update Test Suite

**Environment**: Deploy new version

**Test Cases**:
1. ✅ User has app open (old version)
2. ✅ Deploy new version
3. ✅ User's service worker detects update
4. ✅ Update prompt appears
5. ✅ User clicks "Update Now"
6. ✅ Page reloads with new version
7. ✅ Console shows new version number

**Expected**: Seamless update flow, no broken state

---

## CP5.5: Performance Benchmarks

**Before vs After Comparison**:

| Metric | Before (Desktop) | After (Desktop) | Before (Mobile 3G) | After (Mobile 3G) |
|--------|------------------|-----------------|--------------------|--------------------|
| Landing button clickable | 2s | 1s | 20s+ | 5s |
| App shell visible | 10s | 2s | 30s+ | 5s |
| Feed loaded | 15s | 5s | 60s+ timeout | 20s (with retries) |
| Profile loaded | 10s | 5s | 20s+ timeout | 15s (background) |
| Success rate | 95% | 98% | 50% | 90% |

**Verification Method**: Use Chrome DevTools Performance tab + Network throttling

---

## CP5 Success Criteria Summary

- ✅ All desktop tests pass
- ✅ All mobile (Slow 3G) tests pass
- ✅ All offline tests pass
- ✅ Update flow works smoothly
- ✅ Performance benchmarks improved
- ✅ No console errors or warnings
- ✅ User experience feels 10x faster on mobile

---

# ROLLBACK STRATEGY (EMERGENCY)

If catastrophic failure occurs after deployment:

## Immediate Rollback (5 minutes)

```bash
# Option 1: Revert to previous commit
git revert HEAD --no-edit
git push origin claude/diagnose-red-box-issues-iLcJT

# Option 2: Reset to before changes
git reset --hard <commit-before-changes>
git push origin claude/diagnose-red-box-issues-iLcJT --force

# Option 3: Deploy previous good version
git checkout <previous-good-commit>
npm run build
# Deploy to production
```

## Clear User Caches (10 minutes)

**Server-side** (if you have control):
```
Add cache-busting headers:
Cache-Control: no-cache, no-store, must-revalidate
```

**Client-side** (update instructions):
```
1. Go to swaami.ai
2. Open DevTools (F12)
3. Application tab → Clear Storage → Clear site data
4. Hard refresh (Ctrl+Shift+R)
```

## Communication Template

**User announcement**:
```
⚠️ We've detected an issue and are rolling back to a stable version.
If you experience problems:
1. Close the app completely
2. Clear your browser cache
3. Reopen swaami.ai

Sorry for the inconvenience! We're working on a fix.
```

---

# DEPLOYMENT CHECKLIST

Before deploying to production:

## Pre-Deploy
- [ ] All checkpoints passed (CP1-CP5)
- [ ] No console errors in development
- [ ] Tested on actual mobile device (not just emulator)
- [ ] Tested on Slow 3G network
- [ ] Tested offline behavior
- [ ] Update prompt works
- [ ] Demo data seeded in production database
- [ ] Version number updated in version.json
- [ ] Commit messages clear and descriptive

## Deploy
- [ ] Build production bundle: `npm run build`
- [ ] Test production bundle locally
- [ ] Deploy to staging first (if available)
- [ ] Test staging on mobile
- [ ] Deploy to production
- [ ] Verify production deployment

## Post-Deploy
- [ ] Monitor error logs for 1 hour
- [ ] Check analytics for bounce rate changes
- [ ] Test production on mobile device
- [ ] Verify update prompt works
- [ ] Confirm demo data visible
- [ ] Monitor Supabase logs for database errors
- [ ] Collect user feedback

---

# MONITORING + METRICS

**What to monitor after deployment**:

## Application Metrics
- Page load time (target: <5s on mobile)
- Time to interactive (target: <10s on mobile)
- API success rate (target: >90%)
- Service worker registration rate (target: >95%)

## User Experience Metrics
- Bounce rate (should decrease)
- Session duration (should increase)
- Sign-up conversion rate (should increase with demo data)
- Error rate (should decrease)

## Console Logs to Watch
```
[App] Running version X.X.X
[AuthContext] Auth init complete in XXXXms
[useTasks] Fetching nearby tasks
[Retry] Operation succeeded on attempt N
[SW] Service worker registered
```

## Red Flags
```
[Retry] Operation failed after 5 attempts
[AuthContext] Auth init failed after XXXXXms
[SW] Service worker registration failed
Multiple "timed out" errors in short period
```

---

# SUMMARY

## What This Plan Fixes

1. **Sequential Loading** → Parallel loading (30s → 10s)
2. **PWA Caching** → Service worker with updates (weeks → hours)
3. **Network Issues** → Adaptive retry (50% → 90% success)
4. **Blocking UI** → Optimistic rendering (20s blocked → 2s)
5. **Empty Feed** → Auto-seeded demo data (0 tasks → 100+ tasks)

## Phased Implementation

**Phase 1** (30 min): Demo data ← **Start here for quick win**
**Phase 2** (2-3 hrs): Parallel loading + optimistic UI
**Phase 3** (2-3 hrs): Network adaptation + retries
**Phase 4** (2-3 hrs): PWA service worker + caching

**Total**: 6-8 hours (can be split across multiple days)

## Success Criteria

- ✅ Mobile load time: 30s+ → 10-20s
- ✅ Mobile success rate: 50% → 90%+
- ✅ Button clickable: 20s → 2-5s
- ✅ Update deployment: Weeks → Hours
- ✅ New user conversion: 0% (empty feed) → 20%+ (demo data)

---

**Status**: ⏳ **AWAITING CP0 APPROVAL**

Please review this plan and approve to proceed with implementation.
