# Swaami Branding Guidelines

## Brand Identity

**Swaami** = "Neighbor" in Hindi, representing the core value of community and mutual support.

## Mission Statement

Empower urban neighborhoods to help each other with quick, safe micro-tasks (under 45 minutes).

## Brand Values

1. **Trust First** - Three-tier verification ensures safety
2. **Hyperlocal** - Everything within walking distance (800m default)
3. **Quick Wins** - Tasks capped at 45 minutes
4. **Real Neighbors** - Verified profiles, no anonymous interactions

## Visual Identity

### Logo
- **Icon**: `src/assets/swaami-icon.png` (used in app headers)
- **Wordmark**: `public/images/swaami-wordmark.png` (used with icon on landing page and in emails)
- **Public URL**: `https://www.swaami.ai/images/swaami-wordmark.png` (for email templates)
- Landing page displays icon + wordmark side by side
- All other screens use icon only
- Always display at minimum 32px height

### Color Palette
- **Primary Yellow**: HSL(48, 85%, 75%) / #F5D76E - Warm, community-focused yellow
- **Deep Yellow**: HSL(48, 90%, 50%) / #E6C84A - Deeper yellow for buttons and accents
- **Highlight Yellow**: HSL(48, 85%, 85%) / #FDF6B6 - Light yellow for highlights
- **Accent**: HSL(54, 80%, 55%) / #D4A574 - Warm accent color
- **Success Green**: HSL(145, 43%, 59%) / #4ADE80 - Trust indicators, verified states
- **Pending Amber**: HSL(45, 100%, 50%) / #FBBF24 - Pending verification states
- **Secondary**: HSL(0, 0%, 91%) / #E8E8E8 - Muted earth tones
- See `src/index.css` for full token definitions

### Typography
- **Display**: Inter (bold weights for headers)
- **Body**: Inter (regular/medium for readability)
- **Monospace**: For verification codes only

## Tone of Voice

### Do
- Friendly, warm, neighborhood-feeling
- Direct and helpful
- Inclusive language ("neighbor", "community")
- Safety-conscious without being alarmist

### Don't
- Corporate jargon
- Overly casual (no slang)
- Presumptuous about user capabilities
- Condescending about help-seeking

## Logo Usage Rules

1. **Clear space**: Minimum 16px padding around logo
2. **Backgrounds**: Works on light backgrounds only (dark mode: use inverted variant)
3. **Minimum size**: 32px height, 120px width
4. **Don't**: Stretch, rotate, add effects, or change colors

## Brand Applications

### App Interface
- Bottom navigation with contextual icons
- Card-based need display
- Trust tier badges (0/1/2) with clear visual hierarchy

### Communications
- Email: Warm greeting, clear action, safety reminder
- Notifications: Brief, actionable, never spammy

## Trust Tier Visual System

| Tier | Badge | Meaning |
|------|-------|---------|
| 0 | Gray outline | New user, email verified only |
| 1 | Bronze fill | Phone + social verified |
| 2 | Gold fill | Full verification + endorsement |
