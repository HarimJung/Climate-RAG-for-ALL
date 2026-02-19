# PRODUCT-WIKI.md — VisualClimate Full Project Audit

> Generated: 2026-02-18
> Commit: `14e1086` (main)

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| **Name** | VisualClimate |
| **Description** | Open climate data platform that visualizes climate indicators for 6 pilot countries with interactive charts and downloadable PNG posters |
| **Purpose** | Enable sustainability professionals to explore, compare, and share climate data via charts on LinkedIn |
| **Deploy URL** | https://visualclimate.com (Vercel) |
| **Success Metric** | Number of chart PNGs downloaded and shared on LinkedIn |

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS | ^4 |
| Database | Supabase (PostgreSQL) | @supabase/supabase-js ^2.95.3, @supabase/ssr ^0.8.0 |
| Charts | D3.js + Pure React SVG | d3 ^7.9.0 |
| Map | topojson-client | ^3.1.0 |
| Export | html2canvas | ^1.4.1 |
| Markdown | react-markdown | ^10.1.0 |
| Hosting | Vercel | Production |
| Fonts | Inter + JetBrains Mono | Google Fonts via next/font |

---

## 2. Directory Structure

```
src/
├── app/
│   ├── compare/
│   │   ├── CompareClient.tsx          # Client: country selector + comparison table
│   │   └── page.tsx                   # Server: fetches compare data from Supabase
│   ├── country/[iso3]/
│   │   ├── CountryClient.tsx          # Client: 5 D3 chart sections + insights
│   │   └── page.tsx                   # Server: fetches all country data, renders header + stat cards
│   ├── dashboard/
│   │   ├── DashboardClient.tsx        # Client: indicator selector + ranked comparison lists
│   │   └── page.tsx                   # Server: fetches pilot data for all indicators
│   ├── guides/
│   │   ├── page.tsx                   # Guides index (2 guides listed)
│   │   ├── climate-data-sources/
│   │   │   └── page.tsx               # SEO guide: Free Climate Data Sources (300 lines)
│   │   └── issb-s2-beginners/
│   │       └── page.tsx               # SEO guide: ISSB S2 Disclosure (192 lines)
│   ├── insights/
│   │   ├── page.tsx                   # Insights index (2 articles)
│   │   ├── emissions-trend/
│   │   │   ├── chart.tsx              # D3 multi-line emissions chart (hardcoded data)
│   │   │   └── page.tsx               # Emissions trend analysis with tables
│   │   └── climate-vulnerability/
│   │       ├── chart.tsx              # D3 scatter plot (hardcoded data)
│   │       └── page.tsx               # Vulnerability comparison with risk profiles
│   ├── library/
│   │   └── page.tsx                   # Report catalog (8 reports, no external links)
│   ├── posters/
│   │   ├── page.tsx                   # Server: fetches poster data from Supabase
│   │   └── PostersClient.tsx          # Client: renders Sankey + Gap charts per country
│   ├── favicon.ico
│   ├── globals.css                    # CSS variables (light theme tokens)
│   ├── HomeCharts.tsx                 # (Empty/unused — no content found)
│   ├── HomeStripes.tsx                # Client wrapper for ClimateStripes (disabled in page.tsx)
│   ├── layout.tsx                     # Root layout: Inter font, Header, Footer, JsonLd
│   ├── page.tsx                       # Homepage: hero, stats, key findings, country cards
│   └── sitemap.ts                     # Dynamic sitemap for all routes + 6 country pages
├── components/
│   ├── charts/
│   │   ├── ClimateGap.tsx             # Pure React SVG — Pre/Post Paris slope chart
│   │   ├── ClimatePoster.tsx          # D3 — 1080x1080 dark poster with metrics + stripes
│   │   ├── ClimateSankey.tsx          # Pure React SVG — Energy flow Sankey diagram
│   │   ├── ClimateStripes.tsx         # D3 — Warming stripes (single/stacked modes)
│   │   ├── CountryCard.tsx            # HTML/CSS — 1:1 card with metrics + mini stripes
│   │   ├── DonutChart.tsx             # D3 — Generic donut chart
│   │   ├── LineChart.tsx              # D3 — Generic responsive line chart
│   │   └── WorldMap.tsx               # D3 + TopoJSON — Choropleth world map
│   ├── layout/
│   │   ├── Footer.tsx                 # Duplicate of components/Footer.tsx (unused)
│   │   └── Header.tsx                 # Duplicate of components/Header.tsx (unused)
│   ├── seo/
│   │   ├── JsonLd.tsx                 # JSON-LD structured data (Website + Dataset schemas)
│   │   └── MetaTags.tsx               # OpenGraph + Twitter Card meta tag factory
│   ├── Footer.tsx                     # Main footer: Product/Resources/Data links
│   ├── Header.tsx                     # Main header: sticky nav with mobile menu
│   ├── IndicatorSelector.tsx          # Dropdown selector for CLIMATE_INDICATORS
│   └── StatCard.tsx                   # Reusable stat card (value, unit, trend, source)
├── lib/
│   ├── constants.ts                   # CLIMATE_INDICATORS (6), PILOT_ISO3, CHART_COLORS
│   ├── exportPng.ts                   # SVG→PNG and HTML→PNG export utilities
│   └── supabase/
│       ├── client.ts                  # Browser client via createBrowserClient
│       └── server.ts                  # Server client via createClient + service_role key
```

### Other Directories

| Directory | Contents |
|-----------|----------|
| `data/analysis/` | 6 risk-profile JSON files, emissions-trend JSON, methodology MDs |
| `data/` | climate-trace-ghg.json, ember-electricity.json, ndgain-scores.json, owid-energy-data.csv, source-registry.json, frameworks/, quality-reports/, risk/, reports/ |
| `scripts/` | 10 ETL scripts (seed-countries, fetch-worldbank, fetch-climatewatch, etl-climate-trace, etl-ndgain, derived calculations, QA checks) |
| `public/` | robots.txt, SVG icons (file, globe, next, vercel, window) |

---

## 3. Page Routing

| Route | Type | Description | Status |
|-------|------|-------------|--------|
| `/` | Server | Homepage: hero section, 3 stat cards (from Supabase), 4 key findings, 6 pilot country cards with CO2 and renewable metrics | Working |
| `/country/[iso3]` | Server+Client | Core product: country header with vulnerability badge, 4 stat cards, 5 chart sections (emissions, energy mix, decoupling, vulnerability scatter), data sources table | Working |
| `/compare` | Server+Client | Country comparison: search/select up to 5 countries, indicator comparison table with bars and rankings | Working |
| `/dashboard` | Server+Client | Dashboard: indicator selector dropdown, ranked bars for 6 indicators across 6 pilots, "all indicators at a glance" grid | Working |
| `/insights` | Static | Index page linking to 2 analysis articles | Working |
| `/insights/emissions-trend` | Static+Client | D3 multi-line chart, CAGR table, Paris comparison table, decoupling cards, energy transition bars | Working |
| `/insights/climate-vulnerability` | Static+Client | D3 scatter plot, 6 country risk profile cards with vulnerability/readiness scores | Working |
| `/library` | Static | Report catalog: 8 climate reports from IPCC, UNEP, WMO, IEA, GCP. Cards are not clickable (no external links) | Working but non-functional links |
| `/guides` | Static | Guide index: 2 SEO guides listed | Working |
| `/guides/climate-data-sources` | Static | Long-form SEO guide on free climate data sources (300 lines) | Working |
| `/guides/issb-s2-beginners` | Static | Long-form SEO guide on ISSB S2 disclosure (192 lines) | Working |
| `/posters` | Server+Client | Downloadable climate poster page with ClimateGap + ClimateSankey per country | Working |
| `/sitemap.xml` | Generated | Dynamic sitemap covering all static routes + 6 country pages | Working |

### Inactive/Disabled Routes (not in navigation)
- `/chat` — Not implemented (RAG chatbot, deferred)
- `/pricing` — Not implemented (monetization deferred)
- `/login`, `/signup` — Not implemented (auth deferred)

---

## 4. Component Inventory

### Chart Components (`src/components/charts/`)

| Component | Library | Props | Used In | Active |
|-----------|---------|-------|---------|--------|
| `ClimateGap` | Pure React SVG | `highlightIso3?, className?` | CountryClient, PostersClient | Yes |
| `ClimateSankey` | Pure React SVG | `country, fossil, renewable, nuclear, className?` | CountryClient, PostersClient | Yes |
| `ClimateStripes` | D3 | `mode, country?, iso3?, data?, allData?, indicator?, showExport?, className?` | HomeStripes (disabled) | Import exists but disabled in homepage |
| `ClimatePoster` | D3 | `country, iso3, flag, hook, co2, renewable, pm25, vulnerability, stripesData, className?` | CountryClient (commented out) | Disabled |
| `CountryCard` | D3 + html2canvas | `country, iso3, flag, hook, co2, renewable, pm25, vulnerability, stripesData, className?` | CountryClient (commented out) | Disabled |
| `DonutChart` | D3 | `data: Slice[], title?, size?` | Not actively imported anywhere | Unused |
| `LineChart` | D3 | `data: DataPoint[], title?, unit?, color?, height?` | Not actively imported anywhere | Unused |
| `WorldMap` | D3 + topojson | `data, indicatorName, unit` | Not actively imported anywhere | Unused |

### Layout Components

| Component | Props | Used In | Active |
|-----------|-------|---------|--------|
| `Header` (`components/Header.tsx`) | None | `layout.tsx` | Yes |
| `Footer` (`components/Footer.tsx`) | None | `layout.tsx` | Yes |
| `Header` (`components/layout/Header.tsx`) | — | Nowhere | Duplicate, unused |
| `Footer` (`components/layout/Footer.tsx`) | — | Nowhere | Duplicate, unused |

### UI Components

| Component | Props | Used In | Active |
|-----------|-------|---------|--------|
| `StatCard` | `title, value, unit?, trend?, source?` | Homepage, CountryPage | Yes |
| `IndicatorSelector` | `value, onChange` | DashboardClient | Yes |
| `JsonLd` | `data: Record<string, unknown>` | layout.tsx, CountryPage | Yes |
| `MetaTags` (createMetaTags) | `title, description, ogImage?, path?` | All pages | Yes |

### Page Client Components

| Component | Used In | Active |
|-----------|---------|--------|
| `CountryClient` | `/country/[iso3]` | Yes |
| `CompareClient` | `/compare` | Yes |
| `DashboardClient` | `/dashboard` | Yes |
| `PostersClient` | `/posters` | Yes |
| `HomeStripes` | `/` (commented out import) | Disabled |
| `EmissionsTrendChart` | `/insights/emissions-trend` | Yes |
| `VulnerabilityChart` | `/insights/climate-vulnerability` | Yes |

---

## 5. Data Structure

### Supabase Tables

#### `countries` (250 rows)
| Column | Type | Notes |
|--------|------|-------|
| id | integer | PK, serial |
| iso3 | varchar | Unique, e.g. "KOR" |
| name | varchar | e.g. "South Korea" |
| region | text | e.g. "Asia" |
| sub_region | text | e.g. "Eastern Asia" |
| income_group | text | e.g. "High income" |
| population | bigint | e.g. 51780579 |
| lat, lng | numeric | Coordinates |
| flag_url | text | flagcdn.com URL |
| iso2 | varchar | 2-letter code |
| created_at | timestamptz | |

#### `indicators` (22 rows)
| Column | Type | Notes |
|--------|------|-------|
| id | integer | PK, serial |
| code | varchar | Unique, e.g. "EN.GHG.CO2.PC.CE.AR5" |
| name | varchar | Human-readable name |
| source | varchar | e.g. "World Bank WDI", "Ember", "Derived" |
| unit | varchar | e.g. "t CO2e/capita" |
| category | text | |
| domain | varchar | e.g. "emissions", "energy" |
| issb_s2_ref | varchar | ISSB S2 disclosure reference |
| sdg_target | varchar | SDG target mapping |

#### `country_data` (2,016 rows) — Main data table
| Column | Type | Notes |
|--------|------|-------|
| id | integer | PK, serial |
| country_iso3 | varchar | FK → countries.iso3 |
| indicator_code | varchar | FK → indicators.code |
| year | integer | 2000–2023 |
| value | numeric | Measured value |
| source | varchar | Data source name |
| created_at | timestamptz | |

**RLS: Disabled** on country_data (public read)

#### `indicator_values` (15,381 rows) — Legacy table
| Column | Type | Notes |
|--------|------|-------|
| id | integer | PK |
| indicator_id | integer | FK → indicators.id |
| country_id | integer | FK → countries.id |
| year | integer | |
| value | numeric | |

**Note:** `indicator_values` is not used by the app. All queries use `country_data`.

### Indicator Data Coverage (country_data)

| indicator_code | Rows | Years | Countries | Source |
|---------------|------|-------|-----------|--------|
| AG.LND.FRST.ZS | 144 | 2000–2023 | 6 | World Bank WDI |
| CT.GHG.TOTAL | 54 | 2015–2023 | 6 | Climate TRACE |
| DERIVED.CO2_PER_GDP | 144 | 2000–2023 | 6 | Derived |
| DERIVED.DECOUPLING | 138 | 2001–2023 | 6 | Derived |
| DERIVED.EMISSIONS_INTENSITY | 144 | 2000–2023 | 6 | Derived |
| DERIVED.ENERGY_TRANSITION | 114 | 2005–2023 | 6 | Derived |
| EG.USE.PCAP.KG.OE | 144 | 2000–2023 | 6 | World Bank WDI |
| EMBER.CARBON.INTENSITY | 144 | 2000–2023 | 6 | Ember |
| EMBER.FOSSIL.PCT | 144 | 2000–2023 | 6 | Ember |
| EMBER.RENEWABLE.PCT | 144 | 2000–2023 | 6 | Ember |
| EN.ATM.PM25.MC.M3 | 126 | 2000–2020 | 6 | World Bank WDI |
| EN.GHG.CO2.PC.CE.AR5 | 144 | 2000–2023 | 6 | World Bank WDI |
| NDGAIN.READINESS | 144 | 2000–2023 | 6 | ND-GAIN |
| NDGAIN.VULNERABILITY | 144 | 2000–2023 | 6 | ND-GAIN |
| NY.GDP.PCAP.CD | 144 | 2000–2023 | 6 | World Bank WDI |

### Local Analysis JSON Files

| File | Structure | Used By |
|------|-----------|---------|
| `data/analysis/emissions-trend-6countries.json` | `{ cagr_2000_2023, pre_paris_vs_post_paris, decoupling_score, energy_transition_ranking }` | CountryClient, emissions-trend/page |
| `data/analysis/risk-profile-{ISO3}.json` (x6) | `{ iso3, country, risk_level, vulnerability, readiness, key_vulnerabilities[], strengths[], summary }` | CountryClient |
| `data/analysis/emissions-trend-6countries.md` | Markdown analysis text | Available but not directly rendered |
| `data/analysis/derived-methodology.md` | Methodology documentation | Available but not connected |

### Data Fetch Locations

| File | Fetch Method |
|------|-------------|
| `src/app/page.tsx` | `createServiceClient()` → `country_data`, `countries`, `indicators` tables |
| `src/app/country/[iso3]/page.tsx` | `createServiceClient()` → `country_data` (all indicators for one country) + `countries` |
| `src/app/compare/page.tsx` | `createServiceClient()` → `country_data` (selected indicators for selected countries) |
| `src/app/dashboard/page.tsx` | `createServiceClient()` → `country_data` (all CLIMATE_INDICATORS for 6 pilots) |
| `src/app/posters/page.tsx` | `createServiceClient()` → `country_data` (CO2, renewable, fossil, PM25, vulnerability) |
| `src/app/country/[iso3]/CountryClient.tsx` | Static import of JSON files (analysis data) |
| `src/app/insights/emissions-trend/page.tsx` | Static import of JSON files |
| `src/app/insights/emissions-trend/chart.tsx` | Hardcoded data arrays |
| `src/app/insights/climate-vulnerability/chart.tsx` | Hardcoded data arrays |

---

## 6. Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-only) |
| `OPENAI_API_KEY` | OpenAI API (currently unused — RAG deferred) |
| `STRIPE_SECRET_KEY` | Stripe payments (currently unused — pricing deferred) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks (currently unused) |
| `NEXT_PUBLIC_SITE_URL` | Site URL for sitemap/meta tags |

**Unused env vars:** OPENAI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET — these are configured but no active code uses them.

---

## 7. Working Features

### Charts & Visualizations

| Chart | Page | Data Source | Type |
|-------|------|------------|------|
| CO2 per capita line chart | `/country/[iso3]` | Supabase (EN.GHG.CO2.PC.CE.AR5) | D3 area+line with Paris Agreement marker |
| WB vs Climate TRACE comparison | `/country/[iso3]` | Supabase (EN.GHG.CO2.PC.CE.AR5 + CT.GHG.TOTAL) | D3 dual-line indexed chart |
| Pre-Paris vs Post-Paris slope | `/country/[iso3]`, `/posters` | Hardcoded in ClimateGap.tsx | Pure React SVG slope chart |
| Energy flow Sankey | `/country/[iso3]`, `/posters` | Supabase (EMBER.RENEWABLE.PCT + EMBER.FOSSIL.PCT) | Pure React SVG Sankey |
| Energy donut chart | `/country/[iso3]` | Supabase Ember data | D3 donut (inside `<details>`) |
| GDP vs CO2 decoupling | `/country/[iso3]` | Supabase (NY.GDP.PCAP.CD + EN.GHG.CO2.PC.CE.AR5) | D3 dual-line indexed chart |
| Vulnerability scatter plot | `/country/[iso3]` | Supabase (NDGAIN.VULNERABILITY + NDGAIN.READINESS) | D3 scatter with labels |
| Dashboard indicator bars | `/dashboard` | Supabase (all 6 CLIMATE_INDICATORS) | HTML/CSS ranked bar lists |
| Comparison table | `/compare` | Supabase (all indicators for selected countries) | HTML table with bar widths |
| Emissions trend multi-line | `/insights/emissions-trend` | Hardcoded in chart.tsx | D3 multi-line |
| Vulnerability scatter | `/insights/climate-vulnerability` | Hardcoded in chart.tsx | D3 scatter |

### Other Features

| Feature | Description |
|---------|-------------|
| PNG export | SVG→PNG via canvas, HTML→PNG via html2canvas. Export buttons on ClimateStripes, ClimatePoster, CountryCard, ClimateGap, ClimateSankey |
| Dynamic insights text | CountryClient generates narrative text from emissions-trend JSON (CAGR, Paris impact, decoupling, transition ranking) |
| Risk profile cards | Vulnerability section shows key_vulnerabilities and strengths from risk-profile JSON |
| Vulnerability badge | Country header shows colored badge (Low/Medium/High Risk) based on ND-GAIN score |
| SEO meta tags | Every page uses createMetaTags() for OpenGraph + Twitter cards |
| JSON-LD | Homepage has WebSite schema, country pages have Dataset schema |
| Sitemap | Dynamic sitemap.ts covering all routes |
| Responsive design | Mobile hamburger menu, responsive grids throughout |
| Light theme | Consistent #FFFFFF/#F8F9FA color scheme, CSS variables |

---

## 8. Broken/Incomplete Features

### Disabled Components (commented out imports)

| Component | Location | Reason |
|-----------|----------|--------|
| `HomeStripes` | `src/app/page.tsx:6` | `// disabled — D3 SSR fix pending` |
| `ClimateStripes` (dynamic) | `CountryClient.tsx:8` | Commented out — D3 SSR fix pending |
| `CountryCard` (dynamic) | `CountryClient.tsx:9` | Commented out |
| `ClimatePoster` (dynamic) | `CountryClient.tsx:10` | Commented out |

### Non-functional Pages

| Issue | Location |
|-------|----------|
| **Library report cards have no links** | `src/app/library/page.tsx` — REPORTS array has no `url` field. Cards render but clicking does nothing |
| **HomeCharts.tsx is empty/unused** | `src/app/HomeCharts.tsx` — exists but appears to have no meaningful content |

### Unused Components

| Component | Issue |
|-----------|-------|
| `DonutChart` | Not imported anywhere. Has dark theme text colors (`text-slate-400`, `text-slate-300`) that conflict with light theme |
| `LineChart` | Not imported anywhere. Generic reusable chart but unused |
| `WorldMap` | Not imported anywhere. Has dark stroke color (`#334155`) |
| `components/layout/Header.tsx` | Duplicate of `components/Header.tsx` |
| `components/layout/Footer.tsx` | Duplicate of `components/Footer.tsx` |

### Data Gaps

| Issue | Detail |
|-------|--------|
| `EMBER.CARBON.INTENSITY` | 144 rows in DB but not displayed anywhere in the app |
| `DERIVED.CO2_PER_GDP` | 144 rows in DB but not displayed anywhere |
| `DERIVED.EMISSIONS_INTENSITY` | 144 rows in DB but not displayed anywhere |
| `DERIVED.ENERGY_TRANSITION` | 114 rows in DB, referenced in insights text but not as standalone chart |
| `indicator_values` table | 15,381 rows — legacy table, completely unused by app code |
| `EN.ATM.PM25.MC.M3` | Data ends at 2020 (no 2021-2023) |

---

## 9. External Integrations

### Vercel
- Deployed to production via `vercel --prod`
- No `vercel.json` config file — uses default settings
- `next.config.ts` has empty config (no custom rewrites, headers, or image domains)

### Supabase
- **Browser client** (`src/lib/supabase/client.ts`): `createBrowserClient()` from `@supabase/ssr` — not currently used by any page
- **Server client** (`src/lib/supabase/server.ts`): `createClient()` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` — used by all server components
- RLS enabled on `countries`, `indicators`, `indicator_values`; disabled on `country_data`

### APIs (configured but unused)
- **OpenAI** — API key set in .env.local, no active code (RAG endpoint exists at `src/app/api/rag/route.ts` per memory but not in current file tree)
- **Stripe** — API keys set in .env.local, no active code (checkout/webhook routes not in current file tree)

### External CDNs
- Flag images: `https://flagcdn.com/{iso2}.svg`
- World map TopoJSON: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`

---

## 10. Recent Git History

```
14e1086 feat: real-sankey-and-gap — pure React SVG charts, guides light theme
af5349c fix: disable broken D3 poster components to restore site stability
5bdbca1 [Phase 0-4] Fix d3-sankey crash + ClimatePoster + ClimateGap + /posters page
9fed816 [Fix] Client errors + SSR + guides light theme
3be3431 [Signature] ClimateStripes + CountryCard + ClimateSankey — brand identity charts
14b56ae [Fix] Connect risk-profile JSON + remove all dark backgrounds
d459665 [Fix] emissions-trend/page.tsx — replace hardcoded data with JSON import
299b6a2 [Foundation] Unify CLAUDE.md as single source of truth
02ab136 [Fix] Dynamic insight text + light theme consistency + JSON integration
8719201 [Update] Site-wide light theme + page fixes
5b3e772 [Rebuild] KOR country profile — light theme, analysis-driven, zero N/A
d9d14b7 [Fix] server-side error — add Vercel env vars + try-catch on dynamic pages
f673dbc [Content] Insights pages — emissions trend, vulnerability
c2b8d6e [UI] Country profile — multi-source, risk badge, energy mix
597d410 [Analysis] Risk profiles
6b78078 [Analysis] Emissions trend
a465271 [Data] Ember electricity data
c6f9a11 [Data] ND-GAIN scores
99dd157 [Phase 1] Climate TRACE GHG total emissions ETL
1d49067 [Phase 5] Production deploy
```

---

## 11. Package Analysis

### Dependencies (Production)

| Package | Version | Status |
|---------|---------|--------|
| `next` | 16.1.6 | Active — framework |
| `react` | 19.2.3 | Active |
| `react-dom` | 19.2.3 | Active |
| `@supabase/supabase-js` | ^2.95.3 | Active — server-side data fetching |
| `@supabase/ssr` | ^0.8.0 | **Configured but unused** — browser client imported but never called |
| `d3` | ^7.9.0 | Active — charts in CountryClient, insights charts |
| `d3-sankey` | ^0.12.3 | **Unused** — was used by old Sankey, replaced by pure React SVG ClimateSankey |
| `@types/d3` | ^7.4.3 | Active — type definitions |
| `@types/d3-sankey` | ^0.12.5 | **Unused** — matches unused d3-sankey |
| `@types/topojson-client` | ^3.1.5 | Active — WorldMap types (component exists but unused) |
| `topojson-client` | ^3.1.0 | Active (WorldMap exists but unused in pages) |
| `html2canvas` | ^1.4.1 | Active — CountryCard PNG export |
| `react-markdown` | ^10.1.0 | **Unused** — no component imports it |

### Dev Dependencies

| Package | Version | Status |
|---------|---------|--------|
| `typescript` | ^5 | Active |
| `tailwindcss` | ^4 | Active |
| `@tailwindcss/postcss` | ^4 | Active |
| `eslint` | ^9 | Active |
| `eslint-config-next` | 16.1.6 | Active |
| `@types/node` | ^20 | Active |
| `@types/react` | ^19 | Active |
| `@types/react-dom` | ^19 | Active |
| `tsx` | ^4.21.0 | Active — runs ETL scripts |
| `pg` | ^8.18.0 | Active — ETL scripts use direct Postgres |

### Likely Removable Packages
- `d3-sankey` + `@types/d3-sankey` — replaced by pure React SVG
- `react-markdown` — not imported anywhere
- `@supabase/ssr` — browser client file exists but never used

---

## 12. Performance & SEO

### next.config.ts
- **Empty configuration** — no custom settings, image optimization domains, or headers configured
- Missing: `images.remotePatterns` for flagcdn.com (relies on `unoptimized` prop)

### Metadata / SEO
- **Root layout**: Full `Metadata` object with title template (`%s | VisualClimate`), description, keywords, OpenGraph, Twitter card, robots
- **Per-page metadata**: Every page uses `createMetaTags()` or exports `metadata`
- **JSON-LD**: WebSite schema on homepage, Dataset schema on country pages
- **Canonical URLs**: Set via `alternates.canonical` in MetaTags

### Sitemap
- `src/app/sitemap.ts` generates entries for:
  - Static routes: `/`, `/dashboard`, `/compare`, `/library`, `/guides`, 2 guide sub-pages
  - Dynamic routes: `/country/KOR`, `/country/USA`, `/country/DEU`, `/country/BRA`, `/country/NGA`, `/country/BGD`
- **Missing from sitemap**: `/insights`, `/insights/emissions-trend`, `/insights/climate-vulnerability`, `/posters`

### Analytics
- **No analytics configured** — no Google Analytics, Vercel Analytics, or any tracking code
- `robots.txt` exists in `/public/` — allows crawling

### Performance Notes
- All server pages use `force-dynamic` — no ISR or static generation
- No `loading.tsx` or `error.tsx` pages for any route
- Flag images use `unoptimized` — bypasses Next.js Image optimization

---

## 13. Improvement Opportunities

### Quick Fixes (can do now)

| Priority | Issue | Fix |
|----------|-------|-----|
| High | Library cards not clickable | Add `url` field to REPORTS array, wrap cards in `<a>` |
| High | Sitemap missing routes | Add `/insights`, `/insights/emissions-trend`, `/insights/climate-vulnerability`, `/posters` |
| Medium | Remove duplicate layout components | Delete `src/components/layout/Header.tsx` and `Footer.tsx` |
| Medium | Remove unused packages | Uninstall `d3-sankey`, `@types/d3-sankey`, `react-markdown` |
| Medium | DonutChart dark theme colors | Update `text-slate-400`/`text-slate-300` to light theme variables |
| Low | HomeCharts.tsx empty file | Delete or implement |
| Low | No loading/error states | Add `loading.tsx` and `error.tsx` to route segments |

### Features from Existing Code/Data

| Opportunity | Data Available | Implementation |
|-------------|----------------|----------------|
| EMBER.CARBON.INTENSITY chart | 144 rows, 2000-2023, 6 countries | Add to country profile or dashboard |
| DERIVED.CO2_PER_GDP chart | 144 rows, 2000-2023, 6 countries | Add to country decoupling section |
| WorldMap component | Component ready, 250 countries in DB | Add to homepage or dashboard |
| ClimateStripes on homepage | Component ready, data fetched | Fix SSR issue, re-enable import |
| ClimatePoster on country pages | Component ready | Fix D3 SSR issue (use `dynamic()` with `ssr: false`) |
| derived-methodology.md | Written content | Create /methodology page or section |
| LineChart generic component | Component ready | Use for time series on dashboard |

### Traffic / Growth Opportunities

| Strategy | Effort | Impact |
|----------|--------|--------|
| Add Vercel Analytics | Low (1 line) | Track engagement, identify popular charts |
| OG images for social sharing | Medium | Dramatically improve LinkedIn click-through |
| ISR instead of force-dynamic | Medium | Faster page loads, lower Supabase costs |
| Add `loading.tsx` skeletons | Low | Better perceived performance |
| Enable Next.js Image optimization | Low | Add flagcdn.com to remotePatterns |
| More SEO guides | Medium | Long-tail search traffic |
| PNG watermark as social proof | Low | "visualclimate.org" already on charts |
