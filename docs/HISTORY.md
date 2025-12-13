# Changelog

All notable changes to Swaami.

## [0.2.0] - 2024-12-13

### Added
- `useNetworkStatus` hook for offline detection
- `OfflineBanner` component for network status feedback
- ARIA labels and roles for accessibility compliance
- Content safety check before AI processing in PostScreen
- Message sanitization in ChatScreen
- Enhanced ErrorBoundary with dev info and "Go Home" option
- Safe localStorage access wrapper in AccessibilityContext

### Changed
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
- Lovable Cloud (Supabase) integration

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
- `rewrite-need`: AI task enhancement using Lovable AI Gateway

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
