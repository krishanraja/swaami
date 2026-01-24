# Changelog

All notable changes to Swaami.

## [Unreleased] - 2025-01-03

### Added
- **Comprehensive Documentation Audit** - Full review and update of all project documentation
- **Agent History Integration** - Consolidated all changes from multiple development agents into unified documentation

---

## [0.3.2] - 2025-01-27

### Fixed
- **Neighbourhood dropdown stuck in loading state on timeout**
  - Root cause: Query timeout (15s) + React Query retry (1) caused 30+ second loading state with no error visibility
  - Fix: Smart retry logic that doesn't retry on timeout errors, allowing immediate error display
  - Fix: Allow retry on mount so navigating away/back retries automatically
  - Fix: Don't disable dropdown on error, allowing user to see error message and retry button
  - Impact: Timeout now fails immediately (15s) instead of retrying (30s+), error state visible immediately
  - Files: `src/hooks/useNeighbourhoods.ts`, `src/components/onboarding/NeighbourhoodSelector.tsx`
  - Documentation: `docs/DIAGNOSIS_NEIGHBOURHOOD_DROPDOWN_STUCK.md`, `docs/ROOT_CAUSE_NEIGHBOURHOOD_DROPDOWN.md`

- **404 error on `/join` route**
  - Root cause: Missing Vercel SPA routing configuration
  - Fix: Added `vercel.json` with rewrites to serve `index.html` for all routes
  - Impact: `/join` route now loads correctly on direct access or refresh
  - Files: `vercel.json`

- **Unwanted tiny scrolling on location step**
  - Root cause: `overflow-y-auto` enabled unconditionally
  - Fix: Changed to `overflow-hidden` to prevent scrolling when content fits viewport
  - Impact: No unwanted scrolling when content fits screen
  - Files: `src/screens/JoinScreen.tsx`

- **Supabase key configuration issue**
  - Root cause: Using incorrect Supabase anon/public key in environment configuration
  - Fix: Updated environment variables with correct keys
  - Documentation: `docs/ROOT_CAUSE_FINAL.md`, `docs/ENV_SETUP.md`

- **Authentication error message display**
  - Root cause: Supabase PostgrestError objects were being converted to "[object Object]" strings
  - Fix: Added proper error extraction that preserves Supabase error structure
  - Files: `src/hooks/useProfile.ts`, `src/pages/Join.tsx`
  - Documentation: `docs/AUTH_FIX_SUMMARY.md`

---

## [0.3.1] - 2024-12-14

### Added
- **Adversarial Audit Complete** - Full-stack audit identifying 27 failures
  - System & State Mapping
  - UI & UX Audit
  - Data Pipeline Audit
  - AI Systems Audit
  - Documentation: `docs/AUDIT_SUMMARY.md`, `docs/AUDIT_*` files

### Fixed (P0 Critical)
- **Race condition in task matching** - Database constraint prevents multiple active matches per task
  - Files: `supabase/migrations/20241214120000_prevent_multiple_matches.sql`

- **Non-atomic task operations** - Created atomic `help_with_task` database function
  - Files: `supabase/migrations/20241214120001_help_with_task_function.sql`, `src/hooks/useTasks.ts`

- **Dead ends with infinite loaders** - Added error states and 10-second timeouts to all loaders
  - Files: `src/screens/FeedScreen.tsx`, `src/screens/ProfileScreen.tsx`, `src/hooks/useTasks.ts`

- **ChatScreen dead end** - Added timeout check (5 seconds) and match validation with redirect
  - Files: `src/screens/ChatScreen.tsx`

- **Auth redirect loop** - Check if already on /auth before redirecting
  - Files: `src/pages/Auth.tsx`

### Fixed (P1 High Priority)
- **Double-submission protection** - Added tracking Sets to prevent duplicate operations
  - Files: `src/hooks/useTasks.ts`, `src/screens/PostScreen.tsx`, `src/screens/FeedScreen.tsx`

- **State machine validation** - Created centralized state machine validation library
  - Files: `src/lib/stateMachine.ts`, `src/hooks/useMatches.ts`, `src/hooks/useTasks.ts`

- **AI error handling** - Added explicit 30-second timeout with better error messages
  - Files: `src/screens/PostScreen.tsx`

### Added
- **Person Details Drawer** - Tap on task card owner section to see detailed person profile
  - Mobile-first bottom drawer with smooth animation
  - Large profile photo with trust tier badge overlay
  - Trust tier explanation with verification points
  - Stats grid showing tasks completed and reliability score
  - Skills display with category highlighting
  - Neighbourhood and member tenure display
  - Direct "Help" CTA from drawer
  - Files: `src/components/PersonDetailsDrawer.tsx`, `src/components/NeedCard.tsx`
  - Architecture Decision: `docs/DECISIONS_LOG.md#ADR-009`

- **Retry mechanisms hook** - Created useRetry hook with exponential backoff
  - Files: `src/hooks/useRetry.ts`

---

## [0.2.0] - 2024-12-13

### Added
- `useNetworkStatus` hook for offline detection
- `OfflineBanner` component for network status feedback
- ARIA labels and roles for accessibility compliance
- Content safety check before AI processing in PostScreen
- Message sanitization in ChatScreen
- Enhanced ErrorBoundary with dev info and "Go Home" option
- Safe localStorage access wrapper in AccessibilityContext
- HTML-level instant splash placeholder (no JS required)
- Image preload detection in SplashScreen for guaranteed stable loading

### Changed
- **SplashScreen rewritten for Google-app-level stability**:
  - Two-phase loading: CSS-only preload state → full splash once icon loads
  - Proper image preloading with onLoad/onError handling
  - Coordinated timing with data fetching
  - Fallback if image fails to load

### SEO & Content Marketing
- **FAQ page** (`/faq`) with 20+ questions optimized for search
- **Blog** (`/blog`) with 5 initial articles targeting high-traffic keywords
- **SEO utility** (`src/lib/seo.ts`) for dynamic meta tags and structured data
- **JSON-LD schemas**: FAQ, Article, Breadcrumb, LocalBusiness
- **sitemap.xml** with all public pages
- **robots.txt** optimized for search engines with sitemap reference
- **Help links** in Profile settings for non-intrusive access
- Improved NotFound page with better design and styling
- Enhanced BottomNav with proper accessibility attributes
- Better loading state indicator for chat message sending
- Updated AppHeader with semantic role="banner"
- Improved NeedCard expand/collapse with aria-expanded

### Fixed
- All ESLint errors resolved (30 → 0 errors)
- Switch case lexical declaration issues in FeedScreen
- Type safety issues with `any` types across codebase
- Empty interface issues in UI components
- require() usage replaced with ESM imports in tailwind.config
- Missing useEffect dependencies in multiple components
- localStorage access without try-catch in AccessibilityContext
- Incorrect metadata type casting in useTrustTier

### Security
- Pre-AI content safety validation in PostScreen
- Message content sanitization before sending
- Proper error messages that don't leak internals
- Safe localStorage access with fallback

---

## [0.1.0] - 2024-12-11

### Added
- Initial project setup with React + Vite + TypeScript
- Tailwind CSS and shadcn/ui component library
- Supabase integration

#### Database
- `profiles` table with user settings, skills, credits
- `tasks` table with AI-enhanced metadata
- `matches` table for helper-requester connections
- `messages` table for chat
- Row Level Security policies for all tables
- `handle_new_user` trigger for auto-profile creation
- `update_updated_at` trigger for timestamp management
- Realtime enabled for tasks, matches, messages

#### Authentication
- Email/password authentication
- Auto-confirm enabled
- Session persistence
- Protected routes

#### UI Screens
- JoinScreen: 5-step onboarding (phone, OTP, radius, skills, availability)
- FeedScreen: Task discovery with category filters
- PostScreen: AI-enhanced task creation
- ChatScreen: Real-time messaging with status updates
- ChatsListScreen: Active matches list
- ProfileScreen: User settings and stats

#### Components
- NeedCard: Task display with urgency, owner info
- BottomNav: Tab navigation
- SkillChip: Selectable skill badges
- RadiusSlider: Distance preference control
- AvailabilitySelector: Time preference picker

#### Edge Functions
- `rewrite-need`: AI task enhancement using AI Gateway

#### Utilities
- `logger.ts`: Centralized structured logging
- `validation.ts`: Zod schemas for input validation
- `safety.ts`: Content moderation patterns

#### Documentation
- README.md: Project overview
- ARCHITECTURE.md: System design and database schema
- DESIGN_SYSTEM.md: Colors, typography, components
- FEATURES.md: Feature list and status
- COMMON_ISSUES.md: Troubleshooting guide
- DECISIONS_LOG.md: Architecture decisions
- PROJECT_NOTES.md: Running development notes
- HISTORY.md: This changelog
- AUDIT_STATUS.md: Security and UX audit tracking
- PURPOSE.md: Mission and values
- MASTER_INSTRUCTIONS.md: Development guidelines

---

## Agent Session History

### Session 2025-01-27 (Neighbourhood Dropdown Fix)
- Diagnosed neighbourhood dropdown stuck in loading state
- Root cause: Query timeout + React Query retry logic
- Implemented smart retry that doesn't retry on timeout errors
- Added proper error visibility and recovery

### Session 2025-01-27 (Auth Error Fix)
- Fixed Supabase key configuration issue
- Fixed error message display (was showing "[object Object]")
- Improved error extraction for Supabase PostgrestError objects
- Added diagnostic logging for troubleshooting

### Session 2024-12-14 (Adversarial Audit)
- Completed full-stack adversarial audit
- Identified 27 failures across system
- Implemented P0 critical fixes (5/5 complete)
- Implemented P1 high priority fixes (4/10 complete)
- Created comprehensive audit documentation

### Session 2024-12-14 (Person Details Drawer)
- Added person details drawer for trust building
- Implemented progressive disclosure UX pattern
- Added trust tier explanation UI

### Session 2024-12-13 (Production Readiness)
- Completed security audit
- Completed accessibility audit
- Fixed all ESLint errors
- Added offline handling
- Added SEO infrastructure

### Session 2024-12-11 (Initial Build)
- Initial project setup
- Core database schema
- Authentication flow
- Basic UI screens
- AI task enhancement

---

## Version Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features

### Security
- Security-related changes
```
