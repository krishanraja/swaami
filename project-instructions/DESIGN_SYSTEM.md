# Swaami Design System

**Last Updated**: January 27, 2025

## Brand Identity

Swaami is a warm, approachable neighbourhood help network. The design emphasizes:
- **Trust**: Soft colors, rounded corners, clear information
- **Simplicity**: Minimal UI, focused interactions
- **Community**: Warm yellow primary, friendly green accents

## Color Palette

### Light Mode
| Token | HSL | Hex Equivalent | Usage |
|-------|-----|----------------|-------|
| `--background` | 0 0% 100% | #FFFFFF | Page background |
| `--foreground` | 0 0% 7% | #121212 | Primary text |
| `--primary` | 48 85% 75% | #F5D76E | Swaami Yellow - CTAs, highlights |
| `--primary-foreground` | 0 0% 7% | #121212 | Text on primary |
| `--secondary` | 0 0% 91% | #E8E8E8 | Secondary surfaces |
| `--muted` | 0 0% 96% | #F5F5F5 | Muted backgrounds |
| `--muted-foreground` | 0 0% 45% | #737373 | Secondary text |
| `--accent` | 54 80% 55% | #D4A574 | Deep warm yellow accent |
| `--accent-foreground` | 0 0% 7% | #121212 | Text on accent |
| `--destructive` | 0 84% 60% | #EF4444 | Error, urgent |
| `--destructive-foreground` | 0 0% 100% | #FFFFFF | Text on destructive |
| `--border` | 0 0% 91% | #E8E8E8 | Borders, dividers |
| `--swaami-yellow` | 48 85% 70% | #F0D05A | Custom Swaami yellow |
| `--swaami-yellow-deep` | 48 90% 50% | #E6C84A | Deeper yellow variant |
| `--swaami-yellow-highlight` | 48 85% 85% | #FDF6B6 | Light yellow highlight |
| `--status-success` | 145 43% 59% | #4ADE80 | Success states (green) |
| `--status-pending` | 45 100% 50% | #FBBF24 | Pending states (amber) |
| `--status-active` | 200 80% 50% | #3B82F6 | Active states (blue) |

### Dark Mode
| Token | HSL | Usage |
|-------|-----|-------|
| `--background` | 0 0% 7% | Dark page background |
| `--foreground` | 0 0% 98% | Light text |
| `--primary` | 54 91% 85% | Lighter yellow for dark mode |
| `--primary-foreground` | 0 0% 7% | Dark text on primary |
| `--secondary` | 0 0% 15% | Dark secondary surfaces |
| `--muted` | 0 0% 15% | Dark muted backgrounds |
| `--muted-foreground` | 0 0% 65% | Muted text in dark mode |
| `--accent` | 54 80% 55% | Same accent color |
| `--destructive` | 0 62% 30% | Darker red for dark mode |
| `--border` | 0 0% 20% | Dark borders |

## Typography

- **Font Family**: 
  - **Display**: DM Sans (system fallback: sans-serif) - Used for headings
  - **Body**: Inter (system fallback: sans-serif) - Used for body text
- **Weights**: 400 (regular), 500 (medium), 600 (semibold)

### Scale
| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Meta info, timestamps |
| `text-sm` | 14px | Body text, descriptions |
| `text-base` | 16px | Primary content |
| `text-lg` | 18px | Card titles |
| `text-xl` | 20px | Section headers |
| `text-2xl` | 24px | Page titles |
| `text-4xl` | 36px | Hero numbers |

## Spacing

Using Tailwind's default scale:
- `gap-2` (8px) - Inline elements
- `gap-3` (12px) - List items
- `gap-4` (16px) - Section padding
- `gap-6` (24px) - Major sections
- `gap-8` (32px) - Page sections

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | 1rem (16px) | Default radius |
| `rounded-xl` | 12px | Cards, buttons |
| `rounded-2xl` | 16px | Large cards |
| `rounded-full` | 50% | Avatars, chips |

## Components

### Buttons
```jsx
// Primary action
<Button variant="swaami">Help</Button>

// Secondary action  
<Button variant="swaami-outline">Edit</Button>

// Sizes: sm, default, lg, xl
```

### Cards
```jsx
<div className="bg-card border border-border rounded-xl p-4">
  {/* Content */}
</div>
```

### Input Fields
```jsx
<Input className="h-12" placeholder="..." />
<Textarea className="min-h-[140px] resize-none" />
```

## Animations

### Keyframes
| Name | Description |
|------|-------------|
| `fade-in` | Fade + slide up 8px |
| `slide-up` | Fade + slide up 20px |
| `pulse-soft` | Gentle opacity pulse |

### Animation Classes
```css
.animate-fade-in { animation: fade-in 0.4s ease-out; }
.animate-slide-up { animation: slide-up 0.5s ease-out; }
.animate-pulse-soft { animation: pulse-soft 2s infinite; }
```

### Stagger Pattern
```jsx
<div className="stagger-children">
  {items.map(item => <Card key={item.id} />)}
</div>
```

## Icons

Using Lucide React icons. Common icons:
- `Clock` - Time estimates
- `MapPin` - Location/radius
- `Star` - Ratings, credits
- `Flame` - Urgent tasks
- `Sparkles` - AI features
- `Send` - Messages
- `Check` - Confirmation
- `ChevronRight` - Navigation

## Responsive Design

- Mobile-first approach
- Max content width: `max-w-lg` (32rem / 512px)
- Bottom navigation fixed for mobile
- Header sticky with backdrop blur

## Accessibility

- Semantic HTML elements
- Proper heading hierarchy
- Focus visible states
- Sufficient color contrast
- Touch targets minimum 44x44px
