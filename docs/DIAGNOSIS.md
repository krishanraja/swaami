# Authentication Failure Diagnosis

**Date**: 2025-01-27  
**Issue**: Authentication broken, cannot log in  
**Severity**: P0 - Critical

## Observed Symptoms

### Symptom 1: "Failed to load profile" Error
- **Location**: `/join` route
- **UI Display**: Yellow warning icon with "Failed to load profile" message
- **Error Detail**: Shows "[object Object]" instead of readable error message
- **Screenshot Evidence**: Mobile browser showing error state with "Try Again" button

### Symptom 2: 404 NOT_FOUND Error
- **Location**: `swaami.ai/join`
- **Error Code**: `NOT_FOUND`
- **Error ID**: `sin1::5kldj-1765811035980-8b1d8e1ec3bb`
- **Screenshot Evidence**: 404 error page displayed

## Call Graph & Architecture Map

### Authentication Flow
```
User Login/Signup
  ↓
Auth.tsx (src/pages/Auth.tsx)
  ↓
useAuth() hook (src/hooks/useAuth.ts)
  ↓
Supabase Auth (onAuthStateChange)
  ↓
User authenticated → Navigate to /join
  ↓
Join.tsx (src/pages/Join.tsx)
  ↓
useProfile() hook (src/hooks/useProfile.ts)
  ↓
Supabase Query: profiles.select().eq(user_id).single()
  ↓
[ERROR OCCURS HERE]
  ↓
Error caught → setError() → Join.tsx displays error
```

### File References

#### Primary Files
1. **src/pages/Join.tsx** (Lines 8-90)
   - Component that displays error when profile fetch fails
   - Line 11: `const { profile, loading: profileLoading, error: profileError } = useProfile();`
   - Line 21-24: Error detection logic
   - Line 51-74: Error display UI
   - Line 63: **ISSUE**: `profileError?.message` may not work for Supabase errors

2. **src/hooks/useProfile.ts** (Lines 63-213)
   - Profile fetching hook
   - Line 90-131: Retry logic with backoff
   - Line 91-98: Supabase query with timeout
   - Line 100-124: Profile creation fallback (if PGRST116 error)
   - Line 126-128: Error throwing
   - Line 135-139: Error handling and conversion
   - Line 136: **ISSUE**: `new Error(String(err))` may lose Supabase error structure

3. **src/hooks/useAuth.ts** (Lines 1-33)
   - Authentication state management
   - Line 11-17: Auth state change listener
   - Line 19-23: Initial session fetch

4. **src/App.tsx** (Lines 22-54)
   - Route definitions
   - Line 35: `/join` route defined correctly

#### Supporting Files
5. **src/integrations/supabase/client.ts** (Lines 1-26)
   - Supabase client initialization
   - Line 5-6: Environment variable validation
   - Line 20-26: Client configuration

6. **src/pages/NotFound.tsx** (Lines 1-31)
   - 404 error page component
   - Matches the 404 error seen in screenshots

## Architecture Map

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                              │
│  User navigates to swaami.ai/join                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              React Router (App.tsx)                     │
│  Route: /join → Join component                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Join.tsx                                    │
│  1. useAuth() → Get user                                │
│  2. useProfile() → Fetch profile                        │
│  3. Check profileError → Display error if present      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              useProfile Hook                             │
│  1. Check if user exists                                │
│  2. Query: profiles.select().eq(user_id).single()       │
│  3. If PGRST116: Try to create profile                  │
│  4. If error: Convert to Error and setError()          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Client                             │
│  - Database query                                        │
│  - Possible failures:                                    │
│    * RLS policy violation                                │
│    * Network timeout                                     │
│    * Profile doesn't exist                               │
│    * Database connection error                           │
└─────────────────────────────────────────────────────────┘
```

## Observed Errors

### Error 1: Profile Load Failure
- **Type**: Supabase query error (exact type unknown)
- **Display**: "[object Object]" (indicates error object not properly stringified)
- **Location**: `src/pages/Join.tsx:63`
- **Root Cause Hypothesis**: 
  - Supabase PostgrestError structure not properly extracted
  - Error conversion in `useProfile.ts:136` loses error details

### Error 2: 404 NOT_FOUND
- **Type**: Route not found
- **Error Code**: `NOT_FOUND`
- **Error ID**: `sin1::5kldj-1765811035980-8b1d8e1ec3bb`
- **Location**: Route matching
- **Root Cause Hypothesis**:
  - Deployment desync (old bundle cached)
  - Route not registered in deployed version
  - Base path configuration issue

## Conditional Rendering Branches

### Join.tsx Decision Tree
```
1. authLoading || profileLoading → Show loading spinner
2. profileError exists → Show error UI (hasError = true)
3. !user → Navigate to /auth?mode=signup
4. !isOAuth && !email_confirmed_at → Navigate to /auth?mode=login
5. isOnboarded → Navigate to /app
6. readyToShow → Show JoinScreen
```

### useProfile.ts Error Handling
```
1. !user → Reset state, return early
2. Query error with code PGRST116 → Try to create profile
3. Create error → Wait 500ms, throw "Profile not found, creation pending"
4. Any other error → Throw error
5. Catch block → Convert to Error, setError()
```

## Environment Variables Required

- `VITE_SUPABASE_URL` (validated in client.ts:9-11)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (validated in client.ts:13-15)

## Network & Console Investigation Needed

**Required Evidence** (not yet captured):
1. Browser console errors at time of failure
2. Network tab showing Supabase request/response
3. Supabase error object structure (code, message, details, hint)
4. RLS policy status for profiles table
5. User session validity at time of profile fetch

## Related Issues from Audit

From `docs/AUDIT_FAILURE_REGISTER.md`:
- **F-005**: ProfileScreen Loader Never Exits (similar pattern)
- **F-004**: FeedScreen Loader Never Exits (similar error handling gap)

## Next Steps

1. **Phase 2**: Root Cause Investigation
   - Capture actual Supabase error structure
   - Verify RLS policies
   - Check network requests
   - Test error conversion logic

2. **Phase 3**: Implementation Plan
   - Fix error message extraction
   - Improve error handling
   - Add diagnostic logging
   - Verify route registration

