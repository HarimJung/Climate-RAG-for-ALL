# VisualClimate — CLAUDE.md

## Mission
Climate data wiki. Pilot 6 → 200 countries.

## Role Split
Claude = execution (schema, ETL, components, D3, build, deploy, git)
Antigravity = research + content → outputs in docs/drafts/*
Claude reads docs/drafts/* but NEVER modifies. Antigravity NEVER touches src/**.
Before broad research: check if Antigravity draft exists in docs/drafts/ first.

## Stack
Next.js 16 App Router | TS strict | Tailwind dark | Supabase PG | D3 client-only | Vercel
MCP: supabase, sequential-thinking, context7

## Code Style
ES modules only | destructured imports | Korean comments: data files & tasks/ only
camelCase (fn/var) | PascalCase (component) | kebab-case (file)
src/components/ | src/app/

## Rules
1. Error → STOP → read exact msg → root cause → fix once. 2 fails → /clear
2. Never re-read same file twice per task
3. Build: src/** or config changed → `npm run build`. SQL/docs only → `npx tsc --noEmit`. Fail = stop
4. Data: source+year+unit required. Log row counts. quality_score<0.70 → block chart
5. Ownership — Claude: src/** .claude/** CLAUDE.md tasks/** | Antigravity: mockups/* docs/drafts/* GEMINI.md
6. Token: large tasks → subagents. Phase switch → /compact. Skills load once per session
7. Tables: IF NOT EXISTS. Never drop data
8. Git: branch `phase-{N}/{feature}` | commit `[Phase X] desc` | no unreviewed merge to main

## Pilots
| ISO3 | ISO2 | Country | Context |
|------|------|---------|---------|
| KOR | KR | South Korea | High-income Asia, energy transition |
| USA | US | United States | Largest historical emitter |
| DEU | DE | Germany | EU leader, Energiewende |
| BRA | BR | Brazil | Tropical forests, LULUCF |
| NGA | NG | Nigeria | Africa's largest economy |
| BGD | BD | Bangladesh | Extreme climate vulnerability |

## Indicators (Phase 1)
| Code | Domain | Unit |
|------|--------|------|
| EN.ATM.CO2E.PC | GHG Emissions | metric tons per capita |
| EG.USE.PCAP.KG.OE | Energy | kg oil equivalent per capita |
| AG.LND.FRST.ZS | Land & Forests | % of land area |
| EN.ATM.PM25.MC.M3 | Physical Risk | µg/m³ |
| NY.GDP.PCAP.CD | Socioeconomic | current USD |

WDI: `https://api.worldbank.org/v2/country/{iso2}/indicator/{code}?format=json&date=2000:2023&per_page=500`

## Data Tiers
T1: Climate TRACE, EDGAR, Climate Watch
T2: WB WDI, Ember, IRENA
T3: ND-GAIN, WB CCKP
T4: UNFCCC NDC, ISSB S2, TCFD, OWID

## Tables
countries | indicators | country_data | reports | report_chunks — all IF NOT EXISTS

## Phases
0:Infra → 1:Data → 2:QA → 3:UI+D3 → 4:Content+SEO → 5:Deploy
Complete each before next. Record in qa-report.md.

## Antigravity Handoff
Claude needs research/copy/mapping → check docs/drafts/ first.
Missing? → request via tasks/requests-to-antigravity.md with: topic, deadline, output format.
Antigravity delivers → Claude reads and implements. Never duplicate work.

## Skills (once per session, on demand)
data-source-catalog | indicator-map | issb-s2-mapping | design-system | country-profile-template
@.claude/skills/{name}/SKILL.md — load before data collection or framework mapping.

## Commands
`npm run build` | `npm run dev` | `npx tsc --noEmit` | `vercel --prod`

## Subagents
14 agents, 5 skills — see tasks/workflow.md. Created per phase.

## Error Recovery
Error → STOP → THINK → FIX → BUILD. 2 fails → /clear.
Success → tasks/lessons.md
