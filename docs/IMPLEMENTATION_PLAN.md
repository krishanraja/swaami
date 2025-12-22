# Implementation Plan: Authentication Error Fix

**Date**: 2025-01-27  
**Related**: DIAGNOSIS.md, ROOT_CAUSE.md

## Overview

Fix authentication failure by:
1. Properly extracting Supabase error messages
2. Adding diagnostic logging
3. Improving error recovery
4. Verifying route deployment

## Files to Modify

### File 1: `src/hooks/useProfile.ts`
**Lines**: 135-139 (error handling in catch block)

**Current Code**:
```typescript
} catch (err) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error("Error fetching profile:", error);
  setError(error);
  setProfile(null);
}
```

**Proposed Change**:
```typescript
} catch (err) {
  // Extract Supabase error structure properly
  let errorMessage = "Failed to load profile";
  let errorCode: string | undefined;
  
  // Log full error structure for diagnosis
  console.error("Raw profile fetch error:", err);
  console.error("Error type:", err?.constructor?.name);
  
  if (err && typeof err === 'object') {
    // Supabase PostgrestError structure
    const supabaseError = err as any;
    errorCode = supabaseError?.code;
    errorMessage = supabaseError?.message || supabaseError?.details || errorMessage;
    
    // Log Supabase-specific fields
    if (supabaseError?.code) console.error("Supabase error code:", supabaseError.code);
    if (supabaseError?.hint) console.error("Supabase hint:", supabaseError.hint);
    if (supabaseError?.details) console.error("Supabase details:", supabaseError.details);
  } else if (err instanceof Error) {
    errorMessage = err.message;
  } else {
    errorMessage = String(err) || errorMessage;
  }
  
  // Create error with proper message
  const error = new Error(errorMessage);
  if (errorCode) {
    (error as any).code = errorCode;
  }
  
  console.error("Processed error:", error);
  setError(error);
  setProfile(null);
}
```

**Rationale**: 
- Preserves Supabase error structure
- Extracts readable message
- Logs diagnostic information
- Maintains backward compatibility

**Also fix refetch function** (Lines 203-206):
```typescript
} catch (err) {
  // Use same error extraction logic as main fetch
  let errorMessage = "Failed to refetch profile";
  let errorCode: string | undefined;
  
  console.error("Raw refetch error:", err);
  
  if (err && typeof err === 'object') {
    const supabaseError = err as any;
    errorCode = supabaseError?.code;
    errorMessage = supabaseError?.message || supabaseError?.details || errorMessage;
    
    if (supabaseError?.code) console.error("Supabase error code:", supabaseError.code);
  } else if (err instanceof Error) {
    errorMessage = err.message;
  } else {
    errorMessage = String(err) || errorMessage;
  }
  
  const error = new Error(errorMessage);
  if (errorCode) {
    (error as any).code = errorCode;
  }
  
  console.error("Processed refetch error:", error);
  setError(error);
}
```

---

### File 2: `src/pages/Join.tsx`
**Lines**: 62-64 (error message display)

**Current Code**:
```typescript
<p className="text-muted-foreground text-sm mb-4">
  {profileError?.message || "Something went wrong while loading your profile. Please try again."}
</p>
```

**Proposed Change**:
```typescript
<p className="text-muted-foreground text-sm mb-4">
  {(() => {
    if (!profileError) return "Something went wrong while loading your profile. Please try again.";
    
    // Extract message, handling both Error and Supabase error structures
    const message = profileError.message || 
                   (profileError as any)?.details || 
                   String(profileError);
    
    // Don't show "[object Object]"
    if (message === "[object Object]") {
      return "Something went wrong while loading your profile. Please try again.";
    }
    
    return message;
  })()}
</p>
```

**Rationale**:
- Prevents "[object Object]" display
- Handles multiple error structures
- Provides fallback message

---

### File 3: `src/pages/Join.tsx`
**Lines**: 66-71 (Try Again button)

**Current Code**:
```typescript
<button
  onClick={() => window.location.reload()}
  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
>
  Try Again
</button>
```

**Proposed Change**:
```typescript
<button
  onClick={async () => {
    // Try to refetch profile instead of full reload
    if (profileError && 'refetch' in useProfile()) {
      const { refetch } = useProfile();
      await refetch();
    } else {
      // Fallback to reload if refetch not available
      window.location.reload();
    }
  }}
  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
>
  Try Again
</button>
```

**Wait**: This won't work because we can't call hooks conditionally. Let me revise:

**Revised Change**:
```typescript
// Update line 11 to include refetch:
const { profile, loading: profileLoading, error: profileError, refetch } = useProfile();

// Then in button (lines 66-71):
<button
  onClick={async () => {
    // Try to refetch profile instead of full reload
    try {
      await refetch();
      // If refetch succeeds, hasError will be cleared by useEffect
    } catch (err) {
      // If refetch fails, reload page as fallback
      console.error("Refetch failed, reloading:", err);
      window.location.reload();
    }
  }}
  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
>
  Try Again
</button>
```

**Note**: The `refetch` function already exists in `useProfile.ts` (line 184-210) and is returned (line 212), so we just need to destructure it.

**Rationale**:
- Uses refetch instead of full page reload
- Provides better UX
- Falls back to reload if refetch fails

---

## Checkpoints

### CP0: Plan Approval
**Action**: Review proposed changes
**Expected**: 
- Diffs make sense
- No regressions introduced
- Error handling improved
**Verification**: Manual review of plan

---

### CP1: Environment + Config Checks
**Action**: 
1. Verify Supabase client initialization
2. Check environment variables are set
3. Build project: `npm run build`
4. Check for TypeScript errors: `npm run lint`

**Expected**:
- Clean build
- No console errors on startup
- Environment variables validated

**Verification**:
- Build output shows no errors
- `npm run lint` passes
- Browser console shows no initialization errors

---

### CP2: Core Feature Fix Proven
**Action**:
1. Apply changes to `useProfile.ts` and `Join.tsx`
2. Start dev server: `npm run dev`
3. Attempt login
4. Trigger profile fetch error (if possible) or check error handling

**Expected**:
- Error messages are readable (not "[object Object]")
- Console shows diagnostic logs
- Error structure is preserved

**Verification**:
- Browser console shows proper error logs
- Error UI displays readable message
- Network tab shows Supabase request details

**Test Cases**:
1. **Normal flow**: Login → Profile loads → Navigate to /join → Success
2. **Error case**: Simulate profile fetch failure → Check error message
3. **Retry**: Click "Try Again" → Verify refetch works

---

### CP3: Secondary Integrations Validated
**Action**:
1. Test full authentication flow
2. Test onboarding completion
3. Test error recovery paths
4. Test on mobile viewport (responsive)

**Expected**:
- Authentication flow works end-to-end
- Error states don't break navigation
- Mobile UI displays correctly
- No console errors in normal flow

**Verification**:
- Complete signup → onboarding → app entry
- Test error scenarios
- Check mobile responsive layout
- Verify no new console errors

---

### CP4: Regression Test
**Action**:
1. Run full flow 3+ times
2. Test with different user states:
   - New user (no profile)
   - Existing user (has profile)
   - User with incomplete profile
3. Test error scenarios:
   - Network offline
   - Invalid session
   - Database error

**Expected**:
- All flows work consistently
- No new errors introduced
- Error handling is robust

**Verification**:
- 3+ successful full flows
- Error scenarios handled gracefully
- No regressions in existing features

---

## Risk Assessment

### Low Risk
- Error message extraction fix (isolated change)
- Diagnostic logging (additive, no behavior change)

### Medium Risk
- Refetch button change (may affect error recovery UX)
- Error handling modifications (could mask other issues)

### Mitigation
- Add comprehensive logging to catch edge cases
- Test error scenarios thoroughly
- Keep fallback to page reload

---

## Rollback Plan

If issues arise:
1. Revert changes to `useProfile.ts` (keep original error handling)
2. Revert changes to `Join.tsx` (keep original error display)
3. Keep diagnostic logging (non-breaking)
4. Investigate captured logs before retrying

---

## Success Criteria

✅ Error messages are readable (not "[object Object]")  
✅ Diagnostic logs capture error structure  
✅ "Try Again" button works (refetch or reload)  
✅ No regressions in authentication flow  
✅ Mobile UI displays errors correctly  
✅ Full flow works 3+ times without breakage

