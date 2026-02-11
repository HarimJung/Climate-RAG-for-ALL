---
name: design-system
description: VisualClimate design system tokens — colors, typography, spacing, component patterns. Load when building UI components or charts.
---

# VisualClimate Design System

## Philosophy
Stripe-quality dark theme. Data-dense, clean, professional.
Every pixel serves a purpose. No decoration without function.

## Color Tokens

### Backgrounds
- `--bg-primary`: #0a0a0f (page background)
- `--bg-secondary`: #12121a (card background)
- `--bg-tertiary`: #1a1a2e (elevated surface)
- `--bg-hover`: #252542 (interactive hover)

### Text
- `--text-primary`: #f0f0f5 (headings, key data)
- `--text-secondary`: #a0a0b5 (body text, labels)
- `--text-tertiary`: #6b6b80 (captions, metadata)
- `--text-muted`: #4a4a5c (disabled, placeholder)

### Accent Colors (Data Visualization)
- `--accent-blue`: #3b82f6 (primary action, links)
- `--accent-green`: #22c55e (positive trend, success)
- `--accent-red`: #ef4444 (negative trend, danger)
- `--accent-amber`: #f59e0b (warning, caution)
- `--accent-purple`: #a855f7 (highlight, special)
- `--accent-cyan`: #06b6d4 (secondary data)

### Chart Palette (6 countries — color-blind safe)
- KOR: #3b82f6 (blue)
- USA: #ef4444 (red)
- DEU: #f59e0b (amber)
- BRA: #22c55e (green)
- NGA: #a855f7 (purple)
- BGD: #06b6d4 (cyan)

### Borders
- `--border-subtle`: #1e1e2e
- `--border-default`: #2d2d44
- `--border-strong`: #3d3d5c

## Typography

### Font Stack
- Primary: `Inter, system-ui, -apple-system, sans-serif`
- Mono: `JetBrains Mono, Fira Code, monospace` (data values, code)

### Scale
- `--text-xs`: 0.75rem / 1rem (12px — metadata, timestamps)
- `--text-sm`: 0.875rem / 1.25rem (14px — body, labels)
- `--text-base`: 1rem / 1.5rem (16px — default)
- `--text-lg`: 1.125rem / 1.75rem (18px — section headers)
- `--text-xl`: 1.25rem / 1.75rem (20px — page titles)
- `--text-2xl`: 1.5rem / 2rem (24px — hero numbers)
- `--text-4xl`: 2.25rem / 2.5rem (36px — big stat callout)

### Weight
- Regular (400): body text
- Medium (500): labels, nav
- Semibold (600): headings
- Bold (700): hero numbers, key metrics

## Spacing (4px Base Grid)
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-12`: 48px
- `--space-16`: 64px

## Border Radius
- `--radius-sm`: 4px (badges, small elements)
- `--radius-md`: 8px (cards, inputs)
- `--radius-lg`: 12px (modals, large panels)
- `--radius-full`: 9999px (pills, avatars)

## Component Patterns

### Card
```
bg-[#12121a] border border-[#2d2d44] rounded-lg p-6 hover:border-[#3d3d5c] transition-colors
```

### Data Table Row
```
border-b border-[#1e1e2e] py-3 px-4 hover:bg-[#1a1a2e] transition-colors
```

### Button (Primary)
```
bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors
```

### Chart Container
```
bg-[#12121a] border border-[#2d2d44] rounded-lg p-6 min-h-[300px] relative
```

### Navigation
```
bg-[#0a0a0f] border-b border-[#1e1e2e] px-6 py-4 flex items-center justify-between
```

## Chart Design Rules
- Always dark background (#12121a)
- Gridlines: #1e1e2e (subtle)
- Axis labels: --text-tertiary
- Data labels: --text-secondary
- Legend: below chart, horizontal layout
- Tooltip: bg-[#252542] border border-[#3d3d5c] rounded-md shadow-lg
- Transitions: 300ms ease-out
