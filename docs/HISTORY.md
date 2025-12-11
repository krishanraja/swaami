# Changelog

All notable changes to Swaami.

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
