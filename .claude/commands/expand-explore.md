---
description: "Expand the Explore page to show all 250 countries with complete data coverage"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# /expand-explore

## Mission

Expand the Explore page from its current limited country set to show all 250 countries with data, adding filters and Compare integration as specified in CLAUDE.md section 4-3.

## Steps

### 1. Read current implementation
- Read `src/app/explore/page.tsx` and any client component (e.g. `ExploreClient.tsx`)
- Identify how countries are currently loaded (hardcoded list? limited query? pagination?)
- Count how many countries currently appear

### 2. Check data coverage in Supabase
- Query `countries` table for total count
- Query `country_data` for key indicators per country:
  - `WDI.CO2_CAPITA` (CO2 per capita)
  - `EMBER.RENEWABLE_PCT` (renewable energy %)
  - `WDI.GDP_CAPITA` (GDP per capita)
  - `NDGAIN.READINESS` (resilience readiness)
- Count countries with complete data vs partial data vs no data

### 3. Identify data gaps
- List countries missing key indicators
- Check if ETL scripts can fill the gaps:
  - `scripts/etl-expand-countries.ts`
  - `scripts/etl-owid.ts`
  - `scripts/etl-ember.ts`
  - `scripts/etl-ndgain.ts`
  - `scripts/etl-additional-indicators.ts`

### 4. Fill data gaps
- Run relevant ETL scripts to expand coverage
- Run `scripts/calculate-scores.ts` (or equivalent) to compute grades and classifications
- Verify new data is in Supabase

### 5. Update the Explore page
- Ensure the page queries all 250 countries (remove any hardcoded limits)
- Add filters per CLAUDE.md section 4-3: region, income level, grade, classification (Changer/Starter/Talker)
- Add sortable columns: country name, grade, classification, overall score, 5 domain scores
- Add checkbox selection for Compare integration (2-4 countries)
- Add CSV download button

### 6. Verify
- Run `npx next build` -- must pass
- Confirm the page loads with the expanded dataset
- Report: X countries before, Y countries after, data coverage percentage

## Rules

- All data must come from Supabase or JSON files -- no hardcoded country data
- Follow CLAUDE.md design system (white bg, Inter font, color palette)
- Table must be performant with 250 rows (virtual scrolling if needed)
- Each country name must link to its Report Card (`/report/[ISO3]`)

## Prohibited

- Hardcoding country data or scores
- Removing existing Explore page features
- Adding dark backgrounds or dark theme elements
- Creating new database tables without confirmation
