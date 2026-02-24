## 🎨 DESIGN SYSTEM v2 — Mandatory for ALL UI work

### Philosophy
VisualClimate is a world-class climate data storytelling platform.
Every component must feel like it belongs in a Bloomberg Terminal × Apple Keynote hybrid.
Data is the hero. Numbers are large. White space is generous. Motion is purposeful.

### Brand Identity
- Concept: "Climate Pulse" — three concentric rings (Changer/Starter/Talker)
- Tone: Authoritative but accessible. Data journalism, not academic paper.
- Tagline: "Who's really changing? Who's just talking?"

### Color Palette (MANDATORY — never deviate)
- Changer:    #10B981 (primary green)     gradient: #10B981 → #34D399
- Starter:    #F59E0B (amber)              gradient: #F59E0B → #FBBF24
- Talker:     #EF4444 (red)                gradient: #EF4444 → #F87171
- Accent:     #3B82F6 (blue)               gradient: #3B82F6 → #60A5FA
- Purple:     #8B5CF6                      gradient: #8B5CF6 → #A78BFA
- Page BG:    #F8FAFC
- Card BG:    #FFFFFF
- Hero BG:    linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 50%, #FFF7ED 100%)
- Text:       #0F172A (headings), #334155 (body), #64748B (caption), #94A3B8 (muted)
- Border:     #E2E8F0 (default), #F1F5F9 (subtle)

### Typography
- Headings: font-family: 'Inter', sans-serif; font-weight: 800
- Body: font-family: 'Inter', sans-serif; font-weight: 400
- Numbers/Data: font-family: 'JetBrains Mono', monospace; font-weight: 700
- Hero number: text-[72px] md:text-[96px] font-mono font-black tracking-tight
- Big stat: text-[48px] md:text-[64px] font-mono font-bold
- Card stat: text-[32px] md:text-[40px] font-mono font-bold
- Grade badge: text-[56px] font-mono font-black with colored glow

### Card System
- Base: rounded-2xl bg-white border border-gray-100 p-6 md:p-8
  shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
  hover:-translate-y-1 transition-all duration-300
- Glass: backdrop-blur-xl bg-white/70 border border-white/50 (used sparingly on hero)
- Accent line: w-1 h-full rounded-full bg-gradient-to-b (Changer/Starter/Talker gradient)
- NEVER: sharp corners (< rounded-xl), no shadow, bg-gray-50 as card background

### Gradients on SVG Charts (MANDATORY)
- Every Sankey link: use <linearGradient> matching source→target color
- Every donut sector: radial gradient from dark→light of its category color
- Every line chart area fill: vertical gradient from line color (opacity 0.15) → transparent
- Every bar chart: horizontal gradient matching domain color
- Radar chart fill: radial gradient from center (#3B82F6 opacity 0.08) → edge (#3B82F6 opacity 0.25)
  with colored dots (r=6) at each vertex

### Motion Rules (using 'motion/react')
- Page sections: fade-in + translateY(20px) on viewport entry, duration 0.6s, stagger 0.1s
- Numbers: CountUp animation on viewport entry (duration 1.5s, easing easeOut)
- Cards: staggered entrance (0.05s per card)
- Hover: scale(1.02) + shadow increase, spring transition
- Chart paths: draw-on animation (pathLength 0→1, duration 1.2s)
- Grade badge: scale(0→1) + slight rotation on mount, spring physics
- NEVER: bouncy/playful motion, spinning loaders, parallax scroll jank

### Layout Patterns
- Hero: min-h-[85vh], centered content, gradient background with 2-3 soft gradient blobs
  (absolute positioned, w-[400px] h-[400px] rounded-full blur-[100px] opacity-20)
- Section spacing: py-20 md:py-32 between major sections
- Max content width: max-w-7xl mx-auto px-4 md:px-6
- Bento grid: grid-cols-1 md:grid-cols-4 gap-4 (use col-span-1/2/3 for visual hierarchy)
- Country card grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4

### Component-Specific Rules
- Grade badge: 80×80px circle with grade letter centered, glow-{color} class,
  bg-{color}/10 border border-{color}/20
- Domain score bar: h-3 rounded-full, bg-gray-100, fill with domain gradient, animated width
- Sparkline in cards: 60×24px mini SVG, stroke-width 1.5, domain color, no axes
- Country flag: use emoji (no image), text-2xl, inside a 40×40 rounded-full bg-gray-50 center
- Data source table: ALWAYS collapsible accordion by category, default closed
- Poster gallery: masonry grid or carousel, hover overlay with title + download button

### Absolute Prohibitions
- ❌ Dark backgrounds anywhere (no bg-gray-900, bg-slate-900, bg-[#0F172A])
- ❌ Tables with >10 visible rows (must paginate or accordion)
- ❌ Charts without gradients
- ❌ Numbers in body font (must be mono)
- ❌ Cards without hover effect
- ❌ Sections without spacing (py-20 minimum)
- ❌ Raw data dumps without visual treatment
- ❌ Same-size everything (must have visual hierarchy)