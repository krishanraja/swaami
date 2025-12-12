# Swaami Data Audit

## Audit Date: December 2025

## Executive Summary

This audit maps all data flows, identifies gaps, and recommends improvements for data integrity and AI utilization.

## Current Data Architecture

### Tables Inventory

| Table | Purpose | RLS | Audit Status |
|-------|---------|-----|--------------|
| `profiles` | User profiles | ✅ | ✅ Complete |
| `tasks` | Posted needs | ✅ | ✅ Complete |
| `matches` | Task-helper connections | ✅ | ✅ Complete |
| `messages` | Chat messages | ✅ | ✅ Complete |
| `neighbourhoods` | Location data | ✅ | ✅ Complete |
| `user_verifications` | Trust verification records | ✅ | ✅ Complete |
| `user_photos` | Profile photos | ✅ | ✅ Complete |
| `social_connections` | OAuth connections | ✅ | ✅ Complete |
| `endorsements` | Peer endorsements | ✅ | ✅ Complete |

### Edge Functions Inventory

| Function | Purpose | Auth | Logging |
|----------|---------|------|---------|
| `rewrite-need` | AI task enhancement | No | ✅ 10/10 |
| `send-phone-otp` | Phone verification | No | ✅ 10/10 |
| `manage-endorsement` | Trust endorsements | Yes | ✅ 10/10 |

## Data Flow Audit

### ✅ Correctly Implemented

1. **Profile anchoring**: All user data correctly references `user_id`
2. **Verification tracking**: Each verification type stored with metadata
3. **Task ownership**: Clear `owner_id` and `helper_id` references
4. **Message threading**: Messages linked to matches
5. **Content safety**: Pre-AI filtering on task posts

### ⚠️ Gaps Identified

#### Gap 1: No Events Table
**Issue**: Raw user interactions not persisted beyond immediate use.
**Impact**: Cannot analyze user behavior patterns or provide historical context to AI.
**Recommendation**: Add `events` table for interaction logging.

#### Gap 2: No Insights/Scores Table
**Issue**: AI-generated insights not stored persistently.
**Impact**: Each AI call starts fresh without profile context.
**Recommendation**: Add `insights` table for dimension scores.

#### Gap 3: Limited AI Context
**Issue**: AI calls don't read user history before generating.
**Impact**: Generic outputs not personalized to user patterns.
**Recommendation**: Implement "read before think" pattern.

#### Gap 4: Session Tracking
**Issue**: No session_id tracked across user journey.
**Impact**: Cannot correlate actions within a visit.
**Recommendation**: Generate session ID on app load, include in logs.

## Logging Audit

### Edge Function Logging (Target: 10/10)

| Function | Request ID | Auth Log | Business Logic | AI Calls | DB Ops | Response | Timing | Score |
|----------|------------|----------|----------------|----------|--------|----------|--------|-------|
| `rewrite-need` | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | ✅ | 10/10 |
| `send-phone-otp` | ✅ | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | 10/10 |
| `manage-endorsement` | ✅ | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | 10/10 |

### Client-Side Logging

| Area | Logger Used | Session Tracked | User Actions | API Calls | Errors | Score |
|------|-------------|-----------------|--------------|-----------|--------|-------|
| App | ✅ logger.ts | ✅ | ✅ | ✅ | ✅ | 10/10 |

## AI Usage Audit

### Current State

| Aspect | Status | Notes |
|--------|--------|-------|
| Pre-call safety check | ✅ | BLOCKED_PATTERNS filter active |
| Structured output schema | ✅ | JSON schema enforced |
| Error handling (429/402) | ✅ | Graceful messages returned |
| Fallback on failure | ✅ | Basic formatting fallback |
| Request ID tracking | ✅ | UUID per request |
| Latency logging | ✅ | Start/end timestamps |
| Quality guardrails in prompt | ✅ | Added to system prompt |
| Profile context reading | ❌ | Not implemented (future) |
| Historical insights | ❌ | No insights table (future) |

### AI Quality Guardrails Checklist

- [x] Grounded: Outputs tied to input data
- [x] Actionable: Clear next steps
- [x] Specific: References exact input details
- [x] Safe: Safety notes for in-person tasks
- [x] Concise: Respects character limits
- [ ] Contextual: Uses profile history (future)
- [ ] Surprising: Identifies tensions/insights (future)

## Security Audit

### Data Access Control

| Data Type | RLS Active | Policy Verified |
|-----------|------------|-----------------|
| Profiles (own) | ✅ | ✅ SELECT/UPDATE own only |
| Profiles (public fields) | ✅ | ✅ Limited SELECT for matches |
| Tasks | ✅ | ✅ Owner full access, others SELECT |
| Messages | ✅ | ✅ Participants only |
| Verifications | ✅ | ✅ Own records only |
| Endorsements | ✅ | ✅ Endorser/endorsed access |

### Secret Management

| Secret | Location | Logged | Secure |
|--------|----------|--------|--------|
| LOVABLE_API_KEY | Supabase | Never | ✅ |
| TWILIO_ACCOUNT_SID | Supabase | Presence only | ✅ |
| TWILIO_AUTH_TOKEN | Supabase | Never | ✅ |
| TWILIO_PHONE_NUMBER | Supabase | Masked (first 4) | ✅ |

## Recommendations Summary

### High Priority
1. ✅ Implement 10/10 logging in all edge functions - **DONE**
2. ✅ Add AI quality guardrails to prompts - **DONE**
3. ✅ Complete project documentation - **DONE**

### Medium Priority (Future Phases)
4. Add `events` table for interaction logging
5. Add `insights` table for AI-generated scores
6. Implement session tracking across user journey
7. Add profile context to AI calls

### Low Priority (Optimization)
8. Add caching for repeated AI calls
9. Implement soft deletes for audit trail
10. Add analytics aggregation jobs

## Compliance Notes

- No GDPR-specific requirements implemented yet
- No data retention policies enforced
- No right-to-deletion workflow
- Recommend adding before public launch
