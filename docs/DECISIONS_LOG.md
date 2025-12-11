# Architecture Decision Records (ADR)

## ADR-001: Use Lovable Cloud (Supabase) for Backend
**Date**: 2024-12-11
**Status**: Accepted

### Context
Need a backend for authentication, database, and real-time features.

### Decision
Use Lovable Cloud which provides Supabase integration out of the box.

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
Use Lovable AI Gateway (Gemini 2.5 Flash) to enhance and structure task descriptions.

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
