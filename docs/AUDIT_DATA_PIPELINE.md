# Data Pipeline Audit - Adversarial Audit

**Date**: 2024-12-14  
**Auditor**: Data Architect + Senior Full-Stack Engineer  
**Status**: CRITICAL DATA INTEGRITY ISSUES IDENTIFIED

## 1. Source of Truth Analysis

### 1.1 Canonical Data Stores

| Data Type | Source of Truth | Derived Data | Cached Data | Issues |
|-----------|----------------|--------------|-------------|--------|
| User Profile | `profiles` table | `trust_tier` (calculated) | React state, React Query cache | ⚠️ **P1: Cache may be stale** |
| Tasks | `tasks` table | Distance (calculated client-side) | React state, React Query cache | ⚠️ **P1: Cache may be stale** |
| Matches | `matches` table | None | React state, React Query cache | ⚠️ **P1: Cache may be stale** |
| Messages | `messages` table | None | React state | ⚠️ **P1: No message history cache** |
| User Location | `profiles.neighbourhood` → `neighbourhoods` table | Client-side geolocation | React state | ⚠️ **P1: Location may be outdated** |

### 1.2 Data Reconciliation

**Current Implementation**:
- ✅ Database is single source of truth
- ⚠️ Client-side cache (React Query) may diverge
- ⚠️ Realtime subscriptions attempt to sync, but may miss updates

**Issues**:
1. **P1: Cache invalidation not guaranteed**
   - Location: All hooks using React Query
   - Issue: Cache may not invalidate on all update paths
   - Impact: Stale data shown to users

2. **P1: No cache versioning**
   - Location: `src/App.tsx:20` (QueryClient)
   - Issue: No version check, cache may be incompatible
   - Impact: Potential data corruption

3. **P1: Realtime subscription race conditions**
   - Location: `src/hooks/useTasks.ts:128-137`
   - Issue: `fetchTasks()` called on every change, may cause duplicate fetches
   - Impact: Unnecessary API calls, potential race conditions

## 2. Event Safety Analysis

### 2.1 Action → Write → Read → Failure → Recovery Table

| Action | Write Operation | Read Operation | Failure Handling | Recovery | Issues |
|--------|----------------|----------------|-------------------|----------|--------|
| Create Task | `tasks.insert()` | `tasks.select()` | Error returned | ❌ **No retry** | **P1: No retry mechanism** |
| Help with Task | `matches.insert()` + `tasks.update()` | `tasks.select()` | Error returned | ❌ **Partial: Match created but task not updated** | **P0: Non-atomic operation** |
| Send Message | `messages.insert()` | `messages.select()` | Error returned | ❌ **No retry** | **P1: Message lost** |
| Update Match Status | `matches.update()` | `matches.select()` | Error returned | ❌ **No retry** | **P1: No retry mechanism** |
| Update Profile | `profiles.update()` | `profiles.select()` | Error returned | ❌ **No retry** | **P1: No retry mechanism** |
| Cancel Task | `tasks.update()` | `tasks.select()` | Error returned | ❌ **No retry** | **P1: No retry mechanism** |

### 2.2 Idempotency Analysis

| Action | Idempotent | Implementation | Issues |
|--------|-----------|---------------|--------|
| Create Task | ❌ No | Can create duplicate tasks | **P1: No deduplication** |
| Help with Task | ❌ No | Can create multiple matches | **P0: Race condition** |
| Send Message | ✅ Yes | Each message has unique ID | None |
| Update Match Status | ⚠️ Partial | Update is idempotent, but no check | **P1: No optimistic locking** |
| Update Profile | ⚠️ Partial | Update is idempotent, but no check | **P1: No optimistic locking** |
| Cancel Task | ⚠️ Partial | Update is idempotent, but no check | **P1: No optimistic locking** |

### 2.3 Double-Submission Protection

| Action | Protection | Implementation | Issues |
|--------|-----------|---------------|--------|
| Create Task | ❌ None | No debouncing, can submit multiple times | **P1: Duplicate tasks possible** |
| Help with Task | ❌ None | No debouncing, can click multiple times | **P0: Multiple matches possible** |
| Send Message | ⚠️ Partial | `sending` state prevents, but can be bypassed | **P1: Race condition possible** |
| Update Match Status | ❌ None | No debouncing, can click multiple times | **P1: Multiple updates possible** |

**Critical Issues**:
1. **P0: helpWithTask has no double-submission protection**
   - Location: `src/hooks/useTasks.ts:170-209`
   - Issue: User can click "Help" multiple times, creating multiple matches
   - Fix: Add debouncing and check for existing match

2. **P1: createTask has no double-submission protection**
   - Location: `src/screens/PostScreen.tsx:147-189`
   - Issue: User can click "Confirm" multiple times, creating duplicate tasks
   - Fix: Add debouncing and disable button during submission

### 2.4 Partial Failure Handling

| Action | Partial Failure Possible | Handling | Issues |
|--------|------------------------|----------|--------|
| Help with Task | ✅ Yes | Match created, task update fails | **P0: Data inconsistency** |
| Create Task | ❌ No | Single insert operation | None |
| Send Message | ❌ No | Single insert operation | None |
| Update Match Status | ❌ No | Single update operation | None |
| Update Profile | ❌ No | Single update operation | None |

**Critical Issue**:
- **P0: helpWithTask partial failure**
  - Location: `src/hooks/useTasks.ts:170-209`
  - Issue: If task update fails after match creation, match exists but task still "open"
  - Impact: Data inconsistency, task appears available but has match
  - Fix: Wrap in database transaction or add rollback logic

### 2.5 Retry Logic

| Action | Retry Logic | Implementation | Issues |
|--------|-------------|---------------|--------|
| Create Task | ❌ None | Error shown, user must retry manually | **P1: No automatic retry** |
| Help with Task | ❌ None | Error shown, user must retry manually | **P1: No automatic retry** |
| Send Message | ❌ None | Error shown, message lost | **P1: Message lost, no retry** |
| Update Match Status | ❌ None | Error shown, user must retry manually | **P1: No automatic retry** |
| Update Profile | ❌ None | Error shown, user must retry manually | **P1: No automatic retry** |

**Recommendation**: Implement exponential backoff retry for all write operations

## 3. Time, Order, and Sync

### 3.1 Time-Dependent Logic

| Feature | Time Dependency | Implementation | Issues |
|---------|----------------|---------------|--------|
| Task ordering | `created_at` | Sorted by creation time | ⚠️ **P1: Clock skew possible** |
| Message ordering | `created_at` | Sorted by creation time | ⚠️ **P1: Clock skew possible** |
| Match ordering | `created_at` | Sorted by creation time | ⚠️ **P1: Clock skew possible** |
| Session expiration | Token expiry | Supabase handles | ✅ Good |
| Task status transitions | `updated_at` | Updated on status change | ⚠️ **P1: No version check** |

**Issues**:
1. **P1: No optimistic locking**
   - Location: All update operations
   - Issue: No version check before update, last write wins
   - Impact: Concurrent updates may overwrite each other

2. **P1: Clock skew not handled**
   - Location: All time-based sorting
   - Issue: Client/server clock differences may cause incorrect ordering
   - Impact: Messages/tasks may appear out of order

### 3.2 Order-Dependent Logic

| Feature | Order Dependency | Implementation | Issues |
|---------|-----------------|---------------|--------|
| Task feed | Creation time | Sorted by `created_at DESC` | ⚠️ **P1: Clock skew** |
| Message history | Creation time | Sorted by `created_at ASC` | ⚠️ **P1: Clock skew** |
| Match history | Creation time | Sorted by `created_at DESC` | ⚠️ **P1: Clock skew** |
| Task status transitions | Sequential | No state machine enforcement | **P1: Invalid transitions possible** |

**Issues**:
1. **P1: No state machine for task status**
   - Location: `src/hooks/useTasks.ts:211-225` (cancelTask)
   - Issue: Can cancel task in any state, no validation
   - Impact: Invalid state transitions possible

2. **P1: No state machine for match status**
   - Location: `src/hooks/useMatches.ts:81-92` (updateMatchStatus)
   - Issue: Can update to any status, no validation
   - Impact: Invalid state transitions possible (e.g., "completed" → "pending")

### 3.3 Session-Dependent Logic

| Feature | Session Dependency | Implementation | Issues |
|---------|-------------------|---------------|--------|
| Authentication | Session token | Supabase handles | ✅ Good |
| Profile access | Session token | RLS policies | ✅ Good |
| Task creation | Session token | RLS policies | ✅ Good |
| Match creation | Session token | RLS policies | ✅ Good |
| Message sending | Session token | RLS policies | ✅ Good |

**Issues**: None identified

### 3.4 Background Jobs

| Feature | Background Job | Implementation | Issues |
|---------|----------------|---------------|--------|
| Trust tier calculation | Database trigger | `calculate_trust_tier()` function | ⚠️ **P1: No error handling** |
| Task status updates | Client-side | Manual updates | ⚠️ **P1: No background job for cleanup** |
| Message delivery | Realtime | Supabase realtime | ✅ Good |
| Task expiration | ❌ None | Not implemented | **P2: Old tasks never expire** |

**Issues**:
1. **P1: No error handling for trust tier calculation**
   - Location: Database trigger (not in codebase)
   - Issue: If calculation fails, no error reported
   - Impact: Trust tier may not update

2. **P2: No task expiration**
   - Location: None
   - Issue: Old tasks never expire or auto-cancel
   - Impact: Feed may show very old tasks

## 4. Data Integrity Risks

### 4.1 Identified Risks

| Risk | Severity | Location | Impact |
|------|----------|----------|--------|
| Multiple matches per task | **P0** | `src/hooks/useTasks.ts:170-209` | Data inconsistency |
| Non-atomic task matching | **P0** | `src/hooks/useTasks.ts:170-209` | Data inconsistency |
| No optimistic locking | **P1** | All update operations | Concurrent update conflicts |
| No state machine validation | **P1** | Status updates | Invalid state transitions |
| Cache invalidation issues | **P1** | React Query cache | Stale data |
| Clock skew | **P1** | Time-based sorting | Incorrect ordering |
| No retry logic | **P1** | All write operations | Lost updates |

### 4.2 Reconciliation Mechanisms

**Current**:
- ✅ Realtime subscriptions attempt to sync
- ⚠️ Manual refresh available
- ❌ No automatic reconciliation

**Issues**:
1. **P1: Realtime may miss updates**
   - Location: All realtime subscriptions
   - Issue: If subscription drops, updates may be missed
   - Impact: Stale data shown

2. **P1: No conflict resolution**
   - Location: All update operations
   - Issue: Last write wins, no conflict detection
   - Impact: Concurrent updates may overwrite each other

## 5. Database Constraints

### 5.1 Current Constraints

| Constraint | Table | Implementation | Issues |
|-----------|-------|---------------|--------|
| UNIQUE(task_id, helper_id) | matches | Database constraint | ⚠️ **P0: Allows multiple matches if different helpers** |
| CHECK(status IN (...)) | tasks | Database constraint | ✅ Good |
| CHECK(status IN (...)) | matches | Database constraint | ✅ Good |
| CHECK(urgency IN (...)) | tasks | Database constraint | ✅ Good |
| FOREIGN KEY constraints | All tables | Database constraints | ✅ Good |

**Critical Issue**:
- **P0: No constraint preventing multiple active matches per task**
  - Location: `supabase/migrations/20251211173427_2eca74d7-e8e0-4a4c-ac0d-48155829ca15.sql:44`
  - Issue: `UNIQUE(task_id, helper_id)` allows multiple matches if different helpers
  - Impact: Task can be matched to multiple helpers
  - Fix: Add constraint: `UNIQUE(task_id)` where status != 'cancelled'

### 5.2 Missing Constraints

| Constraint | Needed | Reason |
|-----------|--------|--------|
| UNIQUE(task_id) where status != 'cancelled' | ✅ Yes | Prevent multiple active matches |
| CHECK for valid status transitions | ✅ Yes | Prevent invalid state transitions |
| CHECK for task expiration | ⚠️ Optional | Auto-expire old tasks |

## 6. Transaction Safety

### 6.1 Current Transaction Usage

| Operation | Transaction | Implementation | Issues |
|-----------|-------------|---------------|--------|
| Create Task | ❌ No | Single insert | None |
| Help with Task | ❌ No | Match insert + task update | **P0: Non-atomic** |
| Send Message | ❌ No | Single insert | None |
| Update Match Status | ❌ No | Single update | None |
| Update Profile | ❌ No | Single update | None |

**Critical Issue**:
- **P0: helpWithTask not wrapped in transaction**
  - Location: `src/hooks/useTasks.ts:170-209`
  - Issue: Match insert and task update are separate operations
  - Impact: If task update fails, match exists but task still "open"
  - Fix: Wrap in database transaction or use database function

### 6.2 Recommended Transactions

| Operation | Should Use Transaction | Reason |
|-----------|------------------------|--------|
| Help with Task | ✅ Yes | Multiple related updates |
| Cancel Task | ⚠️ Optional | May need to cancel related matches |
| Complete Task | ⚠️ Optional | May need to update credits, status, etc. |

## 7. Summary of Data Pipeline Issues

### P0 (Critical - Data Integrity)
1. Multiple matches per task (race condition)
2. Non-atomic task matching operations
3. No constraint preventing multiple active matches

### P1 (High - Data Quality)
1. No optimistic locking
2. No retry logic for failed operations
3. Cache invalidation not guaranteed
4. No state machine validation
5. Clock skew not handled
6. No conflict resolution
7. Realtime may miss updates

### P2 (Medium - Missing Features)
1. No task expiration
2. No background job for cleanup

## 8. Recommendations

### Immediate (P0)
1. Add database constraint: `UNIQUE(task_id)` where status != 'cancelled'
2. Wrap helpWithTask in database transaction
3. Add double-submission protection to helpWithTask

### Short-term (P1)
1. Implement optimistic locking for all updates
2. Add retry logic with exponential backoff
3. Add state machine validation for status transitions
4. Implement conflict resolution
5. Add cache versioning
6. Handle clock skew in sorting

### Long-term (P2)
1. Implement task expiration
2. Add background jobs for cleanup
3. Add data reconciliation jobs

