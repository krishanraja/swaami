# Architecture Decision Records (ADR)

**Last Updated**: January 3, 2025

## ADR-001: Use Supabase for Backend
**Date**: 2024-12-11
**Status**: Accepted

### Context
Need a backend for authentication, database, and real-time features.

### Decision
Use Supabase for backend services.

### Consequences
- ✅ No separate backend setup required
- ✅ Built-in auth, database, realtime, edge functions
- ✅ Auto-generated TypeScript types
- ⚠️ Vendor lock-in to Supabase patterns

---

## ADR-002: Credit-Based System Instead of Payments
**Date**: 2024-12-11
**Status**: Accepted

### Context
Monetization approach for micro-help network.

### Decision
Use credits for reciprocity, no real money transactions.

### Consequences
- ✅ Avoids payment processing complexity
- ✅ Reduces legal/regulatory burden
- ✅ Encourages community participation
- ⚠️ No direct revenue model
- ⚠️ Need to prevent credit hoarding/gaming

---

## ADR-003: AI-Enhanced Task Posting
**Date**: 2024-12-11
**Status**: Accepted

### Context
Users write informal, unstructured requests that are hard to parse.

### Decision
Use AI service (Gemini 2.5 Flash) to enhance and structure task descriptions.

### Consequences
- ✅ Better task quality and discoverability
- ✅ Consistent format across all tasks
- ✅ No API key management for users
- ⚠️ Dependency on AI availability
- ⚠️ Need fallback for AI failures

---

## ADR-004: Radius-Based Task Discovery
**Date**: 2024-12-11
**Status**: Accepted

### Context
Need to limit task visibility to nearby users.

### Decision
Users set a help radius (100-2000m), only see tasks within that distance.

### Consequences
- ✅ Hyper-local community feel
- ✅ Practical for walking-distance tasks
- ⚠️ Requires location data
- ⚠️ Low-density areas may have empty feeds

---

## ADR-005: Simulated Phone Authentication
**Date**: 2024-12-11
**Status**: Temporary

### Context
Need phone-based identity for trust without complex SMS integration.

### Decision
Use simulated OTP flow in onboarding, actual auth via email/password.

### Consequences
- ✅ Familiar UX pattern
- ✅ Avoid SMS costs in MVP
- ⚠️ Phone not actually verified
- ⚠️ Need to implement real SMS later

---

## ADR-006: Row-Level Security for All Tables
**Date**: 2024-12-11
**Status**: Accepted

### Context
Need to secure user data in multi-tenant database.

### Decision
Enable RLS on all tables with appropriate policies.

### Consequences
- ✅ Data isolation guaranteed at DB level
- ✅ Can't accidentally expose data
- ⚠️ Complex policy debugging
- ⚠️ Must remember to add policies for new tables

---

## ADR-007: Real-Time Subscriptions for Chat
**Date**: 2024-12-11
**Status**: Accepted

### Context
Chat needs to feel instant.

### Decision
Use Supabase Realtime for messages table.

### Consequences
- ✅ Instant message delivery
- ✅ No polling required
- ⚠️ Connection management complexity
- ⚠️ Need to handle reconnection gracefully

---

## ADR-008: Content Moderation Before AI Processing
**Date**: 2024-12-11
**Status**: Accepted

### Context
Need to prevent misuse of the platform.

### Decision
Block known-bad patterns before sending to AI, flag suspicious content.

### Consequences
- ✅ Catches obvious bad content
- ✅ Reduces AI processing of harmful content
- ⚠️ False positives possible
- ⚠️ Sophisticated bad actors may bypass

---

## ADR-009: Person Details Drawer for Trust Building
**Date**: 2024-12-14
**Status**: Accepted

### Context
Users hesitate to help strangers without knowing more about them. Trust is the foundation of Swaami's value proposition, but the feed cards only showed limited person info. Users needed a way to "vet" the person before committing to help.

### Decision
Implement an expandable person details drawer that opens when tapping on the owner section of a task card. The drawer shows:
- Large profile photo with trust tier badge
- Detailed trust tier explanation with verification points
- Stats (tasks completed, reliability score)
- Skills and neighbourhood
- Contextual community message
- Direct "Help" CTA

### Consequences
- ✅ Builds trust through transparency before action
- ✅ Progressive disclosure keeps feed cards clean
- ✅ Mobile-first bottom drawer feels natural
- ✅ Reduces "leap of faith" anxiety
- ⚠️ Additional data fetching (skills, member_since) required
- ⚠️ Drawer animation adds slight interaction delay

---

## ADR-010: Atomic Database Operations for Task Matching
**Date**: 2024-12-14
**Status**: Accepted

### Context
Race condition identified where multiple users could help the same task simultaneously, causing data integrity issues.

### Decision
Created atomic `help_with_task()` database function that:
1. Creates match with status "pending"
2. Updates task status to "matched"
3. Returns match ID
All in a single transaction with database constraint preventing multiple active matches.

### Consequences
- ✅ Race condition eliminated
- ✅ Data integrity guaranteed at database level
- ✅ Single network round-trip
- ⚠️ Requires database migration
- ⚠️ Error handling must account for constraint violations

---

## ADR-011: State Machine Validation for Status Transitions
**Date**: 2024-12-14
**Status**: Accepted

### Context
Invalid state transitions were possible (e.g., going from "completed" back to "pending"), which could cause undefined behavior.

### Decision
Created centralized state machine validation library (`src/lib/stateMachine.ts`) that validates all status transitions for tasks and matches.

### Consequences
- ✅ Invalid transitions prevented
- ✅ Clear, documented state flows
- ✅ Easy to add new states
- ⚠️ Must update library when adding new states
- ⚠️ Client-side validation (database should also validate)

---

## ADR-012: Smart Retry Logic for Query Timeouts
**Date**: 2025-01-27
**Status**: Accepted

### Context
Neighbourhood dropdown was stuck in loading state for 30+ seconds. Root cause: React Query's automatic retry (retry: 1) combined with 15-second timeout meant users waited 30+ seconds before seeing an error.

### Decision
Implement smart retry logic that:
1. Doesn't retry on timeout errors (network issues won't resolve quickly)
2. Shows error state immediately after timeout
3. Allows manual retry via button
4. Uses `refetchOnMount: true` for automatic retry on navigation

### Consequences
- ✅ Faster failure (15s max instead of 30s)
- ✅ Immediate error visibility
- ✅ Better user experience
- ⚠️ Must apply pattern to other queries
- ⚠️ Need to distinguish timeout errors from other errors

---

## ADR-013: Proper Supabase Error Extraction
**Date**: 2025-01-27
**Status**: Accepted

### Context
Error messages were displaying as "[object Object]" instead of readable messages. Supabase PostgrestError objects weren't being properly converted to strings.

### Decision
Implement proper error extraction that:
1. Handles Supabase PostgrestError structure (code, message, details, hint)
2. Handles standard Error objects
3. Logs diagnostic information for troubleshooting
4. Returns readable error messages

### Consequences
- ✅ Readable error messages for users
- ✅ Diagnostic logging for developers
- ✅ Consistent error handling pattern
- ⚠️ Must apply pattern to all hooks
- ⚠️ Adds code complexity for error handling

---

## Template for New ADRs

```markdown
## ADR-XXX: [Title]
**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

### Context
[What is the issue we're facing?]

### Decision
[What have we decided to do?]

### Consequences
[What are the positive and negative outcomes?]
- ✅ Positive
- ⚠️ Consideration/Risk
```
