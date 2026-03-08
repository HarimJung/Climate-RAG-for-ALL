---
description: "Audit data quality across Supabase + local JSON for all or one country"
argument-hint: "[ISO3] (optional -- omit for full audit, or e.g. KOR for single country)"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---

# /data-audit

Target: `$ARGUMENTS` (if empty, audit all countries)

## Mission

Run a comprehensive data quality audit across Supabase `country_data` and local JSON analysis files. Produce a quality report with actionable findings.

## Steps

### 1. Scope determination
- If ISO3 argument provided: audit that single country
- If no argument: audit all countries in `countries` table
- Log the scope: "Auditing {N} countries, {M} indicator codes"

### 2. Supabase completeness audit
- For each country in scope, query all rows from `country_data`
- Build a matrix: country x indicator_code x year_coverage
- Check against the 15 expected indicator_codes (from CLAUDE.md section 5):

| indicator_code | Required | Expected years |
|----------------|----------|----------------|
| EN.GHG.CO2.PC.CE.AR5 | Critical | 2000-2023 |
| NY.GDP.PCAP.CD | Critical | 2000-2023 |
| EMBER.RENEWABLE.PCT | Critical | 2015-2023 |
| EMBER.FOSSIL.PCT | Yes | 2015-2023 |
| EMBER.CARBON.INTENSITY | Yes | 2015-2023 |
| NDGAIN.VULNERABILITY | Critical | 2010-2022 |
| NDGAIN.READINESS | Critical | 2010-2022 |
| AG.LND.FRST.ZS | Optional | 2000-2020 |
| EG.USE.PCAP.KG.OE | Optional | 2000-2020 |
| EN.ATM.PM25.MC.M3 | Optional | 2010-2020 |
| CT.GHG.TOTAL | Yes | 2010-2023 |
| DERIVED.CO2_PER_GDP | Yes | 2000-2023 |
| DERIVED.DECOUPLING | Yes | 2005-2023 |
| DERIVED.EMISSIONS_INTENSITY | Optional | 2000-2023 |
| DERIVED.ENERGY_TRANSITION | Optional | 2015-2023 |

- Flag: missing critical indicators, year gaps > 2 years, NULL-heavy series (> 50%)

### 3. Cross-source validation
- Compare CO2/capita: WDI (EN.GHG.CO2.PC.CE.AR5) vs OWID consumption-based
- Compare GHG totals: CT.GHG.TOTAL vs OWID.TOTAL_GHG
- Flag deviations > 30% for the same year

### 4. Outlier detection
- For each indicator series, compute mean and standard deviation
- Flag values > 3 standard deviations from the country mean
- Flag year-over-year changes > 50% (except for volatile indicators like GDP)

### 5. Local JSON audit
- Check `data/analysis/emissions-trend-6countries.json`: verify all 6 pilot countries present
- Check `data/analysis/risk-profile-{ISO3}.json`: verify files exist for KOR, USA, DEU, BRA, NGA, BGD
- Check `public/data/ndc-gap/*.json`: count files, verify JSON structure (historical, target, projection arrays)
- Check `public/data/kaya/*.json`: count files, verify JSON structure (waterfall array)
- Check `public/data/equity-scatter.json`: verify countries array and required fields
- Flag any JSON files with empty arrays or missing required keys

### 6. Compute quality scores
- Per country:
  - `completeness` = (non-null values) / (total expected values) [weight: 0.40]
  - `consistency` = 1 - (avg cross-source deviation) [weight: 0.35]
  - `outlier_score` = 1 - (outlier_count / total_count) [weight: 0.25]
  - `quality_score` = weighted sum
- Flag countries with `quality_score < 0.70`

### 7. Generate report
- Write findings to `data/quality-reports/audit-{YYYY-MM-DD}.md`
- Report format:

```markdown
# Data Quality Audit -- {date}
## Scope: {N} countries, {M} indicators

### Summary
- Countries audited: {N}
- Overall quality score: {avg}
- Flagged countries: {list}

### Completeness Matrix
| Country | Critical (5) | Required (4) | Optional (6) | Score |
|---------|-------------|-------------|--------------|-------|

### Cross-source Deviations
| Country | Year | WDI CO2 | OWID CO2 | Deviation |
|---------|------|---------|----------|-----------|

### Outliers Detected
| Country | Indicator | Year | Value | Reason |
|---------|-----------|------|-------|--------|

### JSON File Status
| File | Status | Issues |
|------|--------|--------|

### Recommendations
- {actionable items}
```

## Rules

- Read-only audit -- never modify data in Supabase or JSON files
- Quality score formula matches `data-quality-auditor` agent specification
- All findings must include specific country, indicator, year, and value
- Timestamps in UTC

## Prohibited

- Modifying any data (Supabase INSERT/UPDATE/DELETE)
- Modifying any source code or JSON files
- Fabricating quality scores or skipping checks
- Running ETL scripts (use `/add-country` for that)
- Deleting or overwriting previous audit reports
