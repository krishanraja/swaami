# System & State Map - Adversarial Audit

**Date**: 2024-12-14  
**Auditor**: Adversarial Power User  
**Status**: CRITICAL GAPS IDENTIFIED

## 1. User Modes & Concurrency

### 1.1 Explicitly Enumerated Usage Modes

| Mode | Supported | Implementation | Issues |
|------|-----------|----------------|--------|
| Solo user | ✅ Yes | Single user, single session | None |
| Multiple concurrent users | ⚠️ Partial | Multiple users can view same task | **P0: Race condition in helpWithTask** |
| Asynchronous collaboration | ✅ Yes | Real-time subscriptions | **P1: No conflict resolution** |
| Sequential hand-offs | ❌ No | Not supported | **P2: Missing feature** |
| Read-only participants | ✅ Yes | RLS policies allow viewing | None |
| Returning users after inactivity | ⚠️ Partial | Session persists, but state may be stale | **P1: No state refresh on return** |
| Users joining mid-flow | ⚠️ Partial | Can join chat, but may miss context | **P2: No catch-up mechanism** |

### 1.2 State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LIFECYCLE STATES                   │
└─────────────────────────────────────────────────────────────┘

[Unauthenticated]
    │
    ├─→ [Auth Screen] ──→ [Email/Google Sign-in]
    │                          │
    │                          ├─→ [Email Verification Required] ──→ [Auth Screen] (LOOP RISK)
    │                          │
    │                          └─→ [Authenticated]
    │                                    │
    │                                    ├─→ [Profile Check]
    │                                    │
    │                                    ├─→ [No Profile] ──→ [Join/Onboarding]
    │                                    │                        │
    │                                    │                        ├─→ [Phone Verification] ──→ [Complete]
    │                                    │                        │
    │                                    │                        └─→ [Incomplete] ──→ [Join Screen] (DEAD END?)
    │                                    │
    │                                    └─→ [Profile Exists] ──→ [App Ready]
    │                                                              │
    │                                                              ├─→ [Feed Screen]
    │                                                              │
    │                                                              ├─→ [Post Screen]
    │                                                              │
    │                                                              ├─→ [Chat Screen]
    │                                                              │
    │                                                              └─→ [Profile Screen]
    │
    └─→ [App Refresh/Crash] ──→ [Session Recovery] ──→ [State Reconstruction]
                                                          │
                                                          ├─→ [Success] ──→ [App Ready]
                                                          │
                                                          └─→ [Failure] ──→ [Error State] (NO RECOVERY PATH)
```

### 1.3 Valid State Combinations

| State Combination | Valid | Current Behavior | Issue |
|-------------------|-------|------------------|-------|
| User authenticated + No profile | ✅ | Redirects to /join | None |
| User authenticated + Partial profile | ⚠️ | Allows access, shows alerts | **P1: Inconsistent UX** |
| User authenticated + Complete profile | ✅ | Full access | None |
| Multiple users viewing same task | ✅ | All see "open" status | **P0: Race condition** |
| Multiple users helping same task | ❌ | Both can create matches | **P0: Data integrity violation** |
| User offline + Pending actions | ❌ | Actions fail silently | **P1: No offline queue** |
| Session expired + Active chat | ❌ | Chat breaks, no recovery | **P0: Silent failure** |

### 1.4 Unsupported States (CRITICAL GAPS)

1. **P0: Concurrent Task Help Race Condition**
   - **Location**: `src/hooks/useTasks.ts:170-209` (helpWithTask)
   - **Issue**: Two users can click "Help" simultaneously, both create matches
   - **Impact**: Task gets matched to multiple helpers, data inconsistency
   - **Detection**: No database constraint preventing multiple matches per task
   - **Recovery**: None - requires manual cleanup

2. **P0: Non-Atomic Task Matching**
   - **Location**: `src/hooks/useTasks.ts:170-209` (helpWithTask)
   - **Issue**: Match insert and task update are separate operations
   - **Impact**: If task update fails, match exists but task still "open"
   - **Detection**: Error returned, but match already created
   - **Recovery**: Partial - match exists but task not updated

3. **P1: Stale State on Return**
   - **Location**: `src/hooks/useTasks.ts:124-142`, `src/hooks/useMatches.ts:62-79`
   - **Issue**: Realtime subscriptions may miss updates during offline period
   - **Impact**: User sees outdated task/match status
   - **Detection**: Manual refresh required
   - **Recovery**: User must manually refresh

4. **P1: Incomplete Profile Access**
   - **Location**: `src/pages/Index.tsx:30-41`
   - **Issue**: Users with incomplete profiles can access app
   - **Impact**: Confusing UX, missing features may not work
   - **Detection**: ProfileScreen shows alerts
   - **Recovery**: User must complete profile manually

## 2. Lifecycle Coverage

### 2.1 Lifecycle States

| State | Supported | Implementation | Issues |
|-------|-----------|----------------|--------|
| First-time user | ✅ | Onboarding flow | **P2: Can skip steps** |
| Partially onboarded | ⚠️ | Partial access granted | **P1: Inconsistent state** |
| Fully active | ✅ | Full access | None |
| Idle | ⚠️ | Session persists | **P1: No activity timeout** |
| Returning after long gap | ⚠️ | Session may expire | **P0: No graceful expiration** |
| Logged out mid-flow | ❌ | State lost | **P0: No state preservation** |
| App refresh or crash | ⚠️ | Session persists | **P1: UI state lost** |
| Version mismatch | ❌ | Not handled | **P2: Potential breakage** |
| Cached state | ⚠️ | React Query cache | **P1: Stale data risk** |

### 2.2 State Reconstruction

**Current Implementation**:
- Session: ✅ Persisted in localStorage (`src/integrations/supabase/client.ts:13`)
- Profile: ✅ Fetched on mount (`src/hooks/useProfile.ts:36-49`)
- Tasks: ✅ Fetched on mount + realtime (`src/hooks/useTasks.ts:124-142`)
- Matches: ✅ Fetched on mount + realtime (`src/hooks/useMatches.ts:62-79`)
- Messages: ✅ Fetched on mount + realtime (`src/hooks/useMessages.ts:45-70`)

**Issues**:
1. **P1: No optimistic UI state recovery**
   - Location: All screen components
   - Issue: UI state (scroll position, filters, form inputs) lost on refresh
   - Impact: Poor UX, user must reconfigure

2. **P1: Realtime subscription race conditions**
   - Location: `src/hooks/useTasks.ts:128-137`
   - Issue: `fetchTasks()` called on every change, can cause duplicate fetches
   - Impact: Unnecessary API calls, potential race conditions

3. **P2: No version check**
   - Location: None
   - Issue: App doesn't check for updates or version compatibility
   - Impact: Users may run incompatible versions

## 3. Navigation & Recovery

### 3.1 Navigation Paths

| Path | Supported | Behavior | Issues |
|------|-----------|----------|--------|
| Back button | ⚠️ | Browser back | **P1: May lose state** |
| Refresh | ⚠️ | Reloads app | **P1: UI state lost** |
| Deep links | ❌ | Not implemented | **P2: Missing feature** |
| App reopen after crash | ⚠️ | Session persists | **P1: UI state lost** |
| Browser tab duplication | ⚠️ | New session | **P1: Multiple subscriptions** |
| Direct URL navigation | ⚠️ | Works if authenticated | **P1: No auth check on route** |

### 3.2 Dead Ends Identified

1. **P0: Chat screen with invalid matchId**
   - Location: `src/screens/ChatScreen.tsx:68-74`
   - Issue: If matchId doesn't exist, shows loading forever
   - Impact: User stuck, no recovery path
   - Fix: Redirect to chats list if match not found

2. **P1: Auth screen redirect loop**
   - Location: `src/pages/Auth.tsx:52-73`
   - Issue: If email not confirmed, redirects to /auth, but user already there
   - Impact: User stuck in loop
   - Fix: Show email confirmation message instead of redirect

3. **P1: Join screen with complete profile**
   - Location: `src/pages/Join.tsx:30-39`
   - Issue: If profile complete, redirects to /app, but may have been called from elsewhere
   - Impact: Unexpected navigation
   - Fix: Preserve intended destination

## 4. Unsupported State Summary

### P0 (Critical - Data Integrity)
1. Multiple matches per task (race condition)
2. Non-atomic task matching operations
3. Chat screen with invalid matchId (dead end)

### P1 (High - UX Issues)
1. Stale state on return from offline
2. Incomplete profile access
3. UI state lost on refresh
4. Realtime subscription race conditions
5. Auth redirect loop
6. No optimistic UI state recovery

### P2 (Medium - Missing Features)
1. No sequential hand-offs
2. No catch-up mechanism for mid-flow joiners
3. No version check
4. No deep links

## 5. Recommendations

1. **Immediate (P0)**:
   - Add database constraint: `UNIQUE(task_id)` on matches where status != 'cancelled'
   - Wrap helpWithTask in database transaction
   - Add match existence check in ChatScreen

2. **Short-term (P1)**:
   - Implement optimistic UI state persistence
   - Add state refresh on app focus
   - Fix auth redirect loop
   - Debounce realtime subscription callbacks

3. **Long-term (P2)**:
   - Implement deep linking
   - Add version check mechanism
   - Add catch-up mechanism for chat

