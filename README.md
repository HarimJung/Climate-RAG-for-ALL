# VisualClimate 🌍

AI-powered climate data intelligence platform for sustainability professionals.

## Features

- **200 Country Profiles** — Comprehensive climate indicators, emissions data, and policy analysis
- **Interactive Dashboard** — D3.js visualizations of CO2, renewable energy, and climate risks
- **Report Library + RAG** — AI-powered search across IPCC, UNEP, and WMO reports
- **Climate Guides** — Expert guides on data sources and ISSB S2 disclosure
- **Pricing Tiers** — Free → Climate Kit with API access

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL + Auth + pgvector)
- **AI**: OpenAI `text-embedding-3-small` + `gpt-4o-mini`
- **Charts**: D3.js + TopoJSON
- **Payments**: Stripe
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (with pgvector extension)
- OpenAI API key

### Installation

```bash
npm install
cp .env.local.example .env.local
# Fill in your environment variables in .env.local
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Data Seeding

```bash
# 1. Seed country data from REST Countries API
npm run seed:countries

# 2. Fetch World Bank climate indicators
npm run seed:worldbank

# 3. Fetch Climate Watch GHG emissions
npm run seed:climatewatch

# 4. Embed climate reports (requires OpenAI key)
npm run seed:reports
```

### Build

```bash
npm run build
npm run start
```

## Data Sources

| Source | Data | API |
|--------|------|-----|
| [World Bank](https://data.worldbank.org/) | CO2, renewables, GDP, forest area | Free, no auth |
| [Climate Watch](https://www.climatewatchdata.org/) | GHG emissions by sector | Free, no auth |
| [REST Countries](https://restcountries.com/) | Country metadata, flags | Free, no auth |
| [IPCC](https://www.ipcc.ch/) | AR6 reports | PDF |
| [UNEP](https://www.unep.org/) | Emissions Gap Report | PDF |
| [WMO](https://wmo.int/) | State of Global Climate | PDF |

## Deployment

Deploy to Vercel:

```bash
npm run deploy
```

Or use the [Vercel Dashboard](https://vercel.com) for automatic Git-based deployments.

## License

© 2026 VisualClimate. All rights reserved.
