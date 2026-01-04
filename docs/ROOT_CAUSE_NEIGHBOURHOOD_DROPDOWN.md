# Root Cause Analysis: Neighbourhood Dropdown Stuck

**Date**: 2025-01-27  
**Confirmed Root Cause**: Query timeout + React Query retry causing extended loading state

## Confirmed Evidence

**Console Error**: 
```
Neighbourhoods query error: Error: Neighbourhoods query timeout
```

**Symptom**: Dropdown shows "Loading..." and is completely inactive

## Root Cause Chain

1. **Query Times Out** (15 seconds)
   - Supabase query hangs/times out
   - Promise.race timeout fires correctly
   - Error thrown: "Neighbourhoods query timeout"

2. **React Query Retries** (retry: 1)
   - First attempt: timeout after 15s → error thrown
   - React Query catches error, sets `isLoading: false`, `error: Error`
   - React Query retries (retry: 1) → `isLoading: true` again
   - Second attempt: timeout after 15s → error thrown
   - Total time: 30+ seconds of loading state

3. **Component Shows Loading State**
   - During retry, `isLoading: true`
   - `isDisabled = !hasData && (isLoading || !!error)` = `true`
   - Placeholder shows "Loading..." because `isLoading` is true

4. **Error State Not Visible**
   - After both attempts fail, React Query should set `isLoading: false`, `error: Error`
   - But component may not be showing error state properly
   - OR error state is shown but user doesn't see it

## Issues Identified

### Issue 1: Retry on Timeout (CRITICAL)
**Location**: `src/hooks/useNeighbourhoods.ts:66`
**Problem**: `retry: 1` causes query to retry even on timeout, doubling the wait time
**Impact**: User waits 30+ seconds instead of 15 seconds, sees "Loading..." the whole time

### Issue 2: refetchOnMount: false (HIGH)
**Location**: `src/hooks/useNeighbourhoods.ts:65`
**Problem**: If query previously failed, it won't retry on component remount
**Impact**: User stuck with stale error state, can't recover

### Issue 3: No Retry Logic for Timeout (MEDIUM)
**Problem**: Timeout errors should not retry (network issues won't resolve in 1 second)
**Impact**: Wasted retry attempts on timeout scenarios

### Issue 4: Error State Not Clearly Visible (MEDIUM)
**Location**: `src/components/onboarding/NeighbourhoodSelector.tsx:39-54`
**Problem**: Error alert only shows if `error && !hasData`, but may not be visible during retry
**Impact**: User doesn't know what's wrong

### Issue 5: Promise.race Doesn't Cancel Request (LOW)
**Location**: `src/hooks/useNeighbourhoods.ts:32`
**Problem**: When timeout fires, Supabase request continues in background
**Impact**: Wasted network resources, but doesn't affect UX directly

## Fix Strategy

### Fix 1: Disable Retry on Timeout
- Set `retry: 0` OR
- Use `retry: (failureCount, error) => { if (error.message.includes('timeout')) return false; return failureCount < 1; }`

### Fix 2: Allow Retry on Mount After Error
- Change `refetchOnMount: false` to `refetchOnMount: true` OR
- Use `refetchOnMount: 'always'` to force retry even on error

### Fix 3: Reduce Timeout for Faster Failure
- Reduce timeout from 15s to 8-10s for faster feedback
- OR keep 15s but show loading state with progress indicator

### Fix 4: Improve Error Display
- Show error immediately when query fails (even during retry)
- Make retry button more prominent
- Show timeout countdown or progress

### Fix 5: Add Manual Retry Button
- Always show retry button when error occurs
- Allow user to manually retry without waiting for automatic retry

## Implementation Plan

### File 1: `src/hooks/useNeighbourhoods.ts`

**Changes:**
1. Line 66: Change retry logic to not retry on timeout
2. Line 65: Change `refetchOnMount: false` to `refetchOnMount: true`
3. Line 23: Reduce timeout from 15000 to 10000 (10 seconds)
4. Add better error handling for timeout scenarios

**Exact Diffs:**
```typescript
// Line 22-24: Reduce timeout
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Neighbourhoods query timeout")), 10000); // Reduced from 15000
});

// Line 65: Allow retry on mount
refetchOnMount: true, // Changed from false - allows retry after error

// Line 66-67: Smart retry logic
retry: (failureCount, error) => {
  // Don't retry on timeout - network issues won't resolve quickly
  if (error instanceof Error && error.message.includes('timeout')) {
    return false;
  }
  // Retry once for other errors
  return failureCount < 1;
},
retryDelay: 1000,
```

### File 2: `src/components/onboarding/NeighbourhoodSelector.tsx`

**Changes:**
1. Show error state more prominently
2. Always show retry button when error exists (even if hasData)
3. Improve error message display

**Exact Diffs:**
```typescript
// Line 39: Show error alert even if hasData (for visibility)
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>
        {error instanceof Error ? error.message : "Failed to load neighbourhoods"}
      </span>
      <button
        onClick={() => refetch()}
        className="text-sm underline hover:no-underline ml-2"
      >
        Retry
      </button>
    </AlertDescription>
  </Alert>
)}

// Line 20: Update disabled logic to allow interaction if error but user can retry
const isDisabled = !hasData && isLoading; // Removed error from disabled condition - allow interaction to retry
```

## Verification Checkpoints

**CP1: Timeout Behavior**
- Action: Trigger timeout (wait 10 seconds or simulate slow network)
- Expected: Query fails after 10s, no retry, error shown immediately
- Verification: Console shows timeout error, dropdown shows error state, no second attempt

**CP2: Error Display**
- Action: Query fails with timeout
- Expected: Error alert visible, retry button shown, dropdown not disabled
- Verification: UI shows error message, retry button clickable

**CP3: Manual Retry**
- Action: Click retry button after error
- Expected: Query executes again, shows loading, then success/error
- Verification: Network tab shows new request, dropdown updates

**CP4: Remount Retry**
- Action: Navigate away and back to location step
- Expected: Query retries automatically if previous attempt failed
- Verification: Network tab shows request on mount

## Expected Outcomes

1. **Faster Failure**: Timeout reduced to 10s, no retry on timeout = 10s max wait instead of 30s
2. **Clear Error State**: User sees error immediately, can retry manually
3. **Recovery**: User can retry manually or by navigating away/back
4. **Better UX**: No extended "Loading..." state, clear feedback on what's wrong







