# Failure Register - Adversarial Audit

**Date**: 2024-12-14  
**Auditor**: Adversarial Power User  
**Status**: 27 CRITICAL AND HIGH-SEVERITY FAILURES IDENTIFIED

## Failure Register

### P0 - Critical Failures (Data Integrity & Dead Ends)

#### F-001: Multiple Matches Per Task (Race Condition)
- **Description**: Two users can click "Help" simultaneously, both create matches for the same task
- **Trigger**: Two users click "Help" on same task within ~100ms
- **User Impact**: Task gets matched to multiple helpers, data inconsistency, user confusion
- **Detectability**: High - visible in database, users see duplicate matches
- **Severity**: P0
- **Exact Location**: `src/hooks/useTasks.ts:170-209` (helpWithTask function)
- **Root Cause**: No database constraint preventing multiple matches, no optimistic locking
- **Current Behavior**: Both matches created, task status updated to "matched" (last write wins)
- **Expected Behavior**: Only first match succeeds, second user sees "Task already matched" error

#### F-002: Non-Atomic Task Matching Operation
- **Description**: Match insert and task update are separate operations, not wrapped in transaction
- **Trigger**: helpWithTask called, match insert succeeds but task update fails
- **User Impact**: Match exists but task still shows as "open", data inconsistency
- **Detectability**: Medium - visible in database, task appears available but has match
- **Severity**: P0
- **Exact Location**: `src/hooks/useTasks.ts:170-209` (helpWithTask function, lines 177-195)
- **Root Cause**: Operations not wrapped in database transaction
- **Current Behavior**: Match created, task update fails, error returned but match exists
- **Expected Behavior**: Both operations succeed or both fail (atomic)

#### F-003: Chat Screen Dead End (Invalid matchId)
- **Description**: If matchId doesn't exist, ChatScreen shows loading forever
- **Trigger**: User navigates to `/chat/:matchId` with invalid or deleted matchId
- **User Impact**: User stuck on loading screen, no recovery path
- **Detectability**: High - user sees loading screen indefinitely
- **Severity**: P0
- **Exact Location**: `src/screens/ChatScreen.tsx:68-74` (loading check)
- **Root Cause**: No timeout, no match existence check, no redirect on failure
- **Current Behavior**: Shows "Loading chat..." forever if match not found
- **Expected Behavior**: Redirect to chats list after timeout or if match not found

#### F-004: FeedScreen Loader Never Exits (Fetch Failure)
- **Description**: If fetchTasks() fails, loader shows forever, no error state
- **Trigger**: Network error, database error, or RPC function failure
- **User Impact**: User sees loading skeleton forever, cannot use app
- **Detectability**: High - user sees loading screen indefinitely
- **Severity**: P0
- **Exact Location**: `src/screens/FeedScreen.tsx:194-202` (loading state)
- **Root Cause**: No error state, no timeout, error only logged to console
- **Current Behavior**: Shows loading skeleton forever on fetch error
- **Expected Behavior**: Show error state with retry button after timeout

#### F-005: ProfileScreen Loader Never Exits (Fetch Failure)
- **Description**: If profile fetch fails, loader shows forever, no error state
- **Trigger**: Network error, database error, or profile not found
- **User Impact**: User sees loading screen forever, cannot view profile
- **Detectability**: High - user sees loading screen indefinitely
- **Severity**: P0
- **Exact Location**: `src/screens/ProfileScreen.tsx` (loading state, exact line depends on implementation)
- **Root Cause**: No error state, no timeout, error only logged to console
- **Current Behavior**: Shows loading forever on fetch error
- **Expected Behavior**: Show error state with retry button after timeout

#### F-006: PostScreen Success Toast Shows Even If Task Creation Fails
- **Description**: handleConfirm may show success toast even if createTask fails silently
- **Trigger**: Network error during task creation, error not properly caught
- **User Impact**: User thinks task posted but it didn't, false success feedback
- **Detectability**: Medium - user sees success but task not in feed
- **Severity**: P0
- **Exact Location**: `src/screens/PostScreen.tsx:147-189` (handleConfirm function)
- **Root Cause**: Success toast shown before verifying createTask succeeded
- **Current Behavior**: If createError exists, error toast shown, but edge case may show success
- **Expected Behavior**: Only show success toast after verifying task created successfully

#### F-007: ChatScreen Success Toast Shows Even If Task Update Fails
- **Description**: handleStatusUpdate may show success toast even if task update fails
- **Trigger**: Network error during task status update, error not properly caught
- **User Impact**: User thinks task completed but it didn't, false success feedback
- **Detectability**: Medium - user sees success but task not actually completed
- **Severity**: P0
- **Exact Location**: `src/screens/ChatScreen.tsx:46-66` (handleStatusUpdate function, lines 58-63)
- **Root Cause**: Success toast shown before verifying task update succeeded
- **Current Behavior**: If error exists, error toast shown, but edge case may show success
- **Expected Behavior**: Only show success toast after verifying task updated successfully

#### F-008: Auth Redirect Loop (Unverified Email)
- **Description**: If email not confirmed, redirects to /auth, but user already there, causing loop
- **Trigger**: User signs up with email, doesn't confirm, tries to access app
- **User Impact**: User stuck in redirect loop, cannot access app
- **Detectability**: High - user sees redirect loop
- **Severity**: P0
- **Exact Location**: `src/pages/Auth.tsx:52-73` (useEffect with auth state change)
- **Root Cause**: Redirects to /auth when already on /auth, no check for current route
- **Current Behavior**: Redirects to /auth repeatedly if email not confirmed
- **Expected Behavior**: Show email confirmation message instead of redirecting

### P1 - High Severity Failures (UX & Data Quality)

#### F-009: No Double-Submission Protection (helpWithTask)
- **Description**: User can click "Help" multiple times, creating multiple matches
- **Trigger**: User clicks "Help" button multiple times rapidly
- **User Impact**: Multiple matches created, user confusion, data inconsistency
- **Detectability**: Medium - visible in database, user may see duplicate matches
- **Severity**: P1
- **Exact Location**: `src/hooks/useTasks.ts:170-209` (helpWithTask function)
- **Root Cause**: No debouncing, no button disable during submission
- **Current Behavior**: Each click creates a new match
- **Expected Behavior**: Disable button during submission, debounce clicks

#### F-010: No Double-Submission Protection (createTask)
- **Description**: User can click "Confirm" multiple times, creating duplicate tasks
- **Trigger**: User clicks "Confirm" button multiple times rapidly
- **User Impact**: Duplicate tasks created, user confusion
- **Detectability**: Medium - visible in feed, user may see duplicate tasks
- **Severity**: P1
- **Exact Location**: `src/screens/PostScreen.tsx:147-189` (handleConfirm function)
- **Root Cause**: No debouncing, no button disable during submission
- **Current Behavior**: Each click creates a new task
- **Expected Behavior**: Disable button during submission, debounce clicks

#### F-011: No Retry Mechanism (All Write Operations)
- **Description**: Failed write operations show error but no retry button
- **Trigger**: Network error during any write operation
- **User Impact**: User must manually retry, poor UX
- **Detectability**: High - user sees error toast
- **Severity**: P1
- **Exact Location**: All write operations (createTask, helpWithTask, sendMessage, updateMatchStatus, updateProfile)
- **Root Cause**: No retry UI, no automatic retry with exponential backoff
- **Current Behavior**: Error toast shown, user must manually retry
- **Expected Behavior**: Show retry button, implement automatic retry with exponential backoff

#### F-012: Message Lost on Send Failure
- **Description**: If message send fails, message is lost, no retry mechanism
- **Trigger**: Network error during message send
- **User Impact**: User must retype message, poor UX
- **Detectability**: High - user sees error toast, message not sent
- **Severity**: P1
- **Exact Location**: `src/hooks/useMessages.ts:72-86` (sendMessage function)
- **Root Cause**: No message queue, no retry mechanism
- **Current Behavior**: Error toast shown, message lost
- **Expected Behavior**: Queue message, retry automatically, show retry button

#### F-013: No Offline Queue
- **Description**: Actions fail silently when offline, no queue for later execution
- **Trigger**: User performs action while offline
- **User Impact**: Actions fail, user must retry when online, poor UX
- **Detectability**: Medium - user sees error or no feedback
- **Severity**: P1
- **Exact Location**: All write operations (no offline queue implementation)
- **Root Cause**: No offline queue, no service worker, no background sync
- **Current Behavior**: Actions fail immediately when offline
- **Expected Behavior**: Queue actions, execute when online

#### F-014: UI State Lost on Refresh
- **Description**: Filter state, form inputs, scroll position lost on refresh
- **Trigger**: User refreshes page or app reopens after crash
- **User Impact**: User must reconfigure filters, retype form inputs, poor UX
- **Detectability**: High - user sees state reset
- **Severity**: P1
- **Exact Location**: All screen components (no state persistence)
- **Root Cause**: No state persistence in sessionStorage or URL params
- **Current Behavior**: All UI state lost on refresh
- **Expected Behavior**: Persist UI state in sessionStorage or URL params

#### F-015: Stale State on Return from Offline
- **Description**: Realtime subscriptions may miss updates during offline period
- **Trigger**: User goes offline, comes back online, subscriptions may have missed updates
- **User Impact**: User sees outdated data, must manually refresh
- **Detectability**: Medium - user may notice stale data
- **Severity**: P1
- **Exact Location**: `src/hooks/useTasks.ts:124-142`, `src/hooks/useMatches.ts:62-79` (realtime subscriptions)
- **Root Cause**: No state refresh on app focus, no catch-up mechanism
- **Current Behavior**: Realtime subscriptions may miss updates during offline
- **Expected Behavior**: Refresh state on app focus, implement catch-up mechanism

#### F-016: Realtime Subscription Race Conditions
- **Description**: fetchTasks() called on every change, can cause duplicate fetches
- **Trigger**: Multiple realtime events fire rapidly
- **User Impact**: Unnecessary API calls, potential race conditions, poor performance
- **Detectability**: Low - visible in network tab, may cause performance issues
- **Severity**: P1
- **Exact Location**: `src/hooks/useTasks.ts:128-137` (realtime subscription callback)
- **Root Cause**: No debouncing, no request deduplication
- **Current Behavior**: Each change triggers full fetch
- **Expected Behavior**: Debounce callbacks, deduplicate requests

#### F-017: No Optimistic Locking
- **Description**: No version check before updates, last write wins, concurrent updates may overwrite each other
- **Trigger**: Two users update same resource simultaneously
- **User Impact**: One user's changes lost, no conflict detection
- **Detectability**: Medium - user may notice changes reverted
- **Severity**: P1
- **Exact Location**: All update operations (updateMatchStatus, updateProfile, cancelTask)
- **Root Cause**: No version field, no optimistic locking
- **Current Behavior**: Last write wins, no conflict detection
- **Expected Behavior**: Check version before update, detect conflicts, show conflict resolution UI

#### F-018: No State Machine Validation
- **Description**: Can update to any status, no validation for valid state transitions
- **Trigger**: User updates match/task status to invalid state
- **User Impact**: Invalid state transitions possible (e.g., "completed" → "pending")
- **Detectability**: Medium - visible in database, may cause UI issues
- **Severity**: P1
- **Exact Location**: `src/hooks/useMatches.ts:81-92` (updateMatchStatus), `src/hooks/useTasks.ts:211-225` (cancelTask)
- **Root Cause**: No state machine validation, no transition rules
- **Current Behavior**: Can update to any status
- **Expected Behavior**: Validate state transitions, reject invalid transitions

#### F-019: Incomplete Profile Access
- **Description**: Users with incomplete profiles can access app, causing inconsistent UX
- **Trigger**: User completes partial onboarding, accesses app
- **User Impact**: Confusing UX, missing features may not work
- **Detectability**: High - user sees alerts but can still use app
- **Severity**: P1
- **Exact Location**: `src/pages/Index.tsx:30-41` (appState logic)
- **Root Cause**: Only checks for phone, allows access with other missing fields
- **Current Behavior**: Users with incomplete profiles can access app
- **Expected Behavior**: Require complete profile or show clear onboarding flow

#### F-020: AI Fallback Not Explicit Enough
- **Description**: If AI fails, fallback used but user may not realize AI failed
- **Trigger**: AI timeout, error, or rate limit
- **User Impact**: User may post poorly structured task without realizing AI failed
- **Detectability**: Medium - user may notice poor structure
- **Severity**: P1
- **Exact Location**: `src/screens/PostScreen.tsx:124-140` (AI error handling)
- **Root Cause**: Error message shown but fallback not clearly indicated
- **Current Behavior**: Error toast shown, fallback used, but user may not understand
- **Expected Behavior**: Show clear message that AI failed and fallback is being used

#### F-021: No Explicit Timeout for AI Calls
- **Description**: No explicit timeout set for AI calls, may hang indefinitely
- **Trigger**: AI service slow or unresponsive
- **User Impact**: User waits indefinitely, poor UX
- **Detectability**: High - user sees loading state for long time
- **Severity**: P1
- **Exact Location**: `supabase/functions/rewrite-need/index.ts:294-310` (AI call)
- **Root Cause**: No explicit timeout, relies on default
- **Current Behavior**: May hang indefinitely
- **Expected Behavior**: Set explicit timeout (e.g., 30 seconds)

#### F-022: Logs May Contain PII
- **Description**: Logs may contain user descriptions with PII
- **Trigger**: User posts task with PII, logs are written
- **User Impact**: PII in logs, potential privacy violation
- **Detectability**: Low - visible in logs only
- **Severity**: P1
- **Exact Location**: `supabase/functions/rewrite-need/index.ts:287-292` (logging)
- **Root Cause**: Logs user descriptions without sanitization
- **Current Behavior**: PII may be logged
- **Expected Behavior**: Sanitize logs, remove PII before logging

#### F-023: No Per-User Rate Limiting for AI
- **Description**: User can spam AI requests, no rate limiting
- **Trigger**: User submits multiple task enhancement requests rapidly
- **User Impact**: Abuse possible, costs may increase
- **Detectability**: Low - visible in logs only
- **Severity**: P1
- **Exact Location**: None (no rate limiting implementation)
- **Root Cause**: No per-user rate limiting
- **Current Behavior**: User can spam requests
- **Expected Behavior**: Implement per-user rate limiting (e.g., 10 requests per minute)

#### F-024: Multiple Subscriptions in Duplicate Tabs
- **Description**: Each tab creates new realtime subscriptions, no coordination
- **Trigger**: User opens app in multiple tabs
- **User Impact**: Wastes resources, no tab coordination
- **Detectability**: Low - visible in network tab only
- **Severity**: P1
- **Exact Location**: All realtime subscriptions (useTasks, useMatches, useMessages)
- **Root Cause**: No BroadcastChannel API, no tab coordination
- **Current Behavior**: Each tab has separate subscriptions
- **Expected Behavior**: Use BroadcastChannel API for tab coordination

### P2 - Medium Severity Failures (Missing Features)

#### F-025: No Deep Links
- **Description**: Cannot share links to specific tasks or profiles
- **Trigger**: User wants to share task or profile
- **User Impact**: Cannot share specific content, poor UX
- **Detectability**: High - user cannot share links
- **Severity**: P2
- **Exact Location**: None (no deep link implementation)
- **Root Cause**: No deep link routes
- **Current Behavior**: Cannot share links
- **Expected Behavior**: Implement deep links (e.g., `/app/task/:taskId`)

#### F-026: No Task Expiration
- **Description**: Old tasks never expire or auto-cancel
- **Trigger**: Task created but never completed, remains in feed
- **User Impact**: Feed may show very old tasks, poor UX
- **Detectability**: Medium - user may see old tasks
- **Severity**: P2
- **Exact Location**: None (no expiration logic)
- **Root Cause**: No expiration mechanism
- **Current Behavior**: Tasks never expire
- **Expected Behavior**: Auto-expire tasks after 7 days, or allow manual expiration

#### F-027: No Crash Recovery UI
- **Description**: No UI to indicate app crashed and recovered
- **Trigger**: App crashes and reopens
- **User Impact**: User doesn't know app crashed, may lose work
- **Detectability**: Low - user may not notice
- **Severity**: P2
- **Exact Location**: None (no crash recovery UI)
- **Root Cause**: No crash detection or recovery UI
- **Current Behavior**: App reopens silently
- **Expected Behavior**: Show crash recovery UI, restore state if possible

## Summary

- **P0 (Critical)**: 8 failures
- **P1 (High)**: 16 failures
- **P2 (Medium)**: 3 failures
- **Total**: 27 failures

## Next Steps

See `AUDIT_FIX_PRIORITIZATION.md` for prioritized fix recommendations.

