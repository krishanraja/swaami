# Diagnosis: Neighbourhood Dropdown Stuck in Loading State

**Date**: 2025-01-27  
**Issue**: Neighbourhood dropdown shows "Loading..." and is completely inactive/unclickable  
**Severity**: P0 - Critical (blocks onboarding)

## PHASE 1: Complete Problem Scope

### Observed Symptoms

From screenshot and user report:
- Dropdown displays "Loading..." text
- Dropdown is completely inactive/unclickable
- Continue button is disabled (grey text on yellow background)
- User is stuck in onboarding flow

### Architecture Map

```
User selects Sydney
  ↓
CitySelector onChange → setCity("sydney")
  ↓
JoinScreen renders NeighbourhoodSelector with city="sydney"
  ↓
NeighbourhoodSelector calls useNeighbourhoods("sydney")
  ↓
React Query executes query
  ├─> queryKey: ["neighbourhoods", "sydney"]
  ├─> queryFn: Supabase query with 15s timeout
  ├─> enabled: true (city is set)
  └─> Returns: {data, isLoading, error}
  ↓
NeighbourhoodSelector calculates:
  ├─> hasData = neighbourhoods && neighbourhoods.length > 0
  ├─> isDisabled = !hasData && (isLoading || !!error)
  └─> Select disabled={isDisabled}
  ↓
[ISSUE: Select remains disabled, showing "Loading..."]
```

### File References

1. **src/components/onboarding/NeighbourhoodSelector.tsx** (Lines 12-97)
   - Line 13: `const { data: neighbourhoods, isLoading, error, refetch } = useNeighbourhoods(city);`
   - Line 17: `const hasData = neighbourhoods && neighbourhoods.length > 0;`
   - Line 20: `const isDisabled = !hasData && (isLoading || !!error);`
   - Line 23-30: Diagnostic logging (should show state)
   - Line 59: `disabled={isDisabled}` passed to Select

2. **src/hooks/useNeighbourhoods.ts** (Lines 14-71)
   - Line 15: `return useQuery({...})`
   - Line 16: `queryKey: ["neighbourhoods", city]`
   - Line 17-59: `queryFn` with Supabase query and 15s timeout
   - Line 61: `enabled: !!city`
   - Line 63: `staleTime: 1000 * 60 * 5` (5 minutes)
   - Line 64: `refetchOnWindowFocus: false`
   - Line 65: **CRITICAL**: `refetchOnMount: false` - May prevent retry on remount
   - Line 66: `retry: 1`
   - Line 67: `retryDelay: 1000`
   - Line 69: `gcTime: 1000 * 60 * 5` (5 minutes cache)

3. **src/components/ui/select.tsx** (Lines 13-30)
   - Line 20: `disabled:cursor-not-allowed disabled:opacity-50` - Visual disabled state
   - Line 17-29: SelectTrigger implementation

4. **src/App.tsx** (Lines 22-35)
   - Line 28: Global `staleTime: 1000 * 60 * 5`
   - Line 30: Global `refetchOnWindowFocus: false`
   - **NOTE**: No global `refetchOnMount` setting (defaults to `true`)

### Conditional Rendering Branches

**NeighbourhoodSelector.tsx Decision Tree:**
```
1. city is set → Render NeighbourhoodSelector
2. useNeighbourhoods(city) called
3. Query state:
   a. isLoading === true → isDisabled = true (if !hasData)
   b. error exists → isDisabled = true (if !hasData)
   c. hasData === true → isDisabled = false (even if loading/error)
4. Select disabled={isDisabled}
5. SelectValue placeholder:
   a. isLoading → "Loading..."
   b. error && !hasData → "Error loading neighbourhoods"
   c. else → "Select your neighbourhood"
```

**useNeighbourhoods Query State Machine:**
```
Initial: enabled=false (city is null)
  ↓
City selected: enabled=true
  ↓
Query executes:
  ├─> Loading state: isLoading=true, data=undefined, error=undefined
  ├─> Success: isLoading=false, data=[...], error=undefined
  ├─> Error: isLoading=false, data=undefined, error=Error
  └─> Timeout: isLoading=false, data=undefined, error=Error("timeout")
  ↓
[ISSUE: Query may be stuck in loading state]
```

## PHASE 2: Root Cause Hypotheses

### Hypothesis 1: Query Stuck in Loading State (HIGH PROBABILITY)

**Evidence:**
- Screenshot shows "Loading..." which means `isLoading === true`
- Dropdown is disabled, which means `isDisabled === true`
- `isDisabled = !hasData && (isLoading || !!error)` → `true && (true || false)` = `true`

**Possible Causes:**
1. **Promise.race timeout not working correctly**
   - Line 32: `await Promise.race([queryPromise, timeoutPromise])`
   - If Supabase query hangs but doesn't reject, timeout may not fire
   - If timeout fires but query continues, race may not work as expected

2. **React Query not handling timeout rejection**
   - React Query expects queryFn to throw/reject on error
   - If Promise.race resolves with timeout but query continues, React Query may not transition to error state

3. **Network request hanging indefinitely**
   - Supabase client may be waiting for response that never comes
   - No network-level timeout in Supabase client configuration

4. **refetchOnMount: false preventing retry**
   - Line 65: `refetchOnMount: false`
   - If query failed/errored previously, it won't retry on component remount
   - Cache may have stale loading/error state

### Hypothesis 2: Query Disabled or Not Executing (MEDIUM PROBABILITY)

**Evidence:**
- Query has `enabled: !!city` (line 61)
- If city is null/undefined, query won't execute

**Possible Causes:**
1. City state not properly set
2. City value is null/undefined when component renders
3. React Query cache has disabled state

### Hypothesis 3: Error State Not Being Caught (MEDIUM PROBABILITY)

**Evidence:**
- Error handling exists but may not catch all error types
- React Query error state may not be set correctly

**Possible Causes:**
1. Error thrown but React Query doesn't catch it
2. Error object structure not matching expected format
3. Promise rejection not propagating correctly

### Hypothesis 4: Mobile Touch Interaction Blocked (LOW PROBABILITY)

**Evidence:**
- User reports dropdown is "completely inactive"
- Could be CSS/layout issue preventing clicks

**Possible Causes:**
1. Parent container with `overflow-hidden` blocking touch events
2. Z-index issues
3. Pointer-events CSS blocking interaction
4. Radix Select Portal issues on mobile

## Required Diagnostic Evidence

**Before making any fixes, we need:**

1. **Console Logs** (from diagnostic logging on line 23-30):
   - What does `[NeighbourhoodSelector]` log show?
   - Values of: `city`, `isLoading`, `error`, `hasData`, `isDisabled`, `neighbourhoodsCount`

2. **Network Tab**:
   - Is Supabase request being made?
   - Request status (pending, completed, failed)?
   - Response time?
   - Response body/error?

3. **React Query DevTools** (if available):
   - Query state in cache
   - Query status (idle, loading, error, success)
   - Query data/error values
   - Query timestamps

4. **Browser Console Errors**:
   - Any JavaScript errors?
   - Any Supabase client errors?
   - Any React Query errors?

## Critical Code Issues Identified

### Issue 1: refetchOnMount: false (Line 65)
**Problem**: If query previously failed or is in error state, it won't retry on component remount.
**Impact**: User stuck with stale error/loading state.

### Issue 2: Promise.race Timeout Implementation (Line 32)
**Problem**: If Supabase query hangs (doesn't reject), timeout may not fire correctly.
**Impact**: Query stuck in loading state indefinitely.

### Issue 3: No Network-Level Timeout
**Problem**: Supabase client doesn't have built-in timeout configuration.
**Impact**: Network requests can hang indefinitely.

### Issue 4: Diagnostic Logging Not Visible
**Problem**: Console logs may not be visible to user or may be cleared.
**Impact**: Can't diagnose runtime state.

## Next Steps

1. **Request Runtime Evidence**:
   - Ask user to check browser console for `[NeighbourhoodSelector]` logs
   - Ask user to check Network tab for Supabase requests
   - Ask user to check for any console errors

2. **Add Enhanced Diagnostic Logging**:
   - Log React Query state directly
   - Log query execution start/end
   - Log timeout firing
   - Log all error states

3. **Fix refetchOnMount Issue**:
   - Change `refetchOnMount: false` to `refetchOnMount: true` OR
   - Use `refetchOnMount: 'always'` to force retry even on error

4. **Improve Timeout Handling**:
   - Use AbortController for proper request cancellation
   - Ensure timeout properly rejects and React Query handles it

5. **Add Fallback UI**:
   - Show retry button if query fails
   - Allow manual refetch
   - Show clear error messages

## Files Requiring Investigation

1. `src/hooks/useNeighbourhoods.ts` - Query configuration and timeout logic
2. `src/components/onboarding/NeighbourhoodSelector.tsx` - Disabled state logic
3. `src/integrations/supabase/client.ts` - Supabase client configuration
4. Browser console/network tab - Runtime evidence

## Verification Checklist

- [ ] Console logs show query state
- [ ] Network tab shows request status
- [ ] React Query cache state verified
- [ ] Error messages visible (if any)
- [ ] Timeout actually fires (if query hangs)
- [ ] refetchOnMount behavior verified
- [ ] Mobile touch events working (if CSS issue)







