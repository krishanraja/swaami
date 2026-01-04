# Project Notes

Running notes, TODOs, and observations during development.

**Last Updated**: January 3, 2025

---

## Current Status

### ✅ Production Ready
- All ESLint errors resolved
- TypeScript compilation passes
- Security audit complete
- Accessibility audit complete
- P0 critical fixes implemented
- Documentation fully up to date

### Deployment Status
- **Frontend**: Vercel (with SPA routing)
- **Backend**: Supabase
- **Edge Functions**: Deployed via Supabase CLI

---

## 2025-01-27

### Fixed
- [x] Neighbourhood dropdown stuck in loading state
  - Root cause: Query timeout + React Query retry logic
  - Fix: Smart retry that doesn't retry on timeout errors
- [x] Authentication error messages showing "[object Object]"
  - Root cause: Supabase PostgrestError not properly extracted
  - Fix: Proper error extraction with diagnostic logging
- [x] Supabase key configuration issue
  - Root cause: Wrong anon key in environment
  - Fix: Documented correct keys, updated `.env.example`

### Documentation
- [x] Full documentation audit and update
- [x] All docs updated to January 2025 dates
- [x] Agent session history added to HISTORY.md

---

## 2024-12-14

### Implemented
- [x] Person Details Drawer for trust building
- [x] Adversarial audit (27 failures identified)
- [x] P0 critical fixes (5/5 complete)
- [x] P1 high priority fixes (4/10 complete)
- [x] State machine validation library
- [x] Double-submission protection

### Audit Documentation
- [x] AUDIT_SUMMARY.md - Executive summary
- [x] AUDIT_SYSTEM_STATE_MAP.md - System mapping
- [x] AUDIT_UI_UX.md - UX audit
- [x] AUDIT_DATA_PIPELINE.md - Data audit
- [x] AUDIT_AI_SYSTEMS.md - AI audit
- [x] AUDIT_FAILURE_REGISTER.md - 27 failures
- [x] AUDIT_FIX_PRIORITIZATION.md - Fix planning
- [x] AUDIT_FIXES_IMPLEMENTED.md - Implementation status

---

## 2024-12-13

### Implemented
- [x] Production readiness audit
- [x] Security audit complete
- [x] Accessibility audit complete
- [x] All ESLint errors resolved (30 → 0)
- [x] SEO infrastructure (FAQ, Blog, sitemap, robots.txt)
- [x] Offline handling with OfflineBanner
- [x] Premium SplashScreen

---

## 2024-12-11

### Implemented
- [x] Database schema with profiles, tasks, matches, messages
- [x] RLS policies for all tables
- [x] Auth with email/password
- [x] Onboarding flow
- [x] Feed screen with category filtering
- [x] AI-enhanced post creation
- [x] Real-time chat
- [x] Profile management
- [x] Logging utility
- [x] Input validation with Zod
- [x] Content safety checks
- [x] Full documentation

---

## Known Issues (Remaining)

### High Priority
- [ ] Report/block functionality not implemented
- [ ] Safety concern button in chat not implemented
- [ ] App-level rate limiting not implemented

### Medium Priority
- [ ] Code splitting for bundle size (806kb)
- [ ] Image lazy loading
- [ ] Full retry mechanism integration
- [ ] Optimistic locking with version columns

### Low Priority
- [ ] Offline queue for actions
- [ ] Per-user AI rate limiting
- [ ] Dark mode toggle in settings
- [ ] Notification preferences
- [ ] Language selection

### Technical Debt
- [ ] Phone verification is simulated, not real SMS (use Twilio for real)
- [ ] Location is not actually captured (using placeholder)
- [ ] No push notifications yet
- [ ] Task distance is placeholder data

---

## Development Guidelines

### Before Committing
1. Run `npm run lint` - must have 0 errors
2. Run `npm run build` - must succeed
3. Update HISTORY.md for significant changes
4. Update FEATURES.md for new features

### Before Merging
- [ ] RLS policies cover all operations
- [ ] Inputs validated
- [ ] Content safety checked
- [ ] No secrets in client code
- [ ] No PII logged
- [ ] Error messages don't leak internals

---

## Quick Reference

### Supabase Project
- **Project ID**: `qivqdltstmlxbcaldjzs`
- **Region**: Auto-detected
- **Dashboard**: https://supabase.com/dashboard

### Key Files
- Entry: `src/main.tsx`
- Routes: `src/App.tsx`
- Auth hook: `src/hooks/useAuth.ts`
- Supabase client: `src/integrations/supabase/client.ts`
- State machine: `src/lib/stateMachine.ts`

### Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Deploy Edge Functions
```bash
# Login to Supabase
npx supabase login

# Link to project
npx supabase link --project-ref qivqdltstmlxbcaldjzs

# Deploy all functions
.\deploy-functions.ps1
```

---

## Observations

### User Experience
- Onboarding flow feels smooth
- AI enhancement adds trust to task quality
- Walk time display more useful than raw distance
- Person details drawer builds trust before action

### Technical
- Realtime subscriptions work well for chat
- RLS debugging can be tricky - use supabase logs
- Edge function cold starts noticeable (~1s)
- Smart retry logic essential for query timeouts

### Future Considerations
- May need to batch/paginate tasks at scale
- Consider WebSocket reconnection strategy
- Think about offline-first for poor connectivity
- Consider code splitting for bundle size

---

## Agent Session Log

### Session 2025-01-03
- Full documentation audit and update
- All docs brought to current state
- Agent history consolidated

### Session 2025-01-27
- Neighbourhood dropdown fix
- Auth error message fix
- Supabase key configuration fix

### Session 2024-12-14
- Adversarial audit complete
- P0 fixes implemented
- Person details drawer added

### Session 2024-12-13
- Production readiness achieved
- Security/accessibility audits
- SEO infrastructure

### Session 2024-12-11
- Initial project build
- Core functionality implemented
- Base documentation created
