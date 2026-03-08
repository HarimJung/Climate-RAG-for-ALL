---
description: "Generate a 1080x1080 LinkedIn-ready chart card PNG for a country"
argument-hint: "<ISO3> <chart-type> (e.g. KOR emissions, USA energy, DEU decoupling)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# /generate-linkedin-card

Arguments: `$ARGUMENTS`
Parse: first token = ISO3 (uppercase 3-letter), second token = chart-type

## Mission

Create a standalone 1080x1080 LinkedIn card component and render it as a PNG.
The chart must look exactly like the corresponding section on the country page but formatted as a square social card.

## Valid chart-types

| chart-type | Source section | Key data |
|------------|---------------|----------|
| `emissions` | Emissions Trajectory | CO2/capita line + Paris annotation |
| `energy` | Energy Transition | Sankey (fossil/renewable/nuclear) |
| `sectors` | Emission Sources | CTRACE horizontal bar |
| `decoupling` | Economic Decoupling | GDP vs CO2 triple line |
| `vulnerability` | Resilience | Vulnerability scatter |
| `fuel` | Fossil Fuel | Stacked area by fuel type |
| `methane` | Beyond CO2 | Dual Y-axis (CH4 + N2O) |
| `ndc-gap` | NDC Gap | Historical vs target vs projection |
| `kaya` | Kaya Waterfall | LMDI factor decomposition |
| `equity` | Climate Equity | Cumulative CO2 vs vulnerability |

## Steps

### 1. Validate inputs
- Confirm ISO3 exists in `src/lib/constants.ts` (ALL_ISO3 or broader countries table)
- Confirm chart-type is in the valid list above
- If invalid, print available options and stop

### 2. Fetch data
- Read the country page SSR logic (`src/app/country/[iso3]/page.tsx`) to understand data shape
- Use Supabase MCP or `scripts/` to fetch required data for the ISO3
- For JSON-based charts (ndc-gap, kaya, equity), check `public/data/` directory

### 3. Create the card component
- Path: `src/components/cards/<ISO3>-<chart-type>-card.tsx`
- Dimensions: `viewBox="0 0 1080 1080"` for SVG, or 1080x1080 div for HTML
- Layout:
  - Top 120px: country name (Inter 600, 36px) + ISO3 flag emoji + chart title
  - Middle 800px: the chart (reuse existing chart component)
  - Bottom 160px: key stat callout (JetBrains Mono 700) + source label + "visualclimate.org" watermark
- Colors: follow `CLAUDE.md` design rules exactly (white bg, accent colors)
- Font: Inter for text, JetBrains Mono for numbers

### 4. Create a test route (temporary)
- Path: `src/app/card-preview/page.tsx`
- Render the card component at 1080x1080 in a centered container
- This is for visual verification only

### 5. Export instructions
- Document how to use `exportHtmlAsPng()` from `src/lib/exportPng.ts` to save the card
- The function already handles:
  - html2canvas with scale factor
  - White background
  - Watermark stamping ("visualclimate.org | Free version")

### 6. Verify
- Run `npm run build` -- must pass
- Confirm the card component renders without errors

## Rules

- Card must be self-contained (all data passed as props)
- Reuse existing chart components from `src/components/charts/`
- Follow the design system: white bg, no dark backgrounds, Inter + JetBrains Mono fonts
- Watermark is mandatory (handled by exportPng.ts)
- PNG filename format: `{iso3}-{chart-type}-{YYYY-MM-DD}.png`
- All numbers use JetBrains Mono font

## Prohibited

- Dark backgrounds, gradients that obscure readability
- Hardcoding data values -- always fetch from Supabase or JSON
- Creating API routes for card generation (client-side only for now)
- Removing or hiding the watermark
- Using external image generation services
- Fabricating or estimating data -- use only real values
