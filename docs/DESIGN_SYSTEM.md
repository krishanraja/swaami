# Swaami Design System

## Brand Identity

Swaami is a warm, approachable neighbourhood help network. The design emphasizes:
- **Trust**: Soft colors, rounded corners, clear information
- **Simplicity**: Minimal UI, focused interactions
- **Community**: Warm yellow primary, friendly green accents

## Color Palette

### Light Mode
| Token | HSL | Usage |
|-------|-----|-------|
| `--background` | 0 0% 100% | Page background |
| `--foreground` | 0 0% 7% | Primary text |
| `--primary` | 54 91% 85% | Swaami Yellow - CTAs, highlights |
| `--primary-foreground` | 0 0% 7% | Text on primary |
| `--secondary` | 0 0% 91% | Secondary surfaces |
| `--muted` | 0 0% 96% | Muted backgrounds |
| `--muted-foreground` | 0 0% 45% | Secondary text |
| `--accent` | 145 43% 59% | Swaami Green - success, confirmation |
| `--destructive` | 0 84% 60% | Error, urgent |
| `--border` | 0 0% 91% | Borders, dividers |

### Dark Mode
Same token names with adjusted values for dark theme.

## Typography

- **Font Family**: Inter (system fallback: sans-serif)
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
