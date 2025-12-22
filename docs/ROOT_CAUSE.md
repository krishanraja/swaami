# Root Cause Analysis: Authentication Failure

**Date**: 2025-01-27  
**Related**: DIAGNOSIS.md

## Primary Root Cause

### Issue 1: Error Message Extraction Failure

**Location**: `src/pages/Join.tsx:63` and `src/hooks/useProfile.ts:136`

**Problem**:
The error displayed as "[object Object]" indicates that the error object is being stringified incorrectly. Supabase PostgrestError objects have a specific structure:
```typescript
{
  code: string,        // e.g., "PGRST116", "42501"
  message: string,     // Human-readable message
  details: string,      // Additional details
  hint: string         // Helpful hint
}
```

**Current Code**:
```typescript
// useProfile.ts:136
const error = err instanceof Error ? err : new Error(String(err));
```

**Issue**: When `err` is a Supabase PostgrestError:
- `String(err)` produces "[object Object]"
- The error structure is lost
- `error.message` in Join.tsx may be undefined or "[object Object]"

**Evidence**:
- Screenshot shows "[object Object]" in error message
- Error handling doesn't account for Supabase error structure

---

### Issue 2: Route 404 (Deployment Desync)

**Location**: Route matching in deployed instance

**Problem**:
The 404 error suggests either:
1. **Deployment desync**: Old bundle cached, route not registered
2. **Base path misconfiguration**: Route path doesn't match deployment base
3. **Build issue**: Route not included in production build

**Evidence**:
- 404 error with code `NOT_FOUND`
- Route is correctly defined in `src/App.tsx:35`
- Suggests deployment/build issue rather than code issue

---

## Secondary Issues

### Issue 3: Insufficient Error Logging

**Location**: `src/hooks/useProfile.ts:137`

**Problem**:
Error is logged to console but structure is not preserved:
```typescript
console.error("Error fetching profile:", error);
```

**Impact**:
- Cannot diagnose actual Supabase error code
- Cannot determine if RLS policy violation
- Cannot see network timeout vs database error

---

### Issue 4: Error Recovery Path

**Location**: `src/pages/Join.tsx:67`

**Problem**:
"Try Again" button does `window.location.reload()` which:
- Doesn't address root cause
- May retry same failing operation
- No incremental backoff or alternative path

---

## Root Cause Summary

| Issue | Root Cause | Impact | Severity |
|-------|------------|--------|----------|
| "[object Object]" error | Supabase error structure not extracted | User sees unhelpful error | P0 |
| 404 on /join | Deployment desync or build issue | User cannot access onboarding | P0 |
| Poor error logging | Error details not captured | Cannot diagnose failures | P1 |
| No recovery path | Reload doesn't fix underlying issue | User stuck in error loop | P1 |

## Verification Needed

Before implementing fixes, verify:

1. **Supabase Error Structure**:
   ```typescript
   // Add to useProfile.ts catch block:
   console.error("Raw error:", err);
   console.error("Error type:", err?.constructor?.name);
   console.error("Error code:", (err as any)?.code);
   console.error("Error message:", (err as any)?.message);
   ```

2. **RLS Policy Check**:
   - Verify profiles table RLS is enabled
   - Verify policy allows SELECT for authenticated users
   - Check if user_id matches auth.uid()

3. **Network Request**:
   - Capture actual HTTP status code
   - Check request headers (Authorization)
   - Verify Supabase URL is correct

4. **Deployment State**:
   - Compare local App.tsx routes to deployed routes
   - Check build output for route registration
   - Verify base path configuration

## Expected vs Actual Behavior

### Expected
- User logs in → Profile loads → Navigate to /join → Show JoinScreen
- If profile fetch fails → Show readable error message with retry option
- Error message should indicate: "Profile not found" or "Database error" or "Network timeout"

### Actual
- User logs in → Profile fetch fails → Error shows "[object Object]" → User cannot proceed
- 404 error on /join route → User cannot access onboarding

## Fix Strategy

1. **Fix error extraction** (P0):
   - Extract Supabase error properties properly
   - Preserve error code, message, details
   - Display user-friendly message

2. **Add diagnostic logging** (P0):
   - Log full error structure
   - Log Supabase error codes
   - Log network request details

3. **Improve error recovery** (P1):
   - Add retry with backoff
   - Provide alternative paths (create profile manually)
   - Better error messages

4. **Verify deployment** (P0):
   - Check route registration in build
   - Verify base path configuration
   - Clear cache and redeploy if needed

