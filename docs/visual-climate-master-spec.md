# Visual Climate Master Spec
**Single source of truth for the VisualClimate redesign.**
Last updated: 2026-04-02

---

## 1. What Visual Climate Is

VisualClimate is an open climate intelligence platform that grades 250 countries on their climate performance using real public data. It answers one question:

**"Is your country actually keeping its climate promises?"**

Every country receives a letter grade (A+ to F), a numeric score (0-100), and a classification (Changer / Starter / Talker) based on 67 indicators from 5 trusted sources.

The platform serves teachers, journalists, policy teams, and sustainability professionals. The primary success metric is how often chart PNGs get shared on LinkedIn.

**Core product surfaces:**
- Report Card: single grade per country across 5 scored domains
- Country Deep Dive: 10 data sections with charts and insights
- Explore: browse/filter/compare all 250 countries
- Posters: 6 publication-ready chart types, downloadable as PNG

---

## 2. What Already Exists in This Repo

### 2.1 Routes (20 pages)

| Route | Type | Role |
|-------|------|------|
| `/` | SSR | Homepage: search, map scoreboard, features, poster showcase, CTA |
| `/country/[iso3]` | SSR | Country deep dive: header stats + CountryClient with 5 section components |
| `/report/[iso3]` | SSR | Report Card: bento grid with gauge arc, 5 domain scores, insights |
| `/report` | SSR | Report Card index: browse all countries by grade |
| `/explore` | SSR | Country grid: filter by class/region/income, sort, search, compare selection |
| `/posters` | Client | Poster gallery: 6 types, country selector, lightbox, PNG download |
| `/compare` | SSR | Side-by-side comparison: radar chart, domain scores, raw indicators, CSV export |
| `/dashboard` | SSR | Legacy country explorer (similar to Explore) |
| `/about` | Static | Mission, team, data sources |
| `/methodology` | Static | Scoring methodology: 5 domains, weights, normalization, grade thresholds |
| `/learn` | Static | Hub linking to insights, library, guides, methodology |
| `/library` | Static | Report library (links not connected) |
| `/guides` | Static | Guide index (2 guides) |
| `/guides/climate-data-sources` | Static | Long-form guide |
| `/guides/issb-s2-beginners` | Static | Long-form guide |
| `/insights` | Static | Insight index (2 articles) |
| `/insights/emissions-trend` | Static | Emissions analysis article with chart |
| `/insights/climate-vulnerability` | Static | Vulnerability analysis article with chart |
| `/linkedin/[iso3]/sankey` | Client | LinkedIn-optimized Sankey chart card |
| `/api/og` | API | Dynamic Open Graph image generation |

### 2.2 Database (Supabase)

```
countries (250 rows): id, iso3, name, region, sub_region, income_group, population, lat, lng, flag_url, iso2
indicators (67 rows): id, source, code, name, unit, category, domain, issb_s2_ref, sdg_target
country_data (172,121 rows): id, country_iso3, indicator_code, year, value, source
```

Key indicator families:
- `EN.GHG.*` — World Bank emissions
- `EMBER.*` — Electricity mix and carbon intensity
- `NDGAIN.*` — Vulnerability and readiness
- `CTRACE.*` — Climate TRACE sector emissions (9 sectors)
- `OWID.*` — Cumulative CO2, temperature attribution, methane, N2O, fuel breakdown
- `DERIVED.*` — Decoupling, CO2/GDP, energy transition, emissions intensity, climate class
- `REPORT.*` — Total score, grade, 5 domain scores

### 2.3 Scoring System

**5 domains with weights:**
| Domain | Weight | Indicators |
|--------|--------|-----------|
| Emissions | 30% | CO2/capita (50%), CO2/GDP (30%), Decoupling (20%) |
| Energy | 25% | Renewable % (60%), Grid carbon intensity (40%) |
| Economy | 15% | GDP/capita, Decoupling index |
| Responsibility | 15% | Cumulative CO2 share, Temperature contribution |
| Resilience | 15% | ND-GAIN vulnerability, ND-GAIN readiness |

**Grade scale:** A+ (90-100), A (80-89), B+ (70-79), B (60-69), C+ (50-59), C (40-49), D (25-39), F (0-24)

**Classification:** Changer (CO2 declining AND renewables rising), Starter (one condition), Talker (neither)

Implemented in: `scripts/analysis-report-card.ts`, `scripts/analysis-classify.ts`

### 2.4 ETL Pipeline (18 scripts)

| Script | Source | Data |
|--------|--------|------|
| `fetch-worldbank.ts` | World Bank WDI | GDP, CO2, PM2.5, forest, energy use |
| `etl-owid.ts` | Our World in Data | Cumulative CO2, fuel breakdown, methane, N2O, temperature |
| `etl-ember.ts` | Ember Climate | Renewable %, fossil %, carbon intensity |
| `etl-ndgain.ts` | ND-GAIN | Vulnerability, readiness |
| `etl-climatetrace.ts` | Climate TRACE | 9 sector emissions |
| `etl-expand-countries.ts` | — | Expand country table to 250 |
| `etl-additional-indicators.ts` | — | Derived: decoupling, CO2/GDP, energy transition |
| `analysis-report-card.ts` | — | Score + grade calculation |
| `analysis-classify.ts` | — | Changer/Starter/Talker classification |
| `co2-trend-comparison.ts` | — | Pre/post Paris CAGR analysis |
| `qa-data-check.ts` | — | Data quality validation |
| `seed-countries.ts` | — | Initial country seeding |

### 2.5 Data Files

| Path | Count | Purpose |
|------|-------|---------|
| `public/data/ndc-gap/*.json` | 204 | NDC gap analysis per country |
| `public/data/kaya/*.json` | 68 | Kaya LMDI decomposition per country |
| `data/analysis/risk-profile-*.json` | 6 | Risk profiles (KOR, USA, DEU, BRA, NGA, BGD only) |
| `data/analysis/emissions-trend-6countries.json` | 1 | CAGR, Paris impact for 6 pilots |
| `public/data/equity-scatter.json` | 1 | CO2/capita vs GDP scatter data |

### 2.6 Chart Components (19)

Located in `src/components/charts/`:

| Component | Lines | Used In |
|-----------|-------|---------|
| EmissionsLineChart | — | Country deep dive (production vs consumption CO2) |
| IndexedLineCharts | — | Country deep dive (dual/triple indexed comparison) |
| HorizontalBarChart | — | Country deep dive (CTRACE sector bars) |
| StackedAreaChart | — | Country deep dive (fossil fuel breakdown over time) |
| DualYLineChart | — | Country deep dive (GDP vs CO2 dual axis) |
| VulnerabilityScatter | — | Country deep dive (ND-GAIN scatter for all countries) |
| ClimateGap | 267 | Country deep dive (pre/post Paris slope chart) |
| ClimateSankey | 288 | LinkedIn card |
| NDCGapChart | 238 | Country deep dive (conditional, loads from JSON) |
| KayaWaterfall | 251 | Country deep dive (conditional, loads from JSON) |
| EquityScatter | 202 | Country deep dive (conditional, loads from JSON) |
| WorldScoreboard | 190 | Homepage (map with Changer/Starter/Talker dots) |
| ClimateSpiral | 181 | — |
| ClimateDivide | 179 | — |
| WorldMap | 172 | Homepage (D3 world map) |
| ClimateStripes | 172 | — |
| ClimatePoster | 229 | Poster page |
| CountryCard | 154 | — |
| LineChart | 126 | General purpose |
| DonutChart | 116 | — |

### 2.7 Section Components (5)

Located in `src/components/sections/`:

| Component | Content |
|-----------|---------|
| EmissionsSection | CO2 trends, production vs consumption, source comparison, CTRACE sectors, fuel breakdown, NDC gap, Climate Gap |
| EnergySection | Electricity mix donut, renewable change, carbon intensity, transition ranking |
| EconomySection | GDP vs CO2 decoupling, historical responsibility, temperature attribution, beyond CO2 |
| ResilienceSection | ND-GAIN vulnerability scatter, risk profile, Kaya decomposition, equity scatter |
| DataSourcesSection | Summary and source attribution |

Shared utilities in `shared.tsx`: SafeChart, ChartErrorBoundary, SourceLabel, InsightPanel, MetricRow, signed(), ordinal()

### 2.8 Poster System

6 poster types with dedicated renderers in `src/app/posters/renderers/`:
- WorldScoreboardPoster
- EnergyFlowPoster
- ParisGapPoster
- TransitionRacePoster
- CarbonInequalityPoster
- AirQualityPoster

Supporting infrastructure:
- `PosterShell` — common wrapper
- `poster-data.ts` — data fetching for posters
- `PosterLightbox`, `PosterExplorer`, `BentoSection`, `Toolbar` — UI components
- `exportPng.ts` — SVG-to-PNG and HTML-to-PNG with watermark

### 2.9 UI System

CSS Variables (`globals.css`):
```
--bg-primary: #FFFFFF
--bg-section: #F8F9FA
--accent-primary: #0066FF
--accent-positive: #00A67E
--accent-negative: #E5484D
--accent-warning: #F59E0B
--text-primary: #1A1A2E
--text-secondary: #4A4A6A
--text-muted: #8888A0
```

Climate UI primitives (`src/components/climate/`):
PageWrapper, HeroSection, SectionHeader, ChartCard, ScrollFadeIn, SummaryFan, StoryBlock, BentoGrid

Global components: Header (sticky, 2 nav links: Explore, Posters), Footer (4-column grid)

### 2.10 SEO

- `JsonLd` — structured data (website + country)
- `MetaTags` — reusable metadata factory
- `sitemap.ts` — dynamic sitemap
- `/api/og` — dynamic OG image

---

## 3. What Must Be Preserved

**DO NOT MODIFY these systems. They are the foundation:**

| System | Files | Why |
|--------|-------|-----|
| Supabase schema | 3 tables | All data queries depend on this schema |
| Scoring logic | `scripts/analysis-report-card.ts`, `scripts/analysis-classify.ts` | Grade/class calculations are validated and production-stable |
| ETL pipeline | `scripts/etl-*.ts`, `scripts/fetch-*.ts` | Data collection from 5+ sources |
| Route paths | All `/src/app/*/page.tsx` | External links, SEO, sitemap depend on stable URLs |
| Data flow | SSR fetch in page.tsx → client component props | Architecture is correct and performant |
| Chart math | All D3/SVG logic inside chart components | Validated calculations |
| Export system | `exportPng.ts` | PNG download with watermark |
| SEO components | `JsonLd.tsx`, `MetaTags.tsx`, `sitemap.ts` | Search engine indexing |
| Poster renderers | `src/app/posters/renderers/*.tsx` | Poster output format is stable |
| Data JSON files | `public/data/`, `data/analysis/` | Pre-computed analysis results |
| Constants | `src/lib/constants.ts` | Grade mappings, color codes, indicator definitions |
| Supabase clients | `src/lib/supabase/client.ts`, `server.ts` | Auth and connection config |

---

## 4. What Should Be Redesigned

**ONLY the presentation layer — how things look, not what they compute.**

### 4.1 Homepage (`src/app/page.tsx`)

**Current state:** 8 sections of generic SaaS marketing copy: hero with search, "Platform" features (3 cards), map scoreboard, "Features" bento (3+2 cards), live preview (hardcoded KOR data), poster showcase (3 placeholder gradient cards), data sources bar, CTA with search repeat.

**Problem:** Feels templated. Too many sections saying the same thing different ways. The map scoreboard is the most interesting part but gets buried. Hardcoded preview data (KOR C+) is misleading.

**Redesign scope:**
- Reduce to 4-5 focused sections max
- Lead with the world map / scoreboard as the hero visual (not a text block)
- Replace hardcoded KOR preview with live data from Supabase
- Show real poster thumbnails, not gradient placeholders
- Make the search bar the dominant interaction
- Remove duplicate CTA section
- Keep: SSR data fetching functions (getStats, getScoreboardData, getCountryList)

### 4.2 Report Card Page (`src/app/report/[iso3]/ReportCardClient.tsx`)

**Current state:** Bento grid with gradient gauge arc hero, 5 domain cards with animated progress bars, "What This Means" card, "Explore More" card. Clean but generic.

**Problem:** The gauge arc + bento grid is functional but doesn't feel distinctive. The domain cards lack context (no comparison to global average or peers).

**Redesign scope:**
- Elevate the grade/score visual treatment (ref: Credify credit score dashboard, Ref4/Ref6)
- Add peer context: "X ranks #Y among Z countries in its income group"
- Better visual hierarchy between the hero score and domain breakdown
- Keep: data fetching in page.tsx, ReportCardData interface, all score/grade logic

### 4.3 Country Deep Dive (`src/app/country/[iso3]/`)

**Current state:** SSR header with flag + stats + grade badge, then CountryClient renders 5 section components sequentially. Clean card-based layout.

**Problem:** The header area is plain. Sections flow without narrative structure. No visual connective tissue between sections.

**Redesign scope:**
- Redesign the hero/header area for more impact (flag, grade, key stats in a more editorial layout)
- Better section transitions and visual rhythm
- Keep: ALL data fetching in page.tsx, CountryClient props interface, 5 section components and their internals, chart rendering logic

### 4.4 Explore Page (`src/app/explore/`)

**Current state:** Filter tabs (All/Changer/Starter/Talker), search, region/income/sort dropdowns, 4-column card grid with accent line, grade badge, class badge, 3 metrics. Load more pagination. Compare selection with sticky bar.

**Problem:** Functional but dense. Cards could show more at-a-glance information. The compare flow is good but hidden.

**Redesign scope:**
- Refine card design for better scannability
- Consider adding a mini sparkline or visual indicator
- Better empty state
- Keep: ExploreClient logic, filter/sort/search state, compare selection, all data props

### 4.5 Header & Footer

**Current state:** Header has logo + Explore/Posters links. Footer has 4-column grid with Platform, Insights, Resources, Data Partners.

**Redesign scope:**
- Header could include Report Cards link or subtle search
- Footer is fine structurally, may need visual alignment with overall redesign
- Keep: NAV_LINKS structure, FOOTER_LINKS structure

### 4.6 Design Tokens (globals.css)

**Current state:** CSS custom properties for colors, shadows, typography. Utility classes for card-hover, glow effects, glass card, gradient text, hero gradient, float animation.

**Redesign scope:**
- Refine color palette if needed
- Update utility classes to match new design direction
- Keep: semantic token architecture (--bg-primary, --accent-primary, etc.)

---

## 5. Homepage Role

The homepage has one job: **get the user to search for a country.**

Secondary jobs (in order):
1. Demonstrate the product's value with the world map showing Changers/Starters/Talkers
2. Show real data (not marketing copy)
3. Surface the poster gallery as a shareable asset
4. Establish credibility with data source attribution

**Current sections and verdict:**

| # | Section | Verdict |
|---|---------|---------|
| 1 | Hero (headline + search + popular countries) | KEEP search and popular links. Redesign layout. |
| 2 | Platform (3 feature cards with icons) | CUT or merge. Generic marketing copy. |
| 3 | Map Scoreboard (sticky sidebar + D3 map) | KEEP and PROMOTE. Best section. Should be near top. |
| 4 | Features (3+2 bento cards) | CUT or merge with section 2. Repetitive. |
| 5 | Live Preview (hardcoded KOR C+ report card) | REDESIGN with live data. |
| 6 | Poster Showcase (3 gradient placeholder cards) | KEEP but use real poster thumbnails. |
| 7 | Data Sources bar | KEEP as-is. Simple and effective. |
| 8 | CTA (search + 3 country cards) | CUT. Redundant with hero. |

**Proposed structure (4-5 sections):**
1. Hero: headline + search bar + popular country pills + floating stat badges
2. World Map Scoreboard: the centerpiece visual with class counts
3. Live Data Preview: a real report card pulled from Supabase (not hardcoded)
4. Poster Showcase: real poster thumbnails with download CTA
5. Data Sources bar + final CTA

---

## 6. Country Deep Dive Role

The country deep dive (`/country/[iso3]`) is the **analytical product.** It exists so that after a user sees a country's report card grade, they can understand *why* that grade exists through 10 sections of real data.

**Data flow (must preserve):**
```
page.tsx (SSR) — getCountryData():
  → Supabase queries for country, all indicators, scatter data, climate gap data
  → Transforms into props
  → Passes to CountryClient

CountryClient (client) — useEffect():
  → Optional: fetches remaining OWID/CTRACE data if not provided by server
  → Loads NDC gap JSON, Kaya JSON, equity scatter JSON
  → Renders 5 section components
```

**10 content sections (delivered by 5 components):**

| Section | Component | Content |
|---------|-----------|---------|
| Hero | CountryClient inline | CO2/capita big stat + emissions line chart background |
| Emissions Trends | EmissionsSection | Production vs consumption CO2, WB vs CT comparison |
| Emission Sources | EmissionsSection | CTRACE 9-sector bar chart |
| Fossil Fuel Breakdown | EmissionsSection | Stacked area chart by fuel type |
| NDC Gap | EmissionsSection | Conditional: target vs actual emissions |
| Climate Gap | EmissionsSection | Pre/post Paris CAGR slope chart |
| Energy Mix | EnergySection | Donut chart, renewable change, carbon intensity |
| Economy & Decoupling | EconomySection | GDP vs CO2 dual axis, historical responsibility, methane/N2O |
| Vulnerability | ResilienceSection | ND-GAIN scatter, risk profile, Kaya waterfall |
| Data Sources | DataSourcesSection | Attribution and summary |

---

## 7. Page-by-Page Product Structure

### 7.1 Core Product Pages (high traffic, high value)

| Page | URL | Data Source | Key Actions |
|------|-----|------------|-------------|
| Homepage | `/` | SSR: stats, scoreboard, country list | Search country, browse map, click popular |
| Report Card | `/report/[iso3]` | SSR: scores, grade, class | View grade, compare domains, link to deep dive |
| Country Deep Dive | `/country/[iso3]` | SSR: all indicators + client extras | Explore charts, read insights |
| Explore | `/explore` | SSR: all country cards with metrics | Filter, search, sort, select for compare |
| Posters | `/posters` | Client: metrics, scoreboard, race data | Browse posters, change country, download PNG |

### 7.2 Comparison & Analysis Pages

| Page | URL | Data Source | Key Actions |
|------|-----|------------|-------------|
| Compare | `/compare` | SSR: up to 5 countries full data | Add/remove countries, radar chart, CSV export |
| Dashboard | `/dashboard` | SSR: same as explore | Legacy explorer (may merge with /explore) |

### 7.3 Content Pages (SEO + education)

| Page | URL | Type |
|------|-----|------|
| Methodology | `/methodology` | Static: scoring breakdown |
| About | `/about` | Static: mission, data sources |
| Learn | `/learn` | Static: hub page |
| Insights Index | `/insights` | Static: article list |
| Emissions Trend | `/insights/emissions-trend` | Static: analysis article |
| Climate Vulnerability | `/insights/climate-vulnerability` | Static: analysis article |
| Guides Index | `/guides` | Static: guide list |
| Climate Data Sources | `/guides/climate-data-sources` | Static: long-form guide |
| ISSB S2 Beginners | `/guides/issb-s2-beginners` | Static: long-form guide |
| Library | `/library` | Static: report links (not connected) |

### 7.4 Utility Routes

| Route | Purpose |
|-------|---------|
| `/api/og` | Dynamic Open Graph image |
| `/linkedin/[iso3]/sankey` | LinkedIn-optimized Sankey card |
| `sitemap.ts` | Dynamic sitemap for 250 countries |

### 7.5 Navigation Structure

**Header (top bar):** Home (logo), Explore, Posters
**Footer:** Platform (Report Cards, Explore, Posters, Compare), Insights, Resources (Methodology, About, Learn, Guides), Data Partners (external links)

---

## 8. UX / UI / Design Direction

### 8.1 Design Philosophy (from DESIGN.md)

The product should feel: **premium, precise, calm, editorial, trustworthy, data-rich but never cluttered.**

Blend structured SaaS clarity with editorial readability. Avoid generic AI startup aesthetic, excessive gradients, noisy dashboards, overdesigned NGO visuals.

### 8.2 Reference Designs (from mockups/)

| Ref | Source | Takeaway for VisualClimate |
|-----|--------|---------------------------|
| Ref0 | Adiyo (SaaS hero) | Floating badge pattern, clean hero with stats |
| Ref1 | Feature bento (SaaS) | 3+2 card layout with section dot labels |
| Ref2 | Chatbuddy (full page) | Section rhythm: hero > product screenshot > features > how it works |
| Ref3 | Dev tool landing (dark hero + light body) | Product screenshot as hero visual, not text |
| Ref4 | Credify (credit score dashboard) | Score gauge + domain breakdown bento grid — directly applicable to Report Card |
| Ref5 | Credify UI kit (bento tiles) | Card system with score gauges, badges, notifications |
| Ref6 | Finance dashboard (bento) | Revenue/expense cards with sparklines, donut charts, progress bars |
| CHAMP screenshot | Climate coalition about page | Dark hero with editorial type, pledge list, FAQ accordion |

### 8.3 Design System (existing, preserve foundations)

**Colors:** Blue (#0066FF) primary, Green (#00A67E) positive, Red (#E5484D) negative, Amber (#F59E0B) warning. Light backgrounds only (#FFFFFF, #F8F9FA). No dark themes.

**Typography:** Inter for body, JetBrains Mono for numbers/data. Strong headlines, clean sans-serif, highly legible numbers.

**Cards:** Rounded corners (rounded-2xl), subtle border (#E8E8ED), light shadow, hover lift animation.

**Charts:** Explanatory, not decorative. Always paired with short interpretation. Export-friendly dimensions.

### 8.4 Design Principles for Redesign

1. **Data first, copy second.** Show the map, the scores, the charts — then explain.
2. **One action per section.** Each section should drive one user action.
3. **Real data only.** No placeholder gradients, no hardcoded sample data.
4. **Calm density.** Pack information tightly but with breathing room.
5. **Peer context.** A score means nothing without comparison. Always show where a country stands relative to peers.
6. **Shareable units.** Every chart/card should be exportable and LinkedIn-ready.
7. **Progressive disclosure.** Report Card grade first → domain breakdown → full deep dive.

### 8.5 Light Theme Only

Per CLAUDE.md: **dark theme/background is absolutely forbidden.** No bg-slate-900, no #0a0a1a, no dark mode. The CHAMP dark hero reference should NOT be followed for background treatment.

---

## 9. Implementation Priorities

### P0: Foundation (do first)

1. **Audit and fix the homepage** — reduce to 4-5 sections, lead with map, remove redundant marketing copy
2. **Elevate the Report Card page** — better score visual, peer context, editorial layout
3. **Refine the Explore page cards** — improve scannability, better data density

### P1: Polish

4. **Redesign country deep dive header** — more impactful hero area with grade badge, key stats, contextual insight
5. **Unify design tokens** — make sure all pages use the same visual language
6. **Header/Footer refinement** — align with updated design system

### P2: Content & Growth

7. **Merge /dashboard into /explore** — remove route duplication
8. **Connect /library page** — wire up report links
9. **Expand risk profiles** — currently 6 countries, need 200+
10. **Expand emissions trend JSON** — currently 6 countries, need 200+

### P3: Features

11. **PDF report generation** — per-country downloadable report
12. **Compare page improvements** — shareable comparison URLs
13. **More poster types** — leverage unused chart components (ClimateSpiral, ClimateStripes, ClimateDivide)

---

## Appendix A: File Map

```
src/
  app/
    page.tsx                           # Homepage (SSR, 502 lines)
    layout.tsx                         # Root layout (Header + Footer)
    globals.css                        # Design tokens + utilities
    HomeCharts.tsx                     # Client chart wrapper
    HomeStripes.tsx                    # Client stripes wrapper
    HomeMap.tsx (../components/)       # D3 world map

    country/[iso3]/
      page.tsx                         # SSR data fetch (589 lines)
      CountryClient.tsx                # Client component (369 lines)
      error.tsx                        # Error boundary

    report/
      page.tsx                         # Report Card index
      ReportIndexClient.tsx            # Report index grid
      [iso3]/
        page.tsx                       # SSR score fetch (121 lines)
        ReportCardClient.tsx           # Bento grade display (333 lines)

    explore/
      page.tsx                         # SSR country cards
      ExploreClient.tsx                # Filter/sort/grid (400 lines)

    posters/
      page.tsx                         # Poster page wrapper
      PostersClient.tsx                # Main poster client (327 lines)
      poster-data.ts                   # Data fetching
      renderers/                       # 6 poster renderers + PosterShell

    compare/
      page.tsx                         # SSR multi-country fetch
      CompareClient.tsx                # Radar + tables (470 lines)

    dashboard/                         # Legacy explorer
    about/                             # Mission page
    methodology/                       # Scoring methodology
    learn/                             # Learning hub
    library/                           # Report library
    guides/                            # Guide pages (2)
    insights/                          # Insight pages (2)
    linkedin/[iso3]/sankey/            # LinkedIn card
    api/og/                            # OG image generation
    sitemap.ts                         # Dynamic sitemap

  components/
    Header.tsx                         # Sticky nav (Explore, Posters)
    Footer.tsx                         # 4-column footer
    HeroSearch.tsx                     # Country search autocomplete
    HomeMap.tsx                        # D3 world map component
    ScrollyScene.tsx                   # Scrollytelling wrapper
    StatCard.tsx                       # Reusable stat card

    charts/                            # 19 chart components (D3/SVG)
    sections/                          # 5 section components + shared
    climate/                           # UI primitives (PageWrapper, etc.)
    posters/                           # Poster UI components
    linkedin/                          # LinkedIn card components
    seo/                               # JsonLd + MetaTags

  lib/
    constants.ts                       # Indicators, colors, ISO3 lists
    exportPng.ts                       # PNG export utilities
    iso3ToFlag.ts                      # ISO3 to emoji flag
    utils.ts                           # General utilities
    supabase/
      client.ts                        # Browser Supabase client
      server.ts                        # Server Supabase client

scripts/                               # 18 ETL + analysis scripts
public/data/                           # NDC gap (204), Kaya (68), equity scatter
data/analysis/                         # Risk profiles (6), emissions trend
```

## Appendix B: Data Flow Diagram

```
                    ┌─────────────────────────┐
                    │   Supabase (PostgreSQL)  │
                    │  countries · indicators  │
                    │     country_data         │
                    │  (172K rows, 250 ctry)   │
                    └───────────┬─────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
     SSR (page.tsx)        SSR (page.tsx)         Client fetch
     Homepage              Country/Report         PostersClient
          │                     │                     │
     getStats()            getCountryData()      fetchMetrics()
     getScoreboardData()   getReportCard()       fetchScoreboardData()
     getCountryList()           │                fetchAllRenewable()
          │                     │                     │
          ▼                     ▼                     ▼
     Homepage UI           CountryClient /       Poster renderers
     (search, map,         ReportCardClient      (6 types)
      features)            (sections, charts)         │
                                │                     │
                    ┌───────────┤                     │
                    │           │                     │
              JSON files    useEffect               exportPng()
              (NDC gap,     (OWID/CTRACE              │
               Kaya,        client fetch              ▼
               equity,      if not SSR)          PNG download
               risk)                             with watermark
```

## Appendix C: Preserved Contracts

These interfaces and data shapes MUST NOT change:

```typescript
// Report Card data shape (report/[iso3]/page.tsx)
interface ReportCardData {
  iso3: string; name: string; region: string;
  total: number; grade: string; gradeNumeric: number;
  climateClass: 'Changer' | 'Starter' | 'Talker' | null;
  emissions: number | null; energy: number | null;
  economy: number | null; responsibility: number | null;
  resilience: number | null;
}

// CountryClient props (country/[iso3]/CountryClient.tsx)
interface CountryClientProps {
  countryName: string; iso3: string;
  wbCo2Series: { year: number; value: number }[];
  co2Comparison: { year: number; wb: number; ct: number }[];
  gdpVsCo2: { year: number; gdp: number; co2: number }[];
  emberMix: { renewable: number; fossil: number; other: number; year: number; source: string } | null;
  renewableChange: number | null;
  scatterData: { iso3: string; name: string; vulnerability: number; readiness: number }[];
  decouplingSeries: { year: number; value: number }[];
  decouplingScore: number | null;
  pm25?: number | null; carbonIntensity?: number | null;
  initialExtra?: ExtraData;
  climateGapData?: { iso3: string; name: string; pre: number; post: number }[];
}

// ExploreClient props (explore/page.tsx)
interface CountryCard {
  iso3: string; name: string; region?: string;
  co2?: number; renewable?: number; gdp?: number;
  climateClass?: 'Changer' | 'Starter' | 'Talker';
  grade?: string; totalScore?: number; incomeGroup?: string;
}

// CompareClient props (compare/page.tsx)
interface CountryCompareData {
  iso3: string; name: string; region: string;
  domain: { total: number | null; grade: string | null; climateClass: string | null;
            emissions: number | null; energy: number | null; economy: number | null;
            responsibility: number | null; resilience: number | null; };
  indicators: Record<string, { value: number; year: number }>;
}
```
