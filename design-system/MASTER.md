# Aluminify Design System

**Version:** 2.0
**Last Updated:** 2026-01-25
**Scope:** Global Source of Truth for all UI components

---

## 1. Brand Identity

### Brand Values
- **Professional** - Enterprise-grade EdTech platform
- **Minimal** - Clean, distraction-free interfaces
- **Accessible** - WCAG AA compliant
- **Modern** - AI-native interactions

### Logo & Iconography
- Primary Icon: 32x32px, `rounded-lg`, `bg-primary`
- Icon Library: **Material Icons Outlined** (primary), **Lucide** (secondary)
- Never use emojis as functional icons

---

## 2. Typography

### Font Stack

| Token | Font Family | Usage |
|-------|------------|-------|
| `font-display` | Plus Jakarta Sans | Headings, hero titles, brand elements |
| `font-sans` | Inter | Body text, UI elements, navigation |
| `font-mono` | System monospace | Code, prices, technical badges |

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
```

### Type Scale

| Level | Mobile | Desktop | Class | Usage |
|-------|--------|---------|-------|-------|
| Hero H1 | 3rem (48px) | 4.5rem (72px) | `text-5xl lg:text-7xl` | Main landing hero |
| Page H1 | 2.25rem (36px) | 3rem (48px) | `text-4xl lg:text-5xl` | Page titles |
| Section H2 | 1.875rem (30px) | 2.25rem (36px) | `text-3xl lg:text-4xl` | Section headings |
| Card H3 | 1.25rem (20px) | 1.5rem (24px) | `text-xl lg:text-2xl` | Card titles |
| Body Large | 1.125rem (18px) | 1.25rem (20px) | `text-lg lg:text-xl` | Featured text |
| Body | 1rem (16px) | 1rem (16px) | `text-base` | Default body |
| Small | 0.875rem (14px) | 0.875rem (14px) | `text-sm` | Labels, nav links |
| XSmall | 0.75rem (12px) | 0.75rem (12px) | `text-xs` | Badges, captions |

### Font Weights

| Weight | Value | Class | Usage |
|--------|-------|-------|-------|
| Regular | 400 | `font-normal` | Body text |
| Medium | 500 | `font-medium` | Links, nav items |
| Semibold | 600 | `font-semibold` | Subtitles, labels |
| Bold | 700 | `font-bold` | Headings, CTAs |

### Line Height & Tracking

| Property | Value | Class | Usage |
|----------|-------|-------|-------|
| Tight | 1.25 | `leading-tight` | Headings |
| Normal | 1.5 | `leading-normal` | UI text |
| Relaxed | 1.625 | `leading-relaxed` | Body paragraphs |
| Tracking Tight | -0.025em | `tracking-tight` | Display headings |

---

## 3. Color Palette

### Semantic Colors - Light Mode

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Primary | `#111827` | `gray-900` | Buttons, headings |
| Primary Hover | `#374151` | `gray-700` | Hover states |
| Background | `#F9FAFB` | `gray-50` | Page background |
| Surface | `#FFFFFF` | `white` | Cards, modals |
| Border | `#E5E7EB` | `gray-200` | Dividers, outlines |
| Text Main | `#111827` | `gray-900` | Primary text |
| Text Muted | `#6B7280` | `gray-500` | Secondary text |

### Semantic Colors - Dark Mode

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Primary | `#F8FAFC` | `slate-50` | Buttons, headings |
| Primary Hover | `#E2E8F0` | `slate-200` | Hover states |
| Background | `#0F172A` | `slate-900` | Page background |
| Surface | `#1E293B` | `slate-800` | Cards, modals |
| Border | `#334155` | `slate-700` | Dividers, outlines |
| Text Main | `#F8FAFC` | `slate-50` | Primary text |
| Text Muted | `#94A3B8` | `slate-400` | Secondary text |

### Status Colors

| Status | Hex | Tailwind | Usage |
|--------|-----|----------|-------|
| Success | `#22C55E` | `green-500` | Success states, online indicators |
| Info | `#3B82F6` | `blue-500` | Informational, links |
| Warning | `#FACC15` | `yellow-400` | Warnings, caution |
| Error | `#F87171` | `red-400` | Errors, destructive |
| Accent | `#A855F7` | `purple-500` | Special highlights |

### Tailwind Custom Classes (Unified Semantic Tokens)

```tsx
// Semantic tokens work automatically for light/dark mode
className="bg-background text-foreground"
className="bg-card border-border"
className="text-muted-foreground"

// Dark mode is handled automatically via CSS custom properties
// No need for dark: prefixes on semantic tokens!
```

### CSS Custom Properties (HSL Format)

All color tokens are defined as HSL values without the `hsl()` wrapper for shadcn/ui compatibility:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --muted-foreground: 240 3.8% 46.1%;
  /* etc */
}
```

---

## 4. Spacing System

### Base Unit: 4px (Tailwind default)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| space-1 | 4px | `1` | Minimal gaps |
| space-2 | 8px | `2` | Icon gaps, tight padding |
| space-3 | 12px | `3` | List gaps |
| space-4 | 16px | `4` | Standard padding |
| space-6 | 24px | `6` | Component gaps |
| space-8 | 32px | `8` | Card padding |
| space-12 | 48px | `12` | Section gaps |
| space-16 | 64px | `16` | Large section padding |
| space-20 | 80px | `20` | Section vertical |
| space-24 | 96px | `24` | Hero section |

### Container Widths

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Container XL | 1280px | `max-w-7xl` | Main container |
| Container LG | 1024px | `max-w-5xl` | Focused content |
| Container MD | 896px | `max-w-4xl` | Text-heavy pages |
| Container SM | 672px | `max-w-2xl` | Paragraphs |

### Responsive Container Padding

```tsx
className="px-4 sm:px-6 lg:px-8"
```

### Section Padding

| Section Type | Mobile | Desktop |
|--------------|--------|---------|
| Hero | `pt-24 pb-16` | `lg:pt-32 lg:pb-24` |
| Standard | `py-20` | `lg:py-24` |
| Compact | `py-16` | `lg:py-20` |

---

## 5. Border Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Small | 6px | `rounded-md` | Inputs, small buttons |
| Medium | 8px | `rounded-lg` | Buttons, nav items |
| Large | 12px | `rounded-xl` | Cards, containers |
| XL | 16px | `rounded-2xl` | Feature cards |
| Full | 9999px | `rounded-full` | Pills, avatars |

---

## 6. Shadows

| Level | Tailwind | Usage |
|-------|----------|-------|
| None | `shadow-none` | Flat elements |
| SM | `shadow-sm` | Subtle depth |
| Default | `shadow` | Cards, dropdowns |
| MD | `shadow-md` | Elevated cards |
| LG | `shadow-lg` | Modals, popovers |
| XL | `shadow-xl` | Floating elements |
| 2XL | `shadow-2xl` | Hero mockups |

### Button Shadow Pattern
```tsx
// Primary button
className="shadow-lg shadow-zinc-200 dark:shadow-none"

// Card
className="shadow-sm hover:shadow-md"
```

---

## 7. Z-Index Scale

| Level | Value | Usage |
|-------|-------|-------|
| Background | 0 | Base layer |
| Content | 10 | Standard content |
| Sticky | 40 | Sticky headers |
| Navigation | 50 | Fixed nav |
| Modal | 100 | Modals, dialogs |
| Tooltip | 110 | Tooltips, popovers |

---

## 8. Component Specifications

### Navigation (Nav)

```tsx
// Structure
height: 64px (h-16)
position: sticky top-0
z-index: 50
background: bg-white/80 dark:bg-surface-dark/80
backdrop: backdrop-blur-md
border-bottom: border-b border-border-light/80 dark:border-border-dark/80

// Classes
className="sticky top-0 z-50 h-16 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light/80 dark:border-border-dark/80"
```

### Buttons

#### Primary Button
```tsx
className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-zinc-200 dark:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

#### Secondary Button
```tsx
className="bg-card border border-border text-foreground px-8 py-3.5 rounded-lg font-medium hover:bg-accent transition-all"
```

#### Small Button (Nav CTA)
```tsx
className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
```

### Cards

```tsx
className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-muted-foreground/20 transition-colors"
```

### Badges/Pills

```tsx
// Status badge
className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium"

// Indicator dot
className="h-2 w-2 rounded-full bg-green-500"
```

### Tables

```tsx
// Container
className="rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm"

// Header
className="bg-zinc-50 dark:bg-zinc-900/50 text-sm font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark"

// Row hover
className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
```

---

## 9. Effects & Animations

### Transitions

| Type | Duration | Easing | Class |
|------|----------|--------|-------|
| Colors | 200ms | ease-out | `transition-colors duration-200` |
| All | 200ms | ease-out | `transition-all` |
| Transform | 300ms | ease-out | `transition-transform duration-300` |

### Hover Effects

```tsx
// Scale (icons)
className="group-hover:scale-110 transition-transform"

// Translate (arrows)
className="group-hover:translate-x-1 transition-transform"

// Opacity (links)
className="hover:opacity-70 transition-opacity"
```

### Background Patterns

```tsx
// Grid pattern (decorative)
className="bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#334155_1px,transparent_1px)] bg-[size:40px_40px] opacity-50"
```

### Backdrop Blur

```tsx
className="backdrop-blur-md" // Navigation
className="backdrop-blur-sm" // Modal overlays
```

---

## 10. Responsive Breakpoints

| Name | Value | Usage |
|------|-------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |
| 2xl | 1536px | Extra large |

### Grid Patterns

```tsx
// Features grid
className="grid grid-cols-1 md:grid-cols-3 gap-12"

// Pricing grid
className="grid grid-cols-1 md:grid-cols-2 gap-8"

// Bento grid
className="grid grid-cols-1 md:grid-cols-3 gap-6"
// Large item: className="md:col-span-2 md:row-span-2"
```

### Visibility

```tsx
className="hidden md:block"  // Desktop only
className="block md:hidden"  // Mobile only
```

---

## 11. Accessibility Requirements

### Color Contrast
- Normal text: 4.5:1 minimum ratio
- Large text (18px+): 3:1 minimum ratio
- UI components: 3:1 minimum ratio

### Focus States
All interactive elements must have visible focus indicators:
```tsx
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

### Touch Targets
- Minimum size: 44x44px for touch devices
- Use `min-h-[44px] min-w-[44px]` for small buttons

### ARIA Labels
- Icon-only buttons require `aria-label`
- Links opening new tabs require indication

---

## 12. AI-Native Patterns

Based on ui-ux-pro-max recommendations for EdTech:

### Key Effects
- Typing indicators (3-dot pulse) for AI responses
- Streaming text animations for real-time content
- Smooth reveal animations for content loading
- Context cards for AI suggestions

### Anti-Patterns to Avoid
- Heavy UI chrome that distracts from content
- Slow response feedback (always show loading states)
- Complex navigation that obscures learning content

---

## 13. Pre-Delivery Checklist

Before shipping any UI component:

### Visual Quality
- [ ] No emojis used as icons (use SVG: Material Icons/Lucide)
- [ ] All icons from consistent icon set
- [ ] Hover states don't cause layout shift
- [ ] Colors use semantic tokens, not hardcoded values

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Focus states visible for keyboard navigation
- [ ] Loading states for async operations

### Light/Dark Mode
- [ ] Text has sufficient contrast in both modes
- [ ] Borders visible in both modes
- [ ] Tested in both modes before delivery

### Layout
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Content not hidden behind fixed elements

### Accessibility
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] `prefers-reduced-motion` respected
- [ ] Touch targets minimum 44x44px

---

## 14. File Structure

```
design-system/
├── MASTER.md           # This file - Global Source of Truth
├── pages/              # Page-specific overrides
│   ├── landing.md      # Landing page specifics
│   ├── dashboard.md    # Dashboard specifics
│   └── ...
└── components/         # Component documentation
    ├── buttons.md
    ├── cards.md
    └── ...
```

---

## 15. Brand Customization (Multi-tenant)

The Aluminify design system supports multi-tenant white-labeling through a three-level token hierarchy:

### Token Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIERARQUIA DE TOKENS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Nível 1: DEFAULTS GLOBAIS (Aluminify Brand)                  │
│     └── design-system/tokens/*.ts → globals.css :root          │
│                                                                 │
│  Nível 2: PRESETS DE TEMA (built-in themes)                    │
│     └── themes.css → data-theme-preset attribute               │
│                                                                 │
│  Nível 3: OVERRIDES DO TENANT (Brand Customization)            │
│     └── Database → TenantBrandingProvider → CSS vars           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Customizable CSS Variables

Tenants can override any of these CSS custom properties:

```typescript
// From design-system/tokens/brand-mapping.ts
const customizableCSSVariables = [
  // Colors
  '--primary', '--primary-foreground',
  '--secondary', '--secondary-foreground',
  '--accent', '--accent-foreground',
  '--muted', '--muted-foreground',
  '--background', '--foreground',
  '--card', '--card-foreground',
  '--destructive', '--destructive-foreground',
  '--sidebar', '--sidebar-foreground',
  '--sidebar-primary', '--sidebar-primary-foreground',
  // Typography
  '--font-sans', '--font-mono',
  // Theme customizer
  '--radius',
];
```

### Key Files

| File | Purpose |
|------|---------|
| `design-system/tokens/colors.ts` | Default color values |
| `design-system/tokens/brand-mapping.ts` | DB field → CSS var mapping |
| `css-properties-manager.ts` | Runtime CSS injection |
| `TenantBrandingProvider` | React context provider |

### How It Works

1. **Default values** load from `globals.css` (defined by `design-system/tokens/`)
2. **TenantBrandingProvider** fetches tenant branding from database
3. **CSSPropertiesManager** applies overrides as inline CSS custom properties
4. All components using semantic tokens (e.g., `bg-primary`) automatically update

### Database Tables

- `tenant_branding` - Main branding settings
- `tenant_logos` - Logo variants (light, dark, icon, etc.)
- `color_palettes` - Custom color schemes
- `font_schemes` - Typography customization
- `custom_theme_presets` - Saved theme configurations

---

## 16. Token Source Files

All design tokens are defined in TypeScript for type safety:

```
design-system/tokens/
├── index.ts              # Central exports
├── colors.ts             # Color palette (HSL format)
├── typography.ts         # Font stacks, sizes, weights
├── spacing.ts            # Spacing scale, container widths
├── effects.ts            # Shadows, radius, z-index, animations
└── brand-mapping.ts      # ColorPalette → CSS variable mapping
```

### Using Tokens in Code

```typescript
import { colors, spacing, fontFamily } from '@/design-system/tokens';

// Access token values programmatically
const primaryColor = colors.light.primary; // "240 5.9% 10%"
const cardPadding = spacing.card; // "2rem"
```

---

*Document managed by ui-ux-pro-max skill*
*Technology Stack: Next.js 15 + Tailwind CSS + shadcn/ui*
