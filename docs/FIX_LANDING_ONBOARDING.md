# Landing Page & Onboarding Fixes

**Date**: 2025-01-27  
**Issues Fixed**:
1. Landing page "Get Started" button stuck on "Loading..." forever
2. Neighbourhood selector completely disabled during onboarding

## Root Causes Identified

### Issue 1: Button Stuck on "Loading..."
**Root Cause**: `authState` stuck in "loading" because `authLoading` or `profileLoading` never resolved to `false`.

**Why it happened**:
- `supabase.auth.getSession()` could hang indefinitely on network issues
- No timeout mechanism, so if request hung, `authLoading` stayed `true` forever
- Race condition between `initAuth()` and `onAuthStateChange` could cause state inconsistency

### Issue 2: Neighbourhood Selector Disabled
**Root Cause**: React Query stuck in loading state because neighbourhoods query never resolved.

**Why it happened**:
- Supabase query could hang indefinitely on network issues
- No timeout mechanism in React Query
- Query would stay in loading state forever, keeping Select disabled

## Fixes Applied

### 1. AuthContext.tsx - Added Timeouts and Better Error Handling

**Changes**:
- Added 5-second timeout to `getSession()` call in `initAuth()`
- Added 10-second timeout to profile fetch
- Added `initCompleted` flag to prevent race conditions
- On timeout/error, gracefully fall back to unauthenticated state
- Ensured `authLoading` always resolves to `false` even on errors

**Key Code**:
```typescript
// Timeout wrapper for getSession
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Auth init timeout")), 5000);
});
const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);
```

### 2. useNeighbourhoods.ts - Added Query Timeout

**Changes**:
- Added 8-second timeout to neighbourhoods query
- Improved error messages for timeout scenarios
- Reduced retry count from 2 to 1 for faster failure
- Fixed retry delay instead of exponential backoff

**Key Code**:
```typescript
// Timeout wrapper for query
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Neighbourhoods query timeout")), 8000);
});
const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
```

### 3. App.tsx - Improved QueryClient Defaults

**Changes**:
- Configured QueryClient with better default options
- Set default retry to 1 for faster failure
- Added proper cache time configuration

### 4. NeighbourhoodSelector.tsx - Better Error Handling

**Changes**:
- Allow selection if cached data exists even after error
- Improved disabled state logic: `isDisabled = isLoading || (!!error && !hasData)`
- Better error messaging

### 5. index.html - Removed CSP Warning

**Changes**:
- Removed `frame-ancestors` from CSP meta tag (only works in HTTP headers)
- Added comment explaining why

## Testing Checklist

- [ ] Landing page loads, button shows correct text (not stuck on "Loading...")
- [ ] Button is clickable immediately (not disabled)
- [ ] Onboarding flow works
- [ ] City selection works
- [ ] Neighbourhood selector is enabled and selectable
- [ ] Neighbourhoods load within 8 seconds or show error with retry
- [ ] Auth state resolves within 5 seconds or falls back to unauthenticated

## Files Modified

1. `src/contexts/AuthContext.tsx` - Added timeouts to auth initialization and profile fetch
2. `src/hooks/useNeighbourhoods.ts` - Added timeout to neighbourhoods query
3. `src/App.tsx` - Improved QueryClient defaults
4. `src/components/onboarding/NeighbourhoodSelector.tsx` - Better error handling
5. `index.html` - Removed CSP warning

## Prevention

These fixes prevent:
- Infinite loading states
- Hanging requests
- Race conditions in auth state
- Disabled UI elements due to stuck queries

All async operations now have timeouts and proper error handling to ensure UI always becomes interactive.


