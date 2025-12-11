# Project Notes

Running notes, TODOs, and observations during development.

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

### Known Issues
- [ ] Phone verification is simulated, not real SMS
- [ ] Location is not actually captured (using placeholder)
- [ ] No push notifications yet
- [ ] Task distance is placeholder data

### TODOs - High Priority
- [ ] Add seed data for demo
- [ ] Implement actual location capture with browser geolocation
- [ ] Add "Safety concern" button in chat
- [ ] Add "Task exceeded scope" reporting

### TODOs - Medium Priority
- [ ] Credit transaction history
- [ ] Task history view in profile
- [ ] Image upload for tasks
- [ ] Search functionality

### TODOs - Low Priority
- [ ] Dark mode toggle in settings
- [ ] Notification preferences
- [ ] Language selection
- [ ] Export user data feature

---

## Observations

### User Experience
- Onboarding flow feels smooth, 5 steps might be too many
- AI enhancement adds trust to task quality
- Walk time display more useful than raw distance

### Technical
- Realtime subscriptions work well for chat
- RLS debugging can be tricky - use supabase logs
- Edge function cold starts noticeable (~1s)

### Future Considerations
- May need to batch/paginate tasks at scale
- Consider WebSocket reconnection strategy
- Think about offline-first for poor connectivity

---

## Quick Reference

### Supabase Project
- Project ID: `ijrshqazmfrupuejmlke`
- Region: Auto-detected

### Key Files
- Entry: `src/main.tsx`
- Routes: `src/App.tsx`
- Auth hook: `src/hooks/useAuth.ts`
- Supabase client: `src/integrations/supabase/client.ts`

### Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```
