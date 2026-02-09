# VisualClimate Design System — Stripe-Inspired

## Color System
| Token             | Value                                       |
|-------------------|---------------------------------------------|
| `--bg-primary`    | `#0a2540` (deep navy)                       |
| `--bg-secondary`  | `#1a3a5c`                                   |
| `--bg-card`       | `rgba(255,255,255,0.05)` + `backdrop-blur`  |
| `--text-primary`  | `#ffffff`                                   |
| `--text-secondary`| `#adbdcc`                                   |
| `--accent-from`   | `#00d4ff`                                   |
| `--accent-to`     | `#7b61ff`                                   |
| `--success`       | `#00d924`                                   |
| `--warning`       | `#ffbb00`                                   |
| `--border`        | `rgba(255,255,255,0.1)`                     |
| `--bg-footer`     | `#061b2e`                                   |

## Typography (Inter via next/font/google)
| Element          | Classes                                                                       |
|------------------|-------------------------------------------------------------------------------|
| Hero title       | `text-5xl md:text-7xl font-bold tracking-tight`                               |
| Section title    | `text-3xl md:text-4xl font-semibold`                                          |
| Body             | `text-lg text-[#adbdcc] leading-relaxed`                                      |
| Caption/Label    | `text-sm uppercase tracking-widest text-[#adbdcc]`                            |
| Number highlight | `text-6xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#7b61ff] bg-clip-text text-transparent` |

## Layout
- Max width: `max-w-7xl mx-auto`
- Section spacing: `py-24 md:py-32`
- Card: `rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`

## Components

### Header
- `bg-[#0a2540]/80 backdrop-blur-xl sticky top-0 z-50`
- Logo: "Visual" white + "Climate" gradient `bg-gradient-to-r from-[#00d4ff] to-[#7b61ff] bg-clip-text text-transparent`
- Nav links: `text-[#adbdcc] hover:text-white transition-all duration-300`
- CTA: `bg-gradient-to-r from-[#00d4ff] to-[#7b61ff] rounded-full px-6 py-2`

### Cards
- Base: `rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8`
- Hover: `hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] transition-all duration-300`

### Buttons
- Primary: `bg-gradient-to-r from-[#00d4ff] to-[#7b61ff] rounded-full px-8 py-3 font-semibold text-white`
- Secondary: `border border-white/20 rounded-full px-8 py-3 font-semibold text-white hover:bg-white/10`
- Hover: `hover:opacity-90 hover:shadow-lg hover:shadow-[#00d4ff]/20 transition-all duration-300`

### Footer
- `bg-[#061b2e] border-t border-white/10`

### Inputs
- `bg-white/10 border border-white/20 text-white rounded-lg focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]`

## Interactions
- All hover: `transition-all duration-300`
- No page-entry animations (performance priority)
