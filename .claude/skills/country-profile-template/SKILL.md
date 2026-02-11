# Country Profile Template

## URL Pattern
`/country/{iso3}` -> e.g., `/country/KOR`

## Page Sections (top to bottom)

### 1. Hero Header
- Country name (English + local name)
- Flag icon
- Key stat: Total GHG emissions (latest year)
- Key stat: ND-GAIN score
- Key stat: Renewable energy share

### 2. Emissions Overview
- **Line chart**: CO2 per capita trend (2000-2023)
- **Donut chart**: Emissions by sector (latest year)
- **Stat cards**: Total GHG, YoY change, emissions intensity

### 3. Energy Profile
- **Stacked area chart**: Electricity mix over time
- **Bar chart**: Renewable capacity by type (solar/wind/hydro)
- **Stat cards**: Energy use per capita, renewable share, energy intensity

### 4. Socioeconomic Context
- **Stat cards**: GDP, GDP per capita, population, urban %, HDI
- **Line chart**: GDP vs emissions (dual axis)

### 5. Climate Risk & Vulnerability
- **Radar chart**: ND-GAIN 6-sector vulnerability
- **Stat cards**: Overall score, vulnerability, readiness
- **Risk table**: Top physical risks with severity

### 6. Policy & NDC Status
- **Info cards**: NDC target, target year, net-zero year
- **Progress indicator**: Current trajectory vs NDC target
- **Tags**: Carbon pricing type, climate law status

### 7. Framework Mapping
- **ISSB S2 coverage**: Pillar-by-pillar completion %
- **TCFD alignment**: 4-pillar visual
- **SDG 13 indicator table**

### 8. Data Sources & Methodology
- Table of all indicators used on this page
- Source, access date, license for each
- Link to full data download

## Data Binding Pattern (Next.js)
```tsx
// src/app/country/[iso3]/page.tsx
export default async function CountryPage({ params }: { params: { iso3: string } }) {
  const { iso3 } = params;
  // Fetch from Supabase via server component
  // Pass data to client chart components as props
}
```

## Component File Structure
```
src/components/country/
├── CountryHero.tsx
├── EmissionsOverview.tsx
├── EnergyProfile.tsx
├── SocioeconomicContext.tsx
├── ClimateRisk.tsx
├── PolicyStatus.tsx
├── FrameworkMapping.tsx
└── DataSources.tsx
```
