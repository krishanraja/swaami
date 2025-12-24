# Landing Page & Onboarding Issues - Complete Diagnosis

**Date**: 2025-01-27  
**Issues**: 
1. Landing page "Get Started" button stuck on "Loading..." forever
2. Onboarding neighbourhoods unselectable (previously reported, may be related)

**Severity**: P0 - Critical  
**Status**: Diagnostic Phase - No Edits Yet

---

## PHASE 1: Complete Problem Scope

### Issue 1: Landing Page Button Stuck on "Loading..."

#### Call Graph

```
User visits landing page (/)
  ↓
Landing.tsx mounts (line 12)
  ↓
useAuth() hook called (line 14)
  ↓
AuthContext.tsx: AuthProvider provides authState
  ↓
authState computed (line 174-192):
  - If authLoading || profileLoading → "loading"
  - If !user → "unauthenticated"  
  - If user but incomplete profile → "needs_onboarding"
  - If user and complete → "ready"
  ↓
Landing.tsx: isAuthLoading = authState === "loading" (line 49)
  ↓
Button shows "Loading..." when isAuthLoading === true (line 149)
Button disabled when isAuthLoading === true (line 147)
```

#### File + Line References

**Landing.tsx**
- Line 14: `const { user, authState, signOut } = useAuth();`
- Line 49: `const isAuthLoading = authState === "loading";`
- Line 143: `onClick={() => navigate(isAuthLoading ? "/auth?mode=signup" : primaryCTA.path)}`
- Line 147: `disabled={isAuthLoading}`
- Line 149: `{isAuthLoading ? "Loading..." : primaryCTA.text}`

**AuthContext.tsx**
- Line 44: `const [authLoading, setAuthLoading] = useState(true);`
- Line 45: `const [profileLoading, setProfileLoading] = useState(false);`
- Line 71-126: `useEffect` with `initAuth()` and `onAuthStateChange`
- Line 96: `setAuthLoading(false)` in `initAuth` finally block
- Line 118: `setAuthLoading(false)` in `onAuthStateChange` callback
- Line 172: `const isLoading = authLoading || profileLoading;`
- Line 174-192: `authState` useMemo computation

#### Architecture Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Landing Page Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Landing.tsx                                                 │
│    ├─> useAuth()                                            │
│    │     └─> AuthContext                                    │
│    │           ├─> authLoading state                        │
│    │           ├─> profileLoading state                     │
│    │           └─> authState (computed)                     │
│    │                                                         │
│    └─> Button                                               │
│          ├─> disabled={isAuthLoading}                       │
│          └─> text={isAuthLoading ? "Loading..." : CTA}      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              AuthContext Initialization Flow                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AuthProvider mounts                                         │
│    ├─> authLoading = true (initial)                         │
│    ├─> profileLoading = false (initial)                     │
│    │                                                         │
│    └─> useEffect runs                                        │
│          ├─> initAuth()                                      │
│          │     ├─> supabase.auth.getSession()               │
│          │     ├─> [IF USER EXISTS]                          │
│          │     │     └─> fetchProfile(userId)               │
│          │     │           ├─> setProfileLoading(true)       │
│          │     │           ├─> supabase.from("profiles")     │
│          │     │           └─> setProfileLoading(false)     │
│          │     └─> setAuthLoading(false) [FINALLY]         │
│          │                                                     │
│          └─> onAuthStateChange subscription                  │
│                └─> [ON EVENT]                                │
│                      ├─> setSession/user                     │
│                      ├─> [IF SIGNED_IN/TOKEN_REFRESHED]     │
│                      │     └─> fetchProfile()              │
│                      └─> setAuthLoading(false)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Observed Errors (Potential Failure Points)

**Failure Point 1: initAuth() Never Completes**
- **Location**: `AuthContext.tsx:74-98`
- **Cause**: `supabase.auth.getSession()` hangs (network timeout, Supabase down, CORS issue)
- **Symptom**: `authLoading` stays `true`, `setAuthLoading(false)` never called
- **Evidence Needed**: Network tab showing pending request, console timeout errors

**Failure Point 2: fetchProfile() Hangs**
- **Location**: `AuthContext.tsx:47-69`
- **Cause**: Profile query never resolves (network timeout, RLS blocking, database slow)
- **Symptom**: `profileLoading` stays `true`, button stuck on "Loading..."
- **Evidence Needed**: Network tab showing pending profile request

**Failure Point 3: Race Condition Between initAuth and onAuthStateChange**
- **Location**: `AuthContext.tsx:103-120`
- **Cause**: `onAuthStateChange` fires before `initAuth` completes, sets `authLoading = false` prematurely
- **Symptom**: State inconsistency, button may flicker or get stuck
- **Evidence Needed**: Console logs showing timing of events

**Failure Point 4: Error in initAuth Prevents Finally Block**
- **Location**: `AuthContext.tsx:74-98`
- **Cause**: Unhandled exception before `finally` block executes
- **Symptom**: `authLoading` never set to `false`
- **Evidence Needed**: Console error logs, stack traces

**Failure Point 5: Component Unmounts Before State Update**
- **Location**: `AuthContext.tsx:84, 95-97`
- **Cause**: Component unmounts while async operations in progress, `mounted` check fails
- **Symptom**: State updates lost, loading state persists
- **Evidence Needed**: React DevTools showing unmount timing

---

### Issue 2: Neighbourhood Selection Unselectable

#### Call Graph

```
User on onboarding location step
  ↓
JoinScreen.tsx: step === 'location' (line 292)
  ↓
NeighbourhoodSelector component rendered (line 312-316)
  ↓
useNeighbourhoods(city) hook called (line 13)
  ↓
React Query: useQuery with queryKey ["neighbourhoods", city]
  ↓
queryFn executes (line 17-48):
  - If !city → return []
  - supabase.from("neighbourhoods").select("*").eq("city", city)
  ↓
Select component (line 40-79):
  - disabled={isLoading || !!error} (line 43)
  - Shows neighbourhoods if data exists (line 65-70)
```

#### File + Line References

**JoinScreen.tsx**
- Line 292-330: Location step rendering
- Line 312-316: NeighbourhoodSelector usage
- Line 325: Continue button disabled if `!city || !neighbourhood`

**NeighbourhoodSelector.tsx**
- Line 13: `const { data: neighbourhoods, isLoading, error, refetch } = useNeighbourhoods(city);`
- Line 40-43: `<Select disabled={isLoading || !!error}>`
- Line 65-70: Rendering neighbourhood items

**useNeighbourhoods.ts**
- Line 15-57: React Query hook definition
- Line 17-48: queryFn implementation
- Line 50: `enabled: !!city` - query only runs if city selected
- Line 52-56: Query configuration (staleTime, retry, etc.)

**Select Component (Radix UI)**
- `src/components/ui/select.tsx`: Radix Select wrapper
- Line 40: `disabled` prop passed to Select root

#### Architecture Map

```
┌─────────────────────────────────────────────────────────────┐
│              Neighbourhood Selection Flow                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  JoinScreen (location step)                                 │
│    ├─> CitySelector                                          │
│    │     └─> User selects city                               │
│    │           └─> setCity(city)                            │
│    │                                                         │
│    └─> NeighbourhoodSelector (if city selected)              │
│          ├─> useNeighbourhoods(city)                         │
│          │     └─> React Query                               │
│          │           ├─> queryKey: ["neighbourhoods", city]  │
│          │           ├─> queryFn: supabase query             │
│          │           ├─> enabled: !!city                    │
│          │           └─> Returns: {data, isLoading, error}   │
│          │                                                     │
│          └─> Select Component                                │
│                ├─> disabled={isLoading || !!error}           │
│                ├─> value={neighbourhood}                     │
│                └─> onValueChange={onChange}                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            React Query State Machine                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Query States:                                               │
│                                                              │
│  1. Idle (city === null)                                    │
│     └─> enabled: false → Query not executed                 │
│                                                              │
│  2. Loading (city selected, query executing)                │
│     └─> isLoading: true → Select disabled                   │
│                                                              │
│  3. Success (data received)                                 │
│     └─> data: Neighbourhood[] → Select enabled               │
│                                                              │
│  4. Error (query failed)                                    │
│     └─> error: Error → Select disabled, Alert shown         │
│                                                              │
│  5. Stuck Loading (query never resolves)                    │
│     └─> isLoading: true forever → Select disabled forever   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Observed Errors (Potential Failure Points)

**Failure Point 1: React Query Stuck in Loading State**
- **Location**: `useNeighbourhoods.ts:15-57`
- **Cause**: 
  - Network timeout (no timeout configured in Supabase client)
  - Supabase query hangs indefinitely
  - CORS/preflight issues
  - Database connection pool exhausted
- **Symptom**: `isLoading` stays `true`, Select disabled forever
- **Evidence Needed**: Network tab showing pending request, React Query DevTools showing loading state

**Failure Point 2: Authentication Error (PGRST301)**
- **Location**: `useNeighbourhoods.ts:30-32`
- **Cause**: RLS policy requires auth, but user not fully authenticated during onboarding
- **Symptom**: Error thrown, Select disabled, Alert shown
- **Evidence Needed**: Console error with "PGRST301" or "JWT" in message
- **Note**: RLS policy says "Anyone can view neighbourhoods" (migration line 21-24), but may not be applied correctly

**Failure Point 3: Network Error Not Caught**
- **Location**: `useNeighbourhoods.ts:34-36`
- **Cause**: Network error doesn't match expected patterns, falls through to generic error
- **Symptom**: Generic error message, Select disabled
- **Evidence Needed**: Network tab showing failed request, console error

**Failure Point 4: Empty Data Array**
- **Location**: `NeighbourhoodSelector.tsx:65-77`
- **Cause**: Query succeeds but returns empty array (no neighbourhoods for city)
- **Symptom**: Select shows "No neighbourhoods found" but may still be disabled
- **Evidence Needed**: Network response showing empty array

**Failure Point 5: Mobile Touch Interaction Issue**
- **Location**: `src/components/ui/select.tsx` (Radix Select)
- **Cause**: 
  - Radix Select Portal positioning issues on mobile
  - Touch events not propagating correctly
  - Z-index/layering issues
  - `position="popper"` causing issues on mobile browsers
- **Symptom**: Select appears clickable but doesn't open on mobile
- **Evidence Needed**: Mobile browser testing, touch event logs

**Failure Point 6: Query Not Re-executing on City Change**
- **Location**: `useNeighbourhoods.ts:50`
- **Cause**: Query cache not invalidating when city changes, or `enabled` condition not updating
- **Symptom**: Old city's neighbourhoods shown, or loading state persists
- **Evidence Needed**: React Query DevTools showing cache state

---

## PHASE 2: Root Cause Investigation

### Root Cause Analysis: Landing Page Button

#### Primary Hypothesis: Auth State Never Resolves

**Evidence Chain**:
1. Button shows "Loading..." when `authState === "loading"`
2. `authState === "loading"` when `authLoading || profileLoading === true`
3. `authLoading` initialized to `true` (line 44)
4. `authLoading` set to `false` in two places:
   - `initAuth()` finally block (line 96)
   - `onAuthStateChange` callback (line 118)

**Most Likely Causes** (in order of probability):

1. **Network Timeout on getSession()** (HIGH PROBABILITY)
   - Supabase client has no explicit timeout
   - Network issues cause request to hang
   - `initAuth()` never completes, `finally` block never executes
   - **Fix**: Add timeout wrapper, fallback to unauthenticated state

2. **Profile Fetch Hangs** (MEDIUM PROBABILITY)
   - User exists but profile query never resolves
   - `profileLoading` stays `true` forever
   - **Fix**: Add timeout to profile fetch, better error handling

3. **Race Condition** (MEDIUM PROBABILITY)
   - `onAuthStateChange` fires before `initAuth` completes
   - State updates conflict
   - **Fix**: Use refs to track initialization state, prevent premature state updates

4. **Error Swallowing** (LOW PROBABILITY)
   - Exception thrown but not caught
   - `finally` block doesn't execute
   - **Fix**: Wrap entire init in try-catch, ensure cleanup

### Root Cause Analysis: Neighbourhood Selection

#### Primary Hypothesis: Query Never Resolves or Auth Error

**Evidence Chain**:
1. Select disabled when `isLoading || !!error`
2. `isLoading` from React Query
3. Query executes when `city` is selected
4. Query has no timeout configuration

**Most Likely Causes** (in order of probability):

1. **Query Hangs Indefinitely** (HIGH PROBABILITY)
   - No timeout on Supabase query
   - Network issues cause request to hang
   - React Query stays in loading state forever
   - **Fix**: Add query timeout, configure React Query default options

2. **Authentication Required Despite Public RLS** (MEDIUM PROBABILITY)
   - RLS policy says "Anyone can view" but may require session
   - During onboarding, user may not have valid session yet
   - Query fails with auth error
   - **Fix**: Verify RLS policy, ensure it truly allows anonymous access

3. **Mobile Touch Event Issues** (MEDIUM PROBABILITY)
   - Radix Select Portal may not work correctly on mobile
   - Touch events not registering
   - **Fix**: Test on mobile, consider alternative for mobile (native select)

4. **Query Cache Issues** (LOW PROBABILITY)
   - React Query cache not invalidating
   - Stale data or loading state persists
   - **Fix**: Clear cache on city change, ensure proper query key

---

## PHASE 3: Required Evidence Collection

### Before Any Fixes: Must Collect

#### 1. Browser Console Logs
- [ ] All console errors when landing page loads
- [ ] All console errors when clicking "Get Started" button
- [ ] All console errors during onboarding location step
- [ ] React Query DevTools state (if available)
- [ ] React component render logs

#### 2. Network Tab Evidence
- [ ] `supabase.auth.getSession()` request status
  - URL, method, status code, timing
  - Request/response payloads
- [ ] Profile fetch request (if user exists)
  - URL, method, status code, timing
  - Request/response payloads
- [ ] Neighbourhoods query request
  - URL, method, status code, timing
  - Request/response payloads
- [ ] Any pending/blocked requests

#### 3. Application State Evidence
- [ ] React DevTools: AuthContext state values
  - `authLoading` value
  - `profileLoading` value
  - `authState` value
  - `user` value
  - `profile` value
- [ ] React DevTools: NeighbourhoodSelector state
  - `isLoading` value
  - `error` value
  - `neighbourhoods` data
- [ ] React Query DevTools: Query state
  - Query status (loading/success/error)
  - Query data
  - Query error

#### 4. User Flow Evidence
- [ ] Screenshot: Landing page with "Loading..." button
- [ ] Screenshot: Browser console at time of issue
- [ ] Screenshot: Network tab showing pending requests
- [ ] Screenshot: Onboarding location step with disabled select
- [ ] Video: Complete user flow from landing to onboarding

#### 5. Environment Evidence
- [ ] `VITE_SUPABASE_URL` value (check if correct)
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` value (check if correct)
- [ ] Supabase project status (dashboard)
- [ ] Network connectivity (can access Supabase dashboard)

---

## PHASE 4: Implementation Plan (PENDING EVIDENCE)

### Plan Structure (To be filled after evidence collection)

#### Checkpoint CP0: Evidence Collection Complete
- **Action**: Collect all evidence listed above
- **Expected**: Complete diagnostic picture
- **Verification**: All checkboxes above checked

#### Checkpoint CP1: Root Cause Confirmed
- **Action**: Analyze evidence, confirm root cause
- **Expected**: Single root cause identified with evidence
- **Verification**: Root cause documented with evidence links

#### Checkpoint CP2: Fix Implementation
- **Action**: Implement fix based on root cause
- **Expected**: Code changes applied
- **Verification**: Code review, no regressions

#### Checkpoint CP3: Fix Verification
- **Action**: Test fix in dev environment
- **Expected**: Issue resolved, button works, neighbourhoods selectable
- **Verification**: Manual testing, logs confirm fix

#### Checkpoint CP4: Regression Testing
- **Action**: Test full flow 3+ times
- **Expected**: No breakage, consistent behavior
- **Verification**: All flows work correctly

---

## Related Issues & Context

### Previous Issues (From User Report)
- "Previously the onboarding was glitchy as the neighbourhoods were unselectable"
- This suggests the neighbourhood issue is recurring or never fully fixed

### Related Code Areas
- `src/contexts/AuthContext.tsx`: Auth state management
- `src/hooks/useNeighbourhoods.ts`: Neighbourhood data fetching
- `src/components/onboarding/NeighbourhoodSelector.tsx`: UI component
- `src/pages/Landing.tsx`: Landing page with button
- `src/screens/JoinScreen.tsx`: Onboarding flow

### Potential Interconnections
- If auth state is stuck, user may not be able to proceed to onboarding
- If neighbourhoods query requires auth, and auth is broken, neighbourhoods will fail
- Both issues may share a common root cause: network/timeout issues with Supabase

---

## Next Steps

1. **IMMEDIATE**: Collect all evidence listed in Phase 3
2. **ANALYSIS**: Review evidence to confirm root causes
3. **PLANNING**: Create detailed implementation plan with specific file changes
4. **IMPLEMENTATION**: Apply fixes with checkpoints
5. **VERIFICATION**: Test thoroughly before marking complete

**NO EDITS UNTIL EVIDENCE COLLECTED AND ROOT CAUSE CONFIRMED**


