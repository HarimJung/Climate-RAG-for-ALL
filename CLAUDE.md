# VisualClimate — System Context

## Mission
세계 수준의 기후 데이터 위키피디아. 6개국 파일럿(KOR, USA, DEU, BRA, NGA, BGD) → 200개국 확장.

## Tech Stack
- Next.js 16 (App Router), TypeScript strict, Tailwind CSS (dark theme)
- Supabase (PostgreSQL) via Supabase MCP
- D3.js for charts (client-only, no SSR), Vercel for deployment
- MCP Servers: supabase, sequential-thinking, context7

## Code Style
- ES modules (import/export), no CommonJS
- Destructure imports: `import { useState } from 'react'`
- Components → `src/components/`, Pages → `src/app/`
- Korean comments: data files & tasks/ only. English for all code.
- camelCase (functions/vars), PascalCase (components), kebab-case (files)

## Absolute Rules

1. **STOP and THINK**: Error → read message exactly → analyze root cause → fix once. 2 failures → `/clear` + new prompt.
2. **Read once**: Never re-read the same file twice in one task. Delegate to subagent if needed.
3. **Build always**: Run `npm run build` after every code change. Do not proceed if build fails.
4. **Data integrity**: Every data point needs source, year, unit. Log row counts after insertion. `quality_score < 0.70` → block chart rendering.
5. **File ownership**: Claude Code owns `src/**`, `.claude/**`, `CLAUDE.md`, `tasks/**`. Antigravity owns `mockups/*`, `docs/drafts/*`, `GEMINI.md`. Never cross boundaries.
6. **Token discipline**: Large tasks → subagents. Phase switch → `/clear`. Heavy context → `/compact`.
7. **Tables**: Always `IF NOT EXISTS`. Never drop existing data.
8. **Git**: Commit message `[Phase X] description`. Branch `phase-{N}/{feature}`. No unreviewed merges to main.

## Pilot Countries

| ISO3 | ISO2 | Country | Why |
|------|------|---------|-----|
| KOR | KR | South Korea | High-income Asia, energy transition |
| USA | US | United States | Largest historical emitter |
| DEU | DE | Germany | EU leader, Energiewende |
| BRA | BR | Brazil | Tropical forests, LULUCF |
| NGA | NG | Nigeria | Africa's largest economy |
| BGD | BD | Bangladesh | Extreme climate vulnerability |

## Key Indicator Codes (Phase 1)

| Code | Domain | Unit |
|------|--------|------|
| EN.ATM.CO2E.PC | GHG Emissions | metric tons per capita |
| EG.USE.PCAP.KG.OE | Energy | kg oil equivalent per capita |
| AG.LND.FRST.ZS | Land & Forests | % of land area |
| EN.ATM.PM25.MC.M3 | Physical Risk | micrograms per cubic meter |
| NY.GDP.PCAP.CD | Socioeconomic | current USD |

## Data Sources (Priority)
1. **Tier 1 Emissions**: Climate TRACE, EDGAR JRC, Climate Watch
2. **Tier 2 Energy/Economy**: World Bank WDI, Ember, IRENA
3. **Tier 3 Vulnerability**: ND-GAIN, World Bank CCKP
4. **Tier 4 Policy**: UNFCCC NDC, ISSB/IFRS S2, TCFD, Our World in Data

WDI API: `https://api.worldbank.org/v2/country/{iso2}/indicator/{code}?format=json&date=2000:2023&per_page=500`

## Key Tables (Supabase)
countries, indicators, country_data, reports, report_chunks — all with `IF NOT EXISTS`

## Phase Execution

```
Phase 0 → Infra (schema, seed, build)
Phase 1 → Data collection (WDI 6 countries → Supabase)
Phase 2 → QA + Analysis (cross-validation, derived indicators, framework mapping)
Phase 3 → UI + Charts (D3, design system)
Phase 4 → Content + PDF + SEO
Phase 5 → Deploy + Monitoring
```
Complete each phase before moving to next. Record results in `qa-report.md`.

## Error Recovery
```
Error → STOP (read) → THINK (root cause) → FIX ONCE → BUILD
  → Fail twice? → /clear → new prompt
  → Success? → Record in tasks/lessons.md
```

## Build & Dev
```bash
npm run build       # Required after code changes
npm run dev         # Local dev server
npx tsc --noEmit    # Type check only
vercel --prod       # Production deploy
```

## Subagents (14) & Skills (5)
See `tasks/workflow.md` for full agent roster and phase checklists.
Agents are created only when their phase is reached.

## Skills (loaded on demand)
- Data source catalog: @.claude/skills/data-source-catalog/SKILL.md
- Indicator map (50+ indicators): @.claude/skills/indicator-map/SKILL.md
- ISSB S2/TCFD/GRI/SDG mapping: @.claude/skills/issb-s2-mapping/SKILL.md
- Design system tokens: @.claude/skills/design-system/SKILL.md
- Country profile template: @.claude/skills/country-profile-template/SKILL.md

**When collecting data or mapping frameworks, ALWAYS load the relevant skill first.**
