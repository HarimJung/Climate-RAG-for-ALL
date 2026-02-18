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


아래 항목을 전부 조사해서 마크다운 리포트로 출력해. 파일로 저장하지 말고 터미널에 출력만 해.

1. 현재 프로젝트 파일 구조 (src/, .claude/, data/, tasks/, docs/ 트리)
2. Supabase 테이블 목록과 각 테이블 row count (SELECT COUNT(*) FROM countries; SELECT COUNT(*) FROM indicators; SELECT COUNT(*) FROM country_data;)
3. .claude/agents/ 폴더의 에이전트 목록 (파일명 + 첫 3줄)
4. .claude/skills/ 폴더의 스킬 목록 (파일명 + 첫 3줄)
5. qa-report.md 전체 내용
6. tasks/data-pipeline-log.md 전체 내용
7. tasks/lessons.md 전체 내용
8. git log --oneline -20 (최근 커밋 20개)
9. package.json의 dependencies 목록
10. data/ 폴더 내용물