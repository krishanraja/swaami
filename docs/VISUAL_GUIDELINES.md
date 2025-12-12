# Swaami Visual Guidelines

## Design Philosophy

**Warm, Trustworthy, Hyperlocal**

The visual design should feel like a friendly neighbor—approachable but reliable, modern but not cold.

## Design System

### Semantic Tokens

All colors defined in `src/index.css` using CSS custom properties. Never use raw color values in components.

```css
/* Core tokens */
--background: /* light background */
--foreground: /* text on background */
--primary: /* brand coral/terracotta */
--primary-foreground: /* text on primary */
--secondary: /* muted secondary */
--muted: /* subtle backgrounds */
--accent: /* highlight color */

/* Trust indicators */
--trust-tier-0: /* gray - unverified */
--trust-tier-1: /* bronze - verified */
--trust-tier-2: /* gold - fully verified */
```

### Typography Scale

```
Display: 2.5rem (40px) - Hero headlines
H1: 2rem (32px) - Page titles
H2: 1.5rem (24px) - Section headers
H3: 1.25rem (20px) - Card titles
Body: 1rem (16px) - Default text
Small: 0.875rem (14px) - Secondary text
XSmall: 0.75rem (12px) - Labels, badges
```

### Spacing Scale

```
4px  - Tight (icon-text gap)
8px  - Compact (inline elements)
12px - Default (form fields)
16px - Standard (card padding)
24px - Relaxed (section spacing)
32px - Generous (section breaks)
48px - Large (page margins)
```

## Component Patterns

### Cards
- Rounded corners: `rounded-xl` (12px)
- Shadow: `shadow-sm` default, `shadow-md` on hover
- Padding: 16px standard, 24px for larger cards
- Border: Subtle `border` on light mode

### Buttons
- Primary: Solid primary color, white text
- Secondary: Outline with primary color
- Ghost: No background, subtle on hover
- Minimum touch target: 44x44px

### Badges
- Trust badges: Rounded full, small padding
- Category badges: Rounded with icon + text
- Status badges: Color-coded (green/amber/red)

### Forms
- Input height: 44px minimum
- Border radius: `rounded-lg`
- Focus: Ring with primary color
- Error: Red border, error text below

## Motion Design

### Principles
1. **Purposeful**: Animation serves function, not decoration
2. **Quick**: 150-300ms for most transitions
3. **Natural**: Ease-out for enters, ease-in for exits

### Standard Durations
```
Micro: 150ms - Button states, toggles
Fast: 200ms - Cards, modals appearing
Normal: 300ms - Page transitions
Slow: 500ms - Complex animations
```

### Common Animations
- **Fade in**: `animate-fade-in` (opacity 0→1)
- **Slide up**: `animate-slide-up` (translate + fade)
- **Scale**: `animate-scale` (pop-in effect)
- **Pulse**: For loading/attention states

## Responsive Design

### Breakpoints
```
Mobile: 0-639px (default)
Tablet: 640-1023px (sm:)
Desktop: 1024px+ (lg:)
```

### Mobile-First Rules
1. Design for mobile first, enhance for larger
2. Touch targets: 44px minimum
3. Thumb-friendly: Key actions at bottom
4. No horizontal scroll

### Layout Patterns
- **Mobile**: Single column, stacked cards
- **Tablet**: Two columns for lists
- **Desktop**: Three columns, sidebar optional

## Accessibility

### Color Contrast
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: Clear focus states

### Focus States
- Visible ring on all interactive elements
- Skip links for keyboard navigation
- Proper heading hierarchy

### Screen Readers
- Semantic HTML (button, not div)
- Alt text on images
- ARIA labels where needed
- Live regions for updates

## Trust Tier Visualization

### Tier 0 (Unverified)
- Badge: Gray outline, no fill
- Text: "New Neighbor"
- Visual: Subtle, doesn't attract attention

### Tier 1 (Verified)
- Badge: Bronze fill
- Text: "Verified Neighbor"
- Visual: Warm, trustworthy

### Tier 2 (Fully Verified)
- Badge: Gold fill with subtle glow
- Text: "Trusted Neighbor"
- Visual: Premium, high-trust indicator

## Icon System

Using Lucide React icons consistently:

| Concept | Icon |
|---------|------|
| Home/Feed | `Home` |
| Chat | `MessageSquare` |
| Profile | `User` |
| Post | `Plus` |
| Verify | `Shield` or `CheckCircle` |
| Location | `MapPin` |
| Time | `Clock` |
| Category | Context-specific |

## Dark Mode

Prepared but not primary focus. When implemented:
- Background: Deep gray, not pure black
- Primary: Slightly lighter for contrast
- Cards: Elevated with subtle border

## Common Pitfalls to Avoid

❌ Raw color values in components (use tokens)
❌ Inconsistent border radii
❌ Animations without purpose
❌ Touch targets under 44px
❌ Text contrast below 4.5:1
❌ Missing focus states
❌ Breaking responsive at breakpoints
