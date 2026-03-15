---
description: "Generate a LinkedIn card + 3 caption variants for a country's most interesting data"
argument-hint: "<ISO3> (e.g. KOR, USA, DEU, BRA, IND, CHN)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# /daily-content

Target country: `$ARGUMENTS`

## Mission

Generate a ready-to-post LinkedIn content package: one chart card PNG and three caption variants, picking the most compelling data story for the given country.

## Steps

### 1. Fetch country data
- Query Supabase for the country's key metrics:
  - CO2 per capita (latest + trend)
  - Renewable energy percentage
  - Grade (A+ to F) and climate class (Changer/Starter/Talker)
  - 5 domain scores (Emissions, Energy, Economy, Responsibility, Resilience)
  - NDC target vs actual emissions (if available in `public/data/ndc-gap/`)
  - Kaya decomposition (if available in `public/data/kaya/`)
- Read the country's data from `src/lib/constants.ts` for grade and classification

### 2. Pick the most interesting chart type
Rank by newsworthiness and select the best one:

| Priority | Condition | Chart type |
|----------|-----------|------------|
| 1 | NDC gap > 20% | `paris-gap` |
| 2 | Renewable % changed > 10pp in 5 years | `energy-mix` |
| 3 | CO2/capita dropped > 15% in decade | `emissions` |
| 4 | Kaya data shows clear driver | `transition-race` |
| 5 | High vulnerability + low readiness | `carbon-inequality` |
| 6 | Default | `emissions` |

### 3. Generate the LinkedIn card
- Use the existing LinkedIn card system at `src/components/linkedin/`
- Or use the poster components at `src/components/posters/`
- Render at 1080x1080 dimensions
- Ensure white background, Inter + JetBrains Mono fonts, watermark included

### 4. Generate 3 caption variants
Follow the LinkedIn caption structure from CLAUDE.md section 13:

**Variant 1 — Data Drop** (short, punchy)
- Hook: one surprising number
- Data: 2-3 supporting facts
- So What: one-sentence implication
- CTA: "Search your country at visualclimate.org"
- Hashtags: #ClimateData #[CountryName] #ParisAgreement

**Variant 2 — Country Spotlight** (narrative)
- Hook: question about the country
- Data: 3-4 data points telling a story
- So What: what this means for the country's climate future
- CTA: "Download the full report card"
- Hashtags: #ClimateAction #DataVisualization #[Region]

**Variant 3 — Controversy/Comparison** (engagement-optimized)
- Hook: provocative comparison or contrast
- Data: comparative stats (vs global average, vs neighbors, vs pledges)
- So What: challenge to the audience
- CTA: "How does YOUR country compare?"
- Hashtags: #ClimateAccountability #NDC #NetZero

### 5. Output
- Print the selected chart type and why it was chosen
- Print the 3 caption variants, clearly labeled
- Print instructions for generating the PNG if not auto-generated

## Rules

- All data must be real -- fetched from Supabase or JSON files
- Captions must be under 3000 characters (LinkedIn limit)
- Hashtags: 3-5 per caption, relevant to the content
- Follow CLAUDE.md section 13 content strategy exactly
- Country name must be the common English name, not the ISO3 code

## Prohibited

- Fabricating or estimating data points
- Using data not in the database or JSON files
- Creating captions that are misleading or out of context
- Dark backgrounds on the card
- Removing the watermark
