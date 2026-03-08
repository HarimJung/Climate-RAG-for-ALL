---
description: "Run the full data pipeline to add a new country to VisualClimate"
argument-hint: "<ISO3> (e.g. ARG, THA, POL)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# /add-country

Target country: `$ARGUMENTS` (uppercase ISO3 code)

## Mission

Execute the complete ETL pipeline for one country so it appears on the site with all 10 sections populated.

## Steps

### 1. Validate the ISO3
- Check if the country already exists: query Supabase `countries` table for the ISO3
- If it exists and has data in `country_data`, report current row count and ask whether to re-run
- If it doesn't exist in `countries`, look up the official ISO3 → ISO2 + country name mapping and INSERT into `countries` table first
- Confirm the ISO2 code is correct (needed for World Bank API)

### 2. Run ETL scripts in order

Each script is in `scripts/` and runs via `npx tsx scripts/<name>.ts`.
Pass the ISO3 as an environment variable or argument as each script expects.

| Order | Script | Data loaded | Target indicator_codes |
|-------|--------|-------------|----------------------|
| 1 | `etl-expand-countries.ts` | Country master row | `countries` table |
| 2 | `etl-owid.ts` | OWID 15+ indicators | OWID.* |
| 3 | `etl-climatetrace.ts` | Sector emissions | CTRACE.* |
| 4 | `etl-ember.ts` | Electricity mix | EMBER.* |
| 5 | `etl-ndgain.ts` | Vulnerability & readiness | NDGAIN.* |
| 6 | `etl-additional-indicators.ts` | Derived indicators | DERIVED.* |

Between each script:
- Log the script name + exit code
- Query `SELECT COUNT(*) FROM country_data WHERE country_iso3 = '{ISO3}'`
- Log the running row count

### 3. Generate analysis JSON files

| File | How to generate |
|------|----------------|
| `public/data/ndc-gap/{ISO3}.json` | Run NDC gap analysis script if NDC data available |
| `public/data/kaya/{ISO3}.json` | Run Kaya decomposition if sufficient data (GDP + CO2 + energy + population) |

- Check if the country has enough data before attempting generation
- If data is insufficient, skip with a log note (the UI will gracefully hide the section)

### 4. Data quality check
- Run `npx tsx scripts/qa-data-check.ts` for the country
- Report:
  - Total rows loaded
  - Number of indicator_codes with data
  - Year coverage (min, max, gaps)
  - Any NULL-heavy indicators (> 50% NULL)
- If quality_score < 0.70 for any indicator, flag it

### 5. Verify on site
- Run `npm run build` -- must pass
- Confirm the country page loads: report which of the 10 sections will be populated based on available data
- Print a checklist:
  - [ ] Hero (CO2/capita) -- requires: EN.GHG.CO2.PC.CE.AR5
  - [ ] Emissions trajectory -- requires: EN.GHG.CO2.PC.CE.AR5
  - [ ] Energy transition -- requires: EMBER.RENEWABLE.PCT, EMBER.FOSSIL.PCT
  - [ ] Emission sources -- requires: CTRACE.* (any)
  - [ ] Fossil fuel breakdown -- requires: OWID.COAL_CO2 or similar
  - [ ] Historical responsibility -- requires: OWID.CUMULATIVE_CO2
  - [ ] Beyond CO2 -- requires: OWID.METHANE, OWID.NITROUS_OXIDE
  - [ ] Economic decoupling -- requires: NY.GDP.PCAP.CD + EN.GHG.CO2.PC.CE.AR5
  - [ ] Vulnerability -- requires: NDGAIN.VULNERABILITY, NDGAIN.READINESS
  - [ ] Data sources -- always shown

### 6. Summary
- Print final row count per indicator_code
- List any sections that will be hidden due to missing data
- Suggest next steps (e.g., "risk-profile JSON not generated -- 6-country pilot only")

## Rules

- Date range: 2000-2023 for all sources
- Never fabricate data -- NULL is always acceptable
- One country at a time (batch mode not supported yet)
- Log every API call status and row count
- Retry failed API calls once after 3 seconds, then skip with DATA_NOT_AVAILABLE

## Prohibited

- Modifying ETL scripts to change their core logic
- Inserting data for years outside 2000-2023
- Skipping the quality check step
- Running the pipeline for multiple countries in a single invocation
- Modifying `src/` code (this command is data-only)
- Hardcoding any data values
