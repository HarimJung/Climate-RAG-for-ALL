---
description: "Generate 3 LinkedIn caption variants for a country chart card"
argument-hint: "<ISO3> <chart-type> (e.g. KOR emissions, USA energy, DEU decoupling)"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---

# /linkedin-caption

Arguments: `$ARGUMENTS`
Parse: first token = ISO3, second token = chart-type

## Mission

Generate 3 LinkedIn caption variants (short/medium/long) for a specific country + chart combination. Captions must be data-driven, using real numbers from Supabase and analysis JSON files. The goal is maximizing engagement when the chart PNG is shared on LinkedIn.

## Valid chart-types

Same as `/generate-linkedin-card`: `emissions`, `energy`, `sectors`, `decoupling`, `vulnerability`, `fuel`, `methane`, `ndc-gap`, `kaya`, `equity`

## Steps

### 1. Validate inputs
- Confirm ISO3 is valid (check `src/lib/constants.ts` or `countries` table)
- Confirm chart-type is in the valid list
- If invalid, print available options and stop

### 2. Fetch real data
- Read the country's data from Supabase `country_data` for relevant indicators
- Read from `data/analysis/emissions-trend-6countries.json` if ISO3 is a pilot country
- Read from `data/analysis/risk-profile-{ISO3}.json` if available
- Read from `public/data/ndc-gap/{ISO3}.json`, `public/data/kaya/{ISO3}.json` if relevant
- Extract the 3-5 key numbers that tell the story for this chart-type

### 3. Generate captions

For each variant, output a ready-to-paste caption block:

#### Variant A: Hook-first (short, 2-3 sentences)
- Open with a surprising number or contrarian take
- One sentence of context
- CTA: "Full profile at visualclimate.org/country/{iso3}"
- 3-5 hashtags
- Target: < 200 characters before hashtags

#### Variant B: Story arc (medium, 4-6 sentences)
- Open with a question or bold claim
- 2-3 sentences building the story with data points
- Insight or "so what?" conclusion
- CTA + link
- 5-7 hashtags
- Target: 300-500 characters before hashtags

#### Variant C: Thread-starter (long, 8-10 sentences)
- Open with attention-grabbing hook
- 3-4 data points with context and comparison (e.g., vs world average, vs peer countries)
- Analysis paragraph: what does this mean?
- Forward-looking statement
- CTA + link
- 7-10 hashtags
- Target: 800-1200 characters before hashtags

### 4. Data reference table
- Below the captions, print a reference table of all numbers used:

```
| Metric | Value | Source | Year |
|--------|-------|--------|------|
| CO2/capita | 11.6t | WDI | 2023 |
```

This ensures all numbers are traceable and verifiable.

### 5. Output format

Print all three variants clearly separated:

```
=== VARIANT A (Short) ===
{caption}

=== VARIANT B (Medium) ===
{caption}

=== VARIANT C (Long) ===
{caption}

=== DATA REFERENCES ===
{table}
```

## Caption rules

- Every number must come from real data (Supabase or JSON). Never fabricate.
- Use the country's common English name, not the ISO3 code
- Include the chart's source (e.g., "Data: World Bank WDI, 2023")
- Include "visualclimate.org" link in every caption
- Use Unicode subscripts for chemical formulas: CO₂, CH₄, N₂O
- Round numbers for readability: 11.6t not 11.5827t
- Compare to meaningful benchmarks: world average, peer group, Paris Agreement targets

## Tone guidelines

- Authoritative but accessible (data journalism, not academic)
- No alarmism or doom language -- let the numbers speak
- No political statements or policy recommendations
- Framing: "Here's what the data shows" not "This country must..."
- Allowed hooks: questions, surprising comparisons, trend reversals, milestones

## Hashtag bank (pick relevant ones)

`#ClimateData` `#ClimateAction` `#Sustainability` `#ESG` `#NetZero`
`#EnergyTransition` `#Decarbonization` `#ParisAgreement` `#ISSB`
`#ClimateRisk` `#RenewableEnergy` `#CarbonEmissions` `#DataVisualization`
`#ClimateFinance` `#SDGs` `#GreenEnergy` `#ClimateTech`

Country-specific: `#{CountryName}` `#{CountryName}Climate`

## Prohibited

- Fabricating any numbers or statistics
- Political opinions, policy advocacy, or blame language
- Mentioning competitors or other data platforms
- Using emojis in the caption body (hashtags area only)
- Promising future predictions ("emissions WILL drop by...")
- Modifying any source files or data
