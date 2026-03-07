# VisualClimate — 완전 기술 백과사전
# 버전: 2026-03-06 | 통합 리서치 기반

> 이 문서는 VisualClimate 프로젝트의 모든 기술 구조, 데이터 파이프라인, 컴포넌트, 분석 방법론, 비즈니스 로직, 에이전트 스킬, 기술 부채, 확장 전략을 한 곳에 정리한 단일 진실 출처(Single Source of Truth)입니다.
> 개발자, 데이터 엔지니어, 프로덕트 오너, AI 오케스트레이터 모두를 독자로 상정합니다.

---

## 목차

1. [제품 정의 & 비전](#1-제품-정의--비전)
2. [기술 스택 전체 지도](#2-기술-스택-전체-지도)
3. [시스템 아키텍처 다이어그램](#3-시스템-아키텍처-다이어그램)
4. [디렉토리 구조 & 파일 목록](#4-디렉토리-구조--파일-목록)
5. [데이터베이스 스키마 & 지표 카탈로그](#5-데이터베이스-스키마--지표-카탈로그)
6. [데이터 파이프라인 (ETL 전체)](#6-데이터-파이프라인-etl-전체)
7. [Public 정적 데이터 파일](#7-public-정적-데이터-파일)
8. [페이지 라우트 & 렌더링 전략](#8-페이지-라우트--렌더링-전략)
9. [핵심 제품: CountryClient 10개 섹션](#9-핵심-제품-countryclient-10개-섹션)
10. [차트 컴포넌트 카탈로그](#10-차트-컴포넌트-카탈로그)
11. [UI 시스템 컴포넌트 (climate/)](#11-ui-시스템-컴포넌트-climate)
12. [Posters 시스템](#12-posters-시스템)
13. [등급 & 분류 시스템](#13-등급--분류-시스템)
14. [분석 방법론 (Derived Indicators)](#14-분석-방법론-derived-indicators)
15. [PNG 내보내기 시스템](#15-png-내보내기-시스템)
16. [SEO 시스템](#16-seo-시스템)
17. [에이전트 스킬 목록 & 사용 기록](#17-에이전트-스킬-목록--사용-기록)
18. [비즈니스 모델 & 수익화 구조](#18-비즈니스-모델--수익화-구조)
19. [기술 부채 & 알려진 문제](#19-기술-부채--알려진-문제)
20. [확장 로드맵 & 갭 분석](#20-확장-로드맵--갭-분석)
21. [운영 & 배포](#21-운영--배포)
22. [AI 오케스트레이션 설계 제안](#22-ai-오케스트레이션-설계-제안)

---

## 1. 제품 정의 & 비전

### 한 줄 정의
기후 데이터를 차트와 해석 텍스트로 보여주는 오픈 플랫폼.
사이트의 모든 차트가 곧 LinkedIn 콘텐츠. 별도 콘텐츠 제작 없음.

### 핵심 가치 제안
| 대상 | 문제 | VisualClimate의 해법 |
|------|------|----------------------|
| 기후 전문가 | 데이터 분산, 시각화 부재 | 200+ 국가 × 15+ 지표 × 통합 대시보드 |
| ESG 담당자 | ISSB S2 보고 자료 부족 | 국가 프로파일 + NDC Gap + Kaya 분해 |
| LinkedIn 콘텐츠 크리에이터 | 고품질 기후 그래픽 없음 | 차트 → PNG → 워터마크 → 1분 내 게시 |
| 데이터 저널리스트 | API 접근 복잡 | 깔끔한 웹 UI + 미래 API |

### 성공 지표
사이트에서 뽑은 차트 PNG가 LinkedIn에 올라간 횟수 = **1차 KPI**

### 무엇이 아닌가 (지금은)
- RAG 챗봇 아님 (보고서 1개로는 의미 없음)
- 실시간 데이터 스트리밍 아님 (연간 갱신 모델)
- 유료 로그인 SaaS 아님 (Stripe 미연결 상태)

---

## 2. 기술 스택 전체 지도

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  Next.js 14 App Router  │  TypeScript strict  │  Tailwind CSS 4  │
│  framer-motion 12.34    │  lucide-react 0.575  │  Google Fonts    │
│  Inter (body)           │  JetBrains Mono (numbers/charts)        │
├─────────────────────────────────────────────────────────────────┤
│                        CHARTS & VIZ                              │
│  React SVG (inline, CountryClient) │  D3.js ^7.9 (standalone)   │
│  d3-geo (WorldMap, WorldScoreboard) │  Custom SVG primitives     │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                │
│  Supabase PostgreSQL (@supabase/supabase-js ^2.95)              │
│  Server: createServiceClient (service_role key)                  │
│  Client: createClient (anon key, browser fetch)                  │
├─────────────────────────────────────────────────────────────────┤
│                        EXPORT                                    │
│  html2canvas ^1.4.1 (HTMLElement → PNG)                         │
│  XMLSerializer + Canvas API (SVG → PNG)                         │
│  Watermark: "visualclimate.org | Free version"                   │
├─────────────────────────────────────────────────────────────────┤
│                        STATIC DATA                               │
│  public/data/kaya/*.json      (67개국 Kaya LMDI)                │
│  public/data/ndc-gap/*.json   (200+ 국가 NDC Gap)               │
│  public/data/equity-scatter.json                                 │
│  public/geo/world-110m.json   (D3 GeoJSON)                      │
├─────────────────────────────────────────────────────────────────┤
│                        DEPLOY                                    │
│  Vercel (npx vercel --prod)                                      │
│  Production: https://visualclimate.org                           │
│  Branch: main only                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 패키지 의존성 전체 목록
| 패키지 | 버전 | 용도 |
|--------|------|------|
| next | 14+ (App Router) | 프레임워크 |
| react / react-dom | 18+ | UI |
| typescript | ^5 | 타입 시스템 |
| tailwindcss | ^4 | 스타일링 |
| framer-motion | ^12.34 | 애니메이션 (ScrollFadeIn, SummaryFan, StoryBlock, hero fan) |
| @supabase/supabase-js | ^2.95 | DB 클라이언트 |
| d3 | ^7.9 | 지리 투영, 데이터 변환 |
| d3-geo | ^3.x | WorldMap geoNaturalEarth1 |
| html2canvas | ^1.4.1 | HTML → PNG 내보내기 |
| lucide-react | ^0.575 | 아이콘 (ChevronLeft, ChevronRight 등) |

---

## 3. 시스템 아키텍처 다이어그램

```
                        ┌──────────────────────────────┐
                        │   외부 데이터 소스 (연간 갱신)  │
                        │                              │
                        │  World Bank WDI API          │
                        │  OWID Energy CSV             │
                        │  Ember Global Electricity    │
                        │  ND-GAIN CSV (로컬)          │
                        │  Climate TRACE v7 API        │
                        │  UNFCCC NDC Registry         │
                        └──────────────┬───────────────┘
                                       │ ETL Scripts (npx tsx)
                                       │ scripts/*.ts
                                       ▼
                        ┌──────────────────────────────┐
                        │   Supabase PostgreSQL         │
                        │                              │
                        │   countries (200+ rows)      │
                        │   indicators (15+ rows)      │
                        │   country_data (2016+ rows)  │
                        └──────────────┬───────────────┘
                                       │
              ┌────────────────────────┼──────────────────────┐
              │ SSR (서버)              │                       │ Static JSON
              ▼                        ▼                       ▼
  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
  │  page.tsx (SSR)     │  │ Analysis Scripts    │  │  public/data/        │
  │  /country/[iso3]    │  │ calculate-kaya.ts   │  │  kaya/*.json (67)    │
  │  /compare           │  │ calculate-ndc-gap   │  │  ndc-gap/*.json(200+)│
  │  /explore           │  │ calculate-equity.ts │  │  equity-scatter.json │
  └──────────┬──────────┘  └─────────────────────┘  └──────────────────────┘
             │                                                │
             ▼ props                                          │ fetch()
  ┌─────────────────────┐                                     │
  │  CountryClient.tsx  │◄────────────────────────────────────┘
  │  (CSR hydration)    │
  │  - 10 섹션          │
  │  - 6개 client fetch │
  │  - SVG 차트 인라인  │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  Chart Components   │
  │  ClimateSankey      │
  │  ClimateGap         │
  │  NDCGapChart        │
  │  KayaWaterfall      │
  │  EquityScatter      │
  └─────────────────────┘
```

### 렌더링 패턴 분류
| 패턴 | 파일 | 설명 |
|------|------|------|
| SSR → CSR Hydration | `/country/[iso3]/page.tsx` → `CountryClient.tsx` | 서버에서 핵심 지표 fetch, 클라이언트에서 OWID/CTRACE 추가 fetch |
| Pure SSR | `/compare/page.tsx`, `/explore/page.tsx` | 서버에서 전체 데이터 fetch |
| Static | `/posters/page.tsx`, `/insights/*`, `/guides/*` | 빌드 타임 또는 force-dynamic 없음 |
| Dynamic SSR | `/page.tsx` (홈) | `force-dynamic` + Supabase 실시간 조회 |

---

## 4. 디렉토리 구조 & 파일 목록

```
visualclimate/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # 홈 (629줄) — WorldScoreboard + HeroSearch + 국가카드
│   │   ├── layout.tsx                # 루트 레이아웃 (폰트, 메타)
│   │   ├── sitemap.ts                # 자동 사이트맵 생성
│   │   ├── api/og/route.tsx          # OG 이미지 API
│   │   ├── country/[iso3]/
│   │   │   ├── page.tsx              # SSR 데이터 fetch (589줄)
│   │   │   ├── CountryClient.tsx     # 핵심 제품 (1650줄)
│   │   │   └── error.tsx             # 에러 바운더리 페이지
│   │   ├── compare/
│   │   │   ├── page.tsx              # SSR
│   │   │   └── CompareClient.tsx     # 비교 테이블 UI
│   │   ├── explore/
│   │   │   ├── page.tsx
│   │   │   └── ExploreClient.tsx     # 필터 + 정렬 + 페이지네이션
│   │   ├── posters/
│   │   │   ├── page.tsx
│   │   │   └── PostersClient.tsx     # 포스터 허브 (20개국 × 6 타입)
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── DashboardClient.tsx   # 6개 지표 바차트
│   │   ├── report/
│   │   │   ├── page.tsx              # 리포트 인덱스
│   │   │   ├── ReportIndexClient.tsx
│   │   │   └── [iso3]/
│   │   │       ├── page.tsx
│   │   │       └── ReportCardClient.tsx  # Pentagon 레이더 차트 + 5개 도메인 등급
│   │   ├── insights/
│   │   │   ├── page.tsx              # 인사이트 허브
│   │   │   ├── emissions-trend/
│   │   │   │   ├── page.tsx          # 배출 추세 분석 페이지
│   │   │   │   └── chart.tsx
│   │   │   └── climate-vulnerability/
│   │   │       ├── page.tsx
│   │   │       └── chart.tsx
│   │   ├── guides/
│   │   │   ├── page.tsx
│   │   │   ├── climate-data-sources/page.tsx
│   │   │   └── issb-s2-beginners/page.tsx
│   │   ├── about/page.tsx
│   │   ├── methodology/page.tsx
│   │   ├── learn/page.tsx
│   │   └── library/page.tsx          # 리포트 카탈로그 (링크 미연결)
│   │
│   ├── components/
│   │   ├── charts/                   # 독립 차트 컴포넌트 (D3 + SVG)
│   │   │   ├── ClimateGap.tsx        # Pre/Post Paris slope chart (267줄)
│   │   │   ├── ClimateSankey.tsx     # Sankey 에너지 흐름 (288줄)
│   │   │   ├── NDCGapChart.tsx       # NDC 목표 vs 실제 (238줄)
│   │   │   ├── KayaWaterfall.tsx     # Kaya LMDI waterfall (251줄)
│   │   │   ├── EquityScatter.tsx     # 기후 형평성 산점도 (202줄)
│   │   │   ├── WorldScoreboard.tsx   # D3 세계 지도 (190줄)
│   │   │   ├── ClimateSpiral.tsx     # 기온 스파이럴 (181줄)
│   │   │   ├── ClimateDivide.tsx     # 기후 격차 시각화 (179줄)
│   │   │   ├── WorldMap.tsx          # D3 세계 지도 범용 (172줄)
│   │   │   ├── ClimateStripes.tsx    # 기온 스트라이프 (172줄)
│   │   │   ├── ClimatePoster.tsx     # 포스터용 차트 카드 (229줄)
│   │   │   ├── CountryCard.tsx       # 홈 국가 카드 (154줄)
│   │   │   ├── LineChart.tsx         # 범용 라인차트 (126줄)
│   │   │   └── DonutChart.tsx        # 도넛 차트 (116줄)
│   │   │
│   │   ├── climate/                  # UI 시스템 컴포넌트
│   │   │   ├── index.ts              # barrel export
│   │   │   ├── page-wrapper.tsx      # 최상위 페이지 래퍼
│   │   │   ├── hero-section.tsx      # 히어로 섹션
│   │   │   ├── section-header.tsx    # 섹션 헤더 (category badge + title)
│   │   │   ├── chart-card.tsx        # 차트 카드 컨테이너
│   │   │   ├── story-block.tsx       # Scrollytelling 블록 (text-left/right/full)
│   │   │   ├── scroll-fade-in.tsx    # 뷰포트 진입 fade 애니메이션
│   │   │   ├── summary-fan.tsx       # 3개 카드 부채꼴 레이아웃
│   │   │   └── bento-grid.tsx        # 벤토 그리드 레이아웃
│   │   │
│   │   ├── posters/                  # 포스터 전용 컴포넌트
│   │   │   ├── hero-section.tsx      # 포스터 히어로 (fan 애니메이션)
│   │   │   ├── bento-section.tsx     # 포스터 벤토 그리드
│   │   │   ├── poster-explorer.tsx   # 포스터 탐색기 (grid/carousel)
│   │   │   ├── poster-card.tsx       # 포스터 카드
│   │   │   ├── toolbar.tsx           # 필터/뷰모드 툴바
│   │   │   └── poster-lightbox.tsx   # 라이트박스
│   │   │
│   │   ├── seo/
│   │   │   ├── MetaTags.tsx          # createMetaTags() 헬퍼
│   │   │   └── JsonLd.tsx            # JSON-LD 구조화 데이터
│   │   │
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroSearch.tsx            # 국가 검색 autocomplete
│   │   ├── StatCard.tsx              # 통계 카드
│   │   └── ScrollyScene.tsx          # Scrollytelling wrapper (framer-motion)
│   │
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts             # createClient() — 브라우저용 anon key
│       │   └── server.ts             # createServiceClient() — 서버용 service_role
│       ├── constants.ts              # CLIMATE_INDICATORS, PILOT_ISO3, ALL_ISO3, CHART_COLORS
│       ├── exportPng.ts              # exportSvgAsPng(), exportHtmlAsPng()
│       ├── iso3ToFlag.ts             # ISO3 → 이모지 국기
│       └── utils.ts                 # cn() (clsx + tailwind-merge)
│
├── scripts/                          # ETL + 분석 스크립트 (Node.js/tsx)
│   ├── seed-countries.ts             # countries 테이블 초기화
│   ├── fetch-worldbank.ts            # World Bank API fetch
│   ├── fetch-climatewatch.ts         # ClimateWatch API fetch
│   ├── etl-owid.ts                   # OWID 에너지 데이터
│   ├── etl-ember.ts                  # EMBER 전력 데이터
│   ├── etl-ndgain.ts                 # ND-GAIN 취약성
│   ├── etl-climatetrace.ts           # Climate TRACE v7 섹터
│   ├── etl-climate-trace.ts          # Climate TRACE 추가
│   ├── etl-expand-countries.ts       # 6→20개국 확장
│   ├── etl-additional-indicators.ts  # 파생 지표 추가
│   ├── derived-emissions-intensity.ts# 배출집약도 파생
│   ├── co2-trend-comparison.ts       # 6개국 CAGR 분석 → JSON
│   ├── analysis-classify.ts          # Changer/Starter/Talker 분류
│   ├── analysis-report-card.ts       # 리포트 카드 등급 계산
│   ├── qa-data-check.ts              # 데이터 품질 검증
│   ├── create-ndc-table.ts           # NDC 테이블 생성
│   ├── etl/
│   │   └── collect-ndc-targets.ts    # NDC 목표 수집
│   └── analysis/
│       ├── calculate-kaya.ts         # Kaya LMDI → public/data/kaya/*.json
│       ├── calculate-ndc-gap.ts      # NDC Gap → public/data/ndc-gap/*.json
│       └── calculate-equity.ts       # 형평성 → public/data/equity-scatter.json
│
├── data/                             # 소스 분석 데이터 (Git 관리)
│   ├── analysis/
│   │   ├── emissions-trend-6countries.json  # 6개국 CAGR + Paris 전후 비교
│   │   ├── emissions-trend-6countries.md    # 분석 텍스트 (한국어)
│   │   ├── derived-methodology.md           # 파생 지표 수식/검증
│   │   ├── co2-trend-comparison.md          # 배출 추세 비교 리포트
│   │   ├── risk-profile-KOR.json            # 한국 리스크 프로파일
│   │   ├── risk-profile-USA.json
│   │   ├── risk-profile-DEU.json
│   │   ├── risk-profile-BRA.json
│   │   ├── risk-profile-NGA.json
│   │   └── risk-profile-BGD.json
│   ├── source-registry.json          # 데이터 소스 레지스트리 (현재 비어있음)
│   ├── citations.json                # 인용 정보
│   ├── climate-trace-ghg.json        # Climate TRACE raw
│   ├── ndgain-scores.json            # ND-GAIN raw
│   ├── ember-electricity.json        # EMBER raw
│   └── ndc-targets.json              # 20개국 NDC 목표 (UNFCCC 기반)
│
├── public/
│   ├── geo/
│   │   └── world-110m.json           # D3 세계 지도 GeoJSON (110m 해상도)
│   └── data/
│       ├── kaya/
│       │   ├── {ISO3}.json           # 67개국 Kaya LMDI 분해 결과
│       │   └── summary.json          # 전체 요약
│       ├── ndc-gap/
│       │   └── {ISO3}.json           # 200+ 국가 NDC Gap 분석
│       └── equity-scatter.json       # 형평성 산점도 데이터
│
└── docs/
    └── VISUALCLIMATE_WIKI.md         # 이 문서
```

---

## 5. 데이터베이스 스키마 & 지표 카탈로그

### Supabase 테이블 구조

#### `countries` 테이블
```sql
iso3        TEXT PRIMARY KEY    -- ISO 3166-1 alpha-3 (예: 'KOR')
iso2        TEXT                -- ISO 3166-1 alpha-2 (예: 'KR')
name        TEXT                -- 영문 국가명
region      TEXT                -- 지역 (예: 'Asia', 'Europe')
```
- 총 200+ 행

#### `indicators` 테이블
```sql
code        TEXT PRIMARY KEY    -- indicator_code (예: 'EN.GHG.CO2.PC.CE.AR5')
name        TEXT                -- 지표명 (영문)
unit        TEXT                -- 단위
source      TEXT                -- 데이터 소스
category    TEXT                -- 분류 (emissions/energy/economy 등)
```
- 총 15+ 행

#### `country_data` 테이블 (메인 데이터)
```sql
id              SERIAL PRIMARY KEY
country_iso3    TEXT REFERENCES countries(iso3)
indicator_code  TEXT REFERENCES indicators(code)
year            INTEGER
value           NUMERIC
source          TEXT
```
- 총 2,016+ 행 (20개국 × 15지표 × ~7년)
- 쿼리 패턴: `.eq('indicator_code', code).eq('country_iso3', iso3).order('year')`

### Indicator Code 완전 카탈로그

#### World Bank WDI 지표
| indicator_code | 설명 | 단위 | 앱 사용도 |
|----------------|------|------|-----------|
| `EN.GHG.CO2.PC.CE.AR5` | 1인당 CO2 배출량 (Climate Watch) | t CO2e/capita | **핵심** — 배출 섹션 라인차트 |
| `NY.GDP.PCAP.CD` | 1인당 GDP | US$ | **핵심** — 탈동조화 차트 |
| `EN.ATM.PM25.MC.M3` | PM2.5 연평균 농도 | µg/m³ | 취약성 섹션 |
| `AG.LND.FRST.ZS` | 산림면적 비율 | % of land area | 대시보드만 |
| `EG.USE.PCAP.KG.OE` | 1인당 에너지 사용량 | kg oil eq. | Kaya 분해 인풋 |
| `SP.POP.TOTL` | 인구 | 명 | Kaya 분해 인풋 |

#### Ember 전력 지표
| indicator_code | 설명 | 단위 | 앱 사용도 |
|----------------|------|------|-----------|
| `EMBER.RENEWABLE.PCT` | 재생에너지 전력 비중 | % | **핵심** — Sankey 차트 |
| `EMBER.FOSSIL.PCT` | 화석연료 전력 비중 | % | **핵심** — Sankey 차트 |
| `EMBER.CARBON.INTENSITY` | 전력 탄소집약도 | gCO2/kWh | 미활용 (Kaya 인풋 대기) |

#### Climate TRACE 지표
| indicator_code | 설명 | 단위 | 앱 사용도 |
|----------------|------|------|-----------|
| `CT.GHG.TOTAL` | 총 온실가스 배출 (CTRACE) | Mt CO2e | Beyond CO2 섹션 |
| `CTRACE.POWER` | 전력 섹터 배출 | Mt CO2e | 섹터 바차트 |
| `CTRACE.TRANSPORTATION` | 교통 섹터 배출 | Mt CO2e | 섹터 바차트 |
| `CTRACE.MANUFACTURING` | 제조업 배출 | Mt CO2e | 섹터 바차트 |
| `CTRACE.AGRICULTURE` | 농업 배출 | Mt CO2e | 섹터 바차트 |
| `CTRACE.FOSSIL-FUEL-OPERATIONS` | 화석연료 운영 | Mt CO2e | 섹터 바차트 |
| `CTRACE.BUILDINGS` | 건물 배출 | Mt CO2e | 섹터 바차트 |
| `CTRACE.WASTE` | 폐기물 배출 | Mt CO2e | 섹터 바차트 |
| `CTRACE.FORESTRY` | 산림 (흡수/배출) | Mt CO2e | 섹터 바차트 |
| `CTRACE.MINERAL-EXTRACTION` | 광물 채굴 | Mt CO2e | 섹터 바차트 |

#### OWID (Our World in Data) 지표 — client-side fetch
| indicator_code | 설명 | 단위 | 앱 사용도 |
|----------------|------|------|-----------|
| `OWID.CONSUMPTION_CO2_PER_CAPITA` | 소비 기준 CO2/인 | t | 배출 섹션 (dashed line) |
| `OWID.COAL_CO2` | 석탄 CO2 | Mt | 화석연료 시계열 |
| `OWID.OIL_CO2` | 석유 CO2 | Mt | 화석연료 시계열 |
| `OWID.GAS_CO2` | 가스 CO2 | Mt | 화석연료 시계열 |
| `OWID.CEMENT_CO2` | 시멘트 CO2 | Mt | 화석연료 시계열 |
| `OWID.FLARING_CO2` | 플레어링 CO2 | Mt | 화석연료 시계열 |
| `OWID.CUMULATIVE_CO2` | 누적 CO2 (역사적) | Gt | 역사적 책임 섹션 |
| `OWID.SHARE_GLOBAL_CUMULATIVE_CO2` | 세계 누적 CO2 점유율 | % | 역사적 책임 |
| `OWID.TEMPERATURE_CHANGE_FROM_GHG` | GHG 기인 온도 기여 | °C | Beyond CO2 |
| `OWID.TEMPERATURE_CHANGE_FROM_CO2` | CO2 기인 온도 기여 | °C | Beyond CO2 |
| `OWID.TEMPERATURE_CHANGE_FROM_CH4` | CH4 기인 온도 기여 | °C | Beyond CO2 |
| `OWID.TEMPERATURE_CHANGE_FROM_N2O` | N2O 기인 온도 기여 | °C | Beyond CO2 |
| `OWID.METHANE` | 메탄 배출 | Mt | Beyond CO2 |
| `OWID.NITROUS_OXIDE` | 아산화질소 배출 | Mt | Beyond CO2 |
| `OWID.TOTAL_GHG` | 총 GHG | Gt CO2e | Beyond CO2 |
| `OWID.GHG_PER_CAPITA` | GHG/인 | t CO2e | Beyond CO2 |
| `OWID.CO2_PER_GDP` | GDP당 CO2 | kg/$1000 | 경제 섹션 |

#### ND-GAIN 지표
| indicator_code | 설명 | 범위 | 앱 사용도 |
|----------------|------|------|-----------|
| `NDGAIN.VULNERABILITY` | 기후 취약성 지수 | 0~1 (높을수록 취약) | **핵심** — 취약성 섹션 |
| `NDGAIN.READINESS` | 기후 적응 준비도 | 0~1 (높을수록 준비됨) | **핵심** — 취약성 섹션 |

#### 파생 지표 (Derived)
| indicator_code | 수식 | 단위 | 앱 사용도 |
|----------------|------|------|-----------|
| `DERIVED.CO2_PER_GDP` | CO2/capita ÷ GDP/capita × 1000 | tCO2/$1000 GDP | 경제 섹션 (미활용) |
| `DERIVED.DECOUPLING` | GDP성장률% − CO2성장률% | pp/yr | **핵심** — 탈동조화 |
| `DERIVED.ENERGY_TRANSITION` | EMBER.RENEWABLE.PCT(t) − (t−5) | pp/5yr | 에너지 섹션 |
| `DERIVED.EMISSIONS_INTENSITY` | 배출집약도 | — | 미활용 |
| `DERIVED.CLIMATE_CLASS` | Changer=1 / Starter=2 / Talker=3 | 분류 | 홈 스코어보드 |

---

## 6. 데이터 파이프라인 (ETL 전체)

### ETL 실행 순서 (최초 구축)
```
1. scripts/seed-countries.ts          → countries 테이블 초기 적재
2. scripts/fetch-worldbank.ts         → WDI 지표 fetch
3. scripts/etl-owid.ts                → OWID CSV 파싱 → country_data
4. scripts/etl-ember.ts               → EMBER CSV → RENEWABLE/FOSSIL/CARBON
5. scripts/etl-ndgain.ts              → ND-GAIN CSV → VULNERABILITY/READINESS
6. scripts/etl-climatetrace.ts        → Climate TRACE API → CTRACE.*
7. scripts/etl-additional-indicators.ts → DERIVED.* 계산
8. scripts/etl-expand-countries.ts    → 6→20개국 확장
9. scripts/analysis-classify.ts       → Changer/Starter/Talker 분류
10. scripts/co2-trend-comparison.ts   → data/analysis/*.json 생성
11. scripts/analysis/calculate-kaya.ts    → public/data/kaya/*.json
12. scripts/analysis/calculate-ndc-gap.ts → public/data/ndc-gap/*.json
13. scripts/analysis/calculate-equity.ts  → public/data/equity-scatter.json
```

### ETL 실행 명령
```bash
npx tsx --env-file=.env.local scripts/[script-name].ts
```

### 필요 환경변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 데이터 소스별 API 방식
| 소스 | API 방식 | 포맷 | 비고 |
|------|---------|------|------|
| World Bank WDI | REST API (`api.worldbank.org/v2/`) | JSON | 무료, 페이징 필요 |
| OWID Energy | GitHub CSV (`owid/energy-data`) | CSV | 대용량 (~MB) |
| Ember | GitHub/API CSV | CSV | 연간 릴리즈 |
| ND-GAIN | 로컬 파일 (`/tmp/ndgain/`) | CSV | 매년 수동 다운로드 |
| Climate TRACE | API v7 (`climatetrace.org/api`) | JSON | 섹터별 엔드포인트 |
| UNFCCC NDC | Registry API (현재 unavailable) | JSON | UNFCCC 기준만 사용 |

---

## 7. Public 정적 데이터 파일

### `public/data/kaya/{ISO3}.json` (67개국)
```json
{
  "iso3": "KOR",
  "country_name": "South Korea",
  "period": { "start": 2015, "end": 2023 },
  "co2_start": 680.0,
  "co2_end": 589.0,
  "co2_change": -91.0,
  "factors": {
    "population":       { "contribution": 8.2, "pct": -9 },
    "gdp_per_capita":   { "contribution": 185.3, "pct": -204 },
    "energy_intensity": { "contribution": -167.4, "pct": 184 },
    "carbon_intensity": { "contribution": -117.1, "pct": 129 }
  },
  "biggest_driver": "energy_intensity",
  "biggest_driver_label": "Energy Intensity Decline",
  "residual": 0.0,
  "residual_pct": 0.0,
  "confidence": "HIGH",
  "waterfall": [ ... ]
}
```
**커버리지**: ALB, ARG, AUS, AUT, AZE, BEL, BGR, BIH, BRA, CAN, CHE, CHL, CHN, COL, CRI, CYP, CZE, DEU, DNK, DZA, EGY, ESP, EST, FIN, FRA, GBR, GEO, GRC, HND, HRV, HUN, IDN, IND, IRL, ISL, ISR, ITA, JPN, KAZ, KEN, KOR, LTU, LUX, LVA, MAR, MDA, MEX, MKD, MLT, MUS, NLD, NOR, NZL, POL, PRT, PRY, ROU, SEN, SGP, SUR, SVK, SVN, SWE, THA, TUR, USA, ZAF

### `public/data/ndc-gap/{ISO3}.json` (200+ 국가)
```json
{
  "iso3": "KOR",
  "country_name": "South Korea",
  "historical": [ { "year": 2000, "value": 9.9 }, ... ],
  "projection": [ { "year": 2024, "value": 11.0 }, ... ],
  "confidence_band": [ { "year": 2024, "upper": 11.5, "lower": 10.5 }, ... ],
  "ndc_target": {
    "year": 2030, "value": 7.15,
    "pct_reduction": 40, "reference_year": 2018
  },
  "gap": 3.85,
  "gap_pct": 35.0,
  "achievement_probability": 0.22,
  "cagr_2015_2023": -1.245,
  "status": "off_track"
}
```

### `public/data/equity-scatter.json`
```json
{
  "metadata": {
    "country_count": N,
    "median_cumulative_co2_pc": X,
    "median_vulnerability": Y
  },
  "quadrant_summary": {
    "Historical Polluter": N,
    "Climate Victim": N,
    "Double Burden": N,
    "Low Impact": N
  },
  "countries": [
    {
      "iso3": "KOR",
      "name": "South Korea",
      "cumulative_co2_per_capita": 350.0,
      "vulnerability": 0.357,
      "current_co2_pc": 11.4,
      "quadrant": "Historical Polluter"
    }, ...
  ]
}
```

### `data/analysis/emissions-trend-6countries.json`
- **생성**: `scripts/co2-trend-comparison.ts`
- **내용**: 6개국 (KOR/USA/DEU/BRA/NGA/BGD) CAGR, 파리협정 전후 비교, 탈동조화 랭킹
- **키 구조**: `cagr_2000_2023`, `pre_paris_vs_post_paris`, `decoupling_ranking`, `transition_ranking`

### `data/analysis/risk-profile-{ISO3}.json` (6개국)
```json
{
  "iso3": "KOR",
  "country": "South Korea",
  "generated": "2026-02-16",
  "risk_level": "medium",
  "ndgain": {
    "vulnerability": 0.3567,
    "readiness": 0.7223,
    "vulnerability_trend": "improving",
    "readiness_trend": "improving"
  },
  "key_vulnerabilities": [ "화석연료 전력 의존도 높음 (61.2%)", ... ],
  "strengths": [ "높은 기후 적응 준비도 (0.72)", ... ],
  "indicators_snapshot": { ... },
  "summary": "한국은 ..."
}
```

---

## 8. 페이지 라우트 & 렌더링 전략

### 핵심 페이지

| 라우트 | 컴포넌트 | 렌더링 | 데이터 소스 |
|--------|---------|--------|------------|
| `/` | `page.tsx` | `force-dynamic` SSR | Supabase (stats, class counts, insights) |
| `/country/[iso3]` | `page.tsx` + `CountryClient.tsx` | SSR → CSR hydration | Supabase (SSR) + OWID/CTRACE (CSR) |
| `/compare` | `CompareClient.tsx` | SSR | Supabase (CLIMATE_INDICATORS 기준) |
| `/explore` | `ExploreClient.tsx` | SSR → 필터/정렬 CSR | Supabase |
| `/posters` | `PostersClient.tsx` | CSR + Supabase fetch | Supabase (실시간) + 하드코딩 fallback |

### 보조 페이지

| 라우트 | 설명 | 상태 |
|--------|------|------|
| `/dashboard` | 6개 지표 바차트 | 작동 |
| `/report/[iso3]` | Pentagon 레이더 + 5도메인 등급 | 작동 |
| `/insights` | 2개 분석 아티클 | Static |
| `/guides` | SEO 가이드 2편 | Static, 작동 |
| `/library` | 리포트 카탈로그 | 링크 미연결 |
| `/methodology` | 방법론 설명 | Static |
| `/about`, `/learn` | 정보 페이지 | Static |

### 비활성 페이지
`/chat`, `/pricing`, `/login`, `/signup` — 유료화 시점까지 보류

---

## 9. 핵심 제품: CountryClient 10개 섹션

`src/app/country/[iso3]/CountryClient.tsx` (1650줄) — 이 파일이 VisualClimate의 심장

### props 인터페이스 (`CountryClientProps`)
```typescript
{
  countryName: string;
  iso3: string;
  wbCo2Series: { year: number; value: number }[];
  co2Comparison: { year: number; wb: number; ct: number }[];
  gdpVsCo2: { year: number; gdp: number; co2: number }[];
  emberMix: { renewable: number; fossil: number; other: number; year: number } | null;
  renewableChange: number | null;           // 5년 변화 pp
  scatterData: { iso3; name; vulnerability; readiness }[];
  decouplingSeries: { year: number; value: number }[];
  decouplingScore: number | null;
  pm25?: number | null;
  carbonIntensity?: number | null;
  initialExtra?: ExtraData;               // SSR pre-fetched OWID data
  climateGapData?: CountryCagr[];
}
```

### ExtraData (클라이언트 fetch)
```typescript
{
  consumptionCo2: TimeSeriesPoint[];      // OWID.CONSUMPTION_CO2_PER_CAPITA
  ctraceByCode: Record<string, number>;   // CTRACE.* 최신값
  ctraceYear: number | null;
  fuelSeries: Record<string, TimeSeriesPoint[]>; // OWID.*_CO2 연료별
  cumulativeCo2: number | null;           // OWID.CUMULATIVE_CO2
  shareCumulative: number | null;         // OWID.SHARE_GLOBAL_CUMULATIVE_CO2
  tempGhg/Co2/Ch4/N2o: number | null;    // 온도 기여
  methaneSeries: TimeSeriesPoint[];
  n2oSeries: TimeSeriesPoint[];
  totalGhgLatest: number | null;
  ghgPerCapitaLatest: number | null;
  co2PerGdpSeries: TimeSeriesPoint[];
}
```

### 10개 섹션 상세

| # | 섹션 | 주요 차트/UI | 데이터 소스 | 인사이트 텍스트 |
|---|------|------------|------------|----------------|
| 1 | **Hero** | 국기, 국가명, 등급 배지, 취약성 배지, StatPill | SSR props | 없음 |
| 2 | **Emissions** | `EmissionsLineChart` (production + consumption), `ClimateGap` | WB + OWID (CSR) | CAGR, Paris 전후 비교 (JSON) |
| 3 | **Energy Mix** | `ClimateSankey` (fossil/renewable/nuclear) | EMBER (SSR) | Renewables Progress |
| 4 | **Emission Sources** | `HorizontalBarChart` (9개 CTRACE 섹터) | CTRACE (CSR) | 섹터별 비중 |
| 5 | **Fossil Fuel** | 스택 에리어 차트 (Coal/Oil/Gas/Cement/Flaring) | OWID (CSR) | 연료 조합 분석 |
| 6 | **Historical Responsibility** | 누적 CO2, 세계 점유율, 온도 기여 (bar) | OWID (CSR) | "So what?" |
| 7 | **Beyond CO2** | 메탄/N2O 라인차트, 총 GHG 바 | OWID (CSR) | GHG 포트폴리오 |
| 8 | **Economy** | `IndexedTripleLineChart` (GDP/CO2/carbon intensity) | WB + OWID (SSR+CSR) | Decoupling Score |
| 9 | **Vulnerability** | `EquityScatter`, ND-GAIN 바차트, risk-profile 텍스트 | ND-GAIN (SSR) + JSON | risk_level, 강점/약점 |
| 10 | **Data Sources** | 출처 목록, PNG 다운로드 버튼, 비교 링크 | 정적 | 없음 |

### 인라인 SVG 차트 (CountryClient 내부 정의)
| 함수 | 설명 |
|------|------|
| `EmissionsLineChart` | production (실선) + consumption (점선) 이중 라인, 파리선 annotation |
| `IndexedDualLineChart` | 2개 시계열 indexed 비교 |
| `IndexedTripleLineChart` | GDP / CO2 / carbon intensity 3선, hover tooltip |
| `HorizontalBarChart` | CTRACE 9개 섹터, 그라디언트 바, hover tooltip |
| `FuelStackedArea` | 연료별 스택 에리어 (Coal/Oil/Gas/Cement/Flaring) |

### 안전 장치
- `SafeChart` = `ChartErrorBoundary` wrapper — 차트 크래시 시 "unavailable" 표시, 페이지 유지
- `initialExtra` 패턴: SSR에서 데이터가 있으면 CSR fetch 생략 (중복 방지)
- NDC/Kaya/Equity 섹션: `fetch('/data/...')` → 데이터 없으면 섹션 숨김

---

## 10. 차트 컴포넌트 카탈로그

### `ClimateGap` ([src/components/charts/ClimateGap.tsx](src/components/charts/ClimateGap.tsx))
- **타입**: Slope chart (Pre vs Post-Paris CAGR)
- **데이터**: Supabase `EN.GHG.CO2.PC.CE.AR5` 전체 국가 동적 fetch
- **Props**: `highlightIso3?`, `serverData?: CountryCagr[]`
- **출력**: 좌측 (pre-Paris CAGR) → 우측 (post-Paris CAGR) 슬로프, 국가별 색상

### `ClimateSankey` ([src/components/charts/ClimateSankey.tsx](src/components/charts/ClimateSankey.tsx))
- **타입**: Sankey diagram (에너지 흐름)
- **데이터**: props (fossil%, renewable%, nuclear%)
- **구조**: [화석/재생/핵] → [전력] → [CO2/청정에너지]
- **기술**: 순수 SVG cubic-bezier band 함수, 그라디언트 fill

### `NDCGapChart` ([src/components/charts/NDCGapChart.tsx](src/components/charts/NDCGapChart.tsx))
- **타입**: 시계열 + 투영선 + 신뢰구간 + NDC 목표점
- **데이터**: `fetch('/data/ndc-gap/{iso3}.json')`
- **상태**: `on_track` / `off_track` / `no_target`
- **시각**: 역사적 실선 + 투영 점선 + 신뢰구간 밴드 + 목표 수평선

### `KayaWaterfall` ([src/components/charts/KayaWaterfall.tsx](src/components/charts/KayaWaterfall.tsx))
- **타입**: Waterfall bar chart (Kaya LMDI decomposition)
- **데이터**: `fetch('/data/kaya/{iso3}.json')`
- **요소**: [CO2 start] → [+population] → [+gdp/cap] → [-energy intensity] → [-carbon intensity] → [CO2 end]
- **색상**: increase=#EF4444, decrease=#10B981, start/end=#3B82F6

### `EquityScatter` ([src/components/charts/EquityScatter.tsx](src/components/charts/EquityScatter.tsx))
- **타입**: Scatter plot (기후 형평성 4사분면)
- **데이터**: `fetch('/data/equity-scatter.json')`
- **X축**: 누적 CO2/인 (역사적 책임)
- **Y축**: 기후 취약성 (ND-GAIN)
- **4사분면**: Historical Polluter / Climate Victim / Double Burden / Low Impact

### `WorldScoreboard` ([src/components/charts/WorldScoreboard.tsx](src/components/charts/WorldScoreboard.tsx))
- **타입**: D3 세계 지도 choropleth
- **데이터**: props (countries + class), `fetch('/geo/world-110m.json')`
- **투영**: `geoNaturalEarth1` (d3-geo)
- **색상**: Changer=#10B981 / Starter=#F59E0B / Talker=#EF4444 / NoData=#E5E7EB
- **인터랙션**: hover tooltip (iso3, name, cls, co2, renewable)

### `ClimateSpiral` ([src/components/charts/ClimateSpiral.tsx](src/components/charts/ClimateSpiral.tsx))
- 기온 이상 나선형 시각화 (연도별 월평균 이상온도)

### `ClimateStripes` ([src/components/charts/ClimateStripes.tsx](src/components/charts/ClimateStripes.tsx))
- Ed Hawkins 스타일 기온 스트라이프

### `ClimateDivide` ([src/components/charts/ClimateDivide.tsx](src/components/charts/ClimateDivide.tsx))
- 고소득 vs 저소득 국가 기후 격차 시각화

### `CountryCard` ([src/components/charts/CountryCard.tsx](src/components/charts/CountryCard.tsx))
- 홈페이지 국가 카드 (등급, 배출량, 재생에너지 %)

### `LineChart` / `DonutChart`
- 범용 SVG 차트 컴포넌트

---

## 11. UI 시스템 컴포넌트 (climate/)

`src/components/climate/` — 모든 페이지에서 재사용하는 레이아웃/UI 원자

### `PageWrapper`
최상위 페이지 컨테이너. max-width, 배경색, 여백 설정.

### `HeroSection` + `StatPill`
국가 페이지 히어로 영역. 국기, 이름, 등급 배지, 통계 알약.

### `SectionHeader`
```typescript
{ category: CardCategory; title: string; subtitle?: string }
```
- `category`: `'emissions' | 'energy' | 'economy' | 'risk' | 'data'`
- 각 카테고리별 고유 색상 + 아이콘 텍스트 + 배지

### `ChartCard`
```typescript
{ category: CardCategory; title: string; subtitle?: string; badge?: string; children }
```
차트를 감싸는 카드 컨테이너. border, shadow, 카테고리 색상 상단 바.

### `StoryBlock`
```typescript
{ layout: 'text-left' | 'text-right' | 'full'; insight?: ReactNode; delay?: number }
```
Scrollytelling 블록.
- `text-left`: 좌측 고정 인사이트 + 우측 스크롤 차트
- `text-right`: 좌측 차트 + 우측 고정 인사이트
- `full`: 차트만 전폭
- framer-motion `whileInView` spring animation

### `ScrollFadeIn`
```typescript
{ delay?: number; direction?: 'up' | 'down' | 'left' | 'right'; distance?: number; scale?: boolean }
```
뷰포트 진입 시 fade+translate 애니메이션. `once: true`.

### `SummaryFan`
3개 카드를 부채꼴로 배치하는 "Key Takeaways" UI.
- Desktop: fanRotations = [-6, 0, +6]deg, fanTranslateY = [8, 0, 8]
- Mobile: vertical stack
- framer-motion animate + useMotionValue

### `BentoGrid`
비대칭 벤토 그리드 레이아웃 컴포넌트.

---

## 12. Posters 시스템

`/posters` 페이지는 20개국 × 6개 포스터 타입의 교차 행렬.

### 포스터 타입 (`POSTER_DEFS`)
| id | 제목 | 카테고리 | 내용 |
|----|------|---------|------|
| `scoreboard` | World Scoreboard | Global | D3 세계 지도 + 분류 |
| `energy` | Energy Flow | Energy | Sankey 에너지 흐름 |
| `gap` | Paris Gap | Paris Gap | Pre/Post-Paris slope |
| `race` | Transition Race | Transition | 재생에너지 % 랭킹 |
| `inequality` | Carbon Inequality | Inequality | CO2/인 산점도 |
| `air` | Air Quality | Air | PM2.5 vs WHO 기준 |

### 20개국 목록 (COUNTRIES 배열)
KOR, USA, DEU, BRA, NGA, BGD, CHN, IND, JPN, GBR, FRA, CAN, AUS, IDN, SAU, ZAF, MEX, RUS, TUR, EGY

### 포스터 컴포넌트 구조
```
PostersClient.tsx
├── PosterHeroSection       (fan 애니메이션, scroll parallax)
├── BentoSection            (상위 국가들의 벤토 그리드)
├── Toolbar                 (viewMode: grid/carousel, filter)
├── PosterExplorer
│   ├── GridMode            (비대칭 bento: 7+5 / 5+7 / 6+6)
│   └── CarouselMode        (단일 포스터 전환)
└── PosterLightbox          (클릭 시 전체화면)
```

### Metrics 데이터 (Supabase fetch + fallback)
```typescript
interface Metrics {
  fossil: number;    // EMBER.FOSSIL.PCT
  renewable: number; // EMBER.RENEWABLE.PCT
  nuclear: number;   // other%
  co2: number;       // EN.GHG.CO2.PC.CE.AR5
  pm25: number;      // EN.ATM.PM25.MC.M3
}
```
- 6개 pilot 국가: `PILOT_DATA` 하드코딩 fallback
- 나머지 14개국: Supabase 실시간 fetch

### PNG 다운로드 플로우
```
PosterCard (ref) → onDownload(type) → exportHtmlAsPng(el, filename)
→ html2canvas → drawWatermark → canvas.toBlob → <a>.click()
```

---

## 13. 등급 & 분류 시스템

### Climate Class (Changer / Starter / Talker)
| 클래스 | 조건 | 색상 | 의미 |
|--------|------|------|------|
| Changer | CO2 감소 AND 재생에너지 증가 | #10B981 (초록) | 두 조건 모두 충족 |
| Starter | 둘 중 하나만 충족 | #F59E0B (노랑) | 부분적 진전 |
| Talker | 둘 다 미충족 | #EF4444 (빨강) | 목표 달성 못함 |

### Climate Grade (A+ ~ F)
| 점수 | 등급 | 색상 |
|------|------|------|
| 7 | A+ | #10B981 |
| 6 | A  | #10B981 |
| 5 | B+ | #3B82F6 |
| 4 | B  | #3B82F6 |
| 3 | C+ | #F59E0B |
| 2 | C  | #F59E0B |
| 1 | D  | #EF4444 |
| 0 | F  | #991B1B |

### Report Card — 5개 도메인 (Pentagon 차트)
| 도메인 | 가중치 | 지표 |
|--------|--------|------|
| Emissions | 30% | CO2/capita, CO2/GDP intensity, decoupling trend |
| Energy | 25% | Renewable share, grid carbon intensity |
| Economy | 15% | GDP per capita, climate economic efficiency |
| Responsibility | 15% | Share of global cumulative CO2 |
| Resilience | 15% | ND-GAIN readiness + vulnerability |

### Vulnerability Risk Level (ND-GAIN 기반)
| NDGAIN.VULNERABILITY | 라벨 | 색상 |
|---------------------|------|------|
| >= 0.45 | High Risk | #E5484D |
| 0.35 ~ 0.44 | Medium Risk | #F59E0B |
| < 0.35 | Low Risk | #00A67E |

---

## 14. 분석 방법론 (Derived Indicators)

### CAGR 계산
```
CAGR = (end_value / start_value)^(1/n) - 1
n = end_year - start_year
```

### DERIVED.DECOUPLING
```
GDP_growth% = (GDP(t) - GDP(t-1)) / GDP(t-1) × 100
CO2_growth% = (CO2(t) - CO2(t-1)) / CO2(t-1) × 100
DECOUPLING = GDP_growth% - CO2_growth%
```
- 양수 = 탈동조화 (경제 성장 > 배출 증가)
- 음수 = 결합 (배출이 경제보다 빠르게 증가)
- 2023년 검증값: DEU +19.0, USA +10.6, BRA +12.0, KOR +6.3, BGD -3.3, NGA -21.7

### DERIVED.CO2_PER_GDP
```
CO2_PER_GDP = CO2_pc / GDP_pc × 1000    [tCO2 / $1000 GDP]
```
- 2023년 검증: DEU 0.13 < USA 0.17 < BRA 0.22 < NGA 0.26 < BGD 0.27 < KOR 0.32

### DERIVED.ENERGY_TRANSITION
```
ENERGY_TRANSITION(t) = RENEWABLE_PCT(t) - RENEWABLE_PCT(t-5)    [pp/5yr]
```
- 2023년 검증: DEU +19.2pp, BRA +6.6pp, USA +5.2pp, KOR +4.9pp

### Kaya LMDI Additive Decomposition
```
CO2 = Population × (GDP/Pop) × (Energy/GDP) × (CO2/Energy)

Logarithmic Mean: L(a,b) = (a - b) / (ln(a) - ln(b))

dCO2_population    = L(CO2_t, CO2_t-1) × ln(Pop_t / Pop_t-1)
dCO2_gdp_per_cap   = L(CO2_t, CO2_t-1) × ln(GDPpc_t / GDPpc_t-1)
dCO2_energy_intens = L(CO2_t, CO2_t-1) × ln(EnergyIntensity_t / EnergyIntensity_t-1)
dCO2_carbon_intens = L(CO2_t, CO2_t-1) × ln(CarbonIntensity_t / CarbonIntensity_t-1)
```
- 분석 기간: 2015~2023
- 최소 인구: 100,000명 이상
- Residual threshold: 2% 이하 = HIGH confidence

### NDC Gap 계산
```
Projection = CAGR extrapolation from 2015-2023 trend
Gap = Projected_2030_emissions - NDC_target_2030
Gap_pct = Gap / Current_emissions × 100
Achievement_probability = f(current_CAGR, required_CAGR)
```
- 데이터: `ndc-targets.json` (UNFCCC NDC Registry, 20개국)
- Status: `on_track` / `off_track` / `no_target`

### Climate Equity Quadrant
```
X축: cumulative_co2_per_capita (역사적 책임)
Y축: NDGAIN.VULNERABILITY (현재 취약성)
중앙값 기준 4분할:
  Historical Polluter: high X, low Y  (선진국)
  Climate Victim:      low X, high Y  (최빈개도국)
  Double Burden:       high X, high Y (산업화 + 취약)
  Low Impact:          low X, low Y   (저배출 + 낮은 취약성)
```

---

## 15. PNG 내보내기 시스템

`src/lib/exportPng.ts`

### SVG 내보내기 (`exportSvgAsPng`)
```
SVGElement
→ XMLSerializer.serializeToString()
→ Blob (image/svg+xml)
→ URL.createObjectURL()
→ Image.onload → canvas.drawImage()
→ drawWatermark() → "visualclimate.org | Free version"
→ canvas.toBlob('image/png')
→ <a download>.click()
```
- 기본 출력 해상도: 1080×1080
- 배경: #FFFFFF

### HTML 내보내기 (`exportHtmlAsPng`)
```
HTMLElement
→ html2canvas({ scale, backgroundColor: '#FFFFFF', useCORS: true })
→ drawWatermark()
→ canvas.toBlob('image/png')
→ <a download>.click()
```
- scale: `Math.min(2, 1080 / element.width)` (최대 2x)

### 워터마크
```
font: 14px Inter
color: rgba(0,0,0,0.15)
position: 하단 중앙 -8px
text: "visualclimate.org | Free version"
```

---

## 16. SEO 시스템

### MetaTags (`createMetaTags`)
- `title`, `description`, `path`를 받아 Next.js Metadata 객체 반환
- OG 이미지: `/api/og` 라우트 (동적 생성)
- canonical URL 자동 설정

### JSON-LD (`JsonLd`, `buildCountryJsonLd`)
- 국가 페이지: `Dataset` + `WebPage` 구조화 데이터
- 검색엔진이 국가별 기후 데이터를 이해할 수 있도록

### `sitemap.ts`
- 동적 사이트맵: 모든 `/country/[iso3]`, `/report/[iso3]` 자동 생성
- `force-dynamic`으로 매 빌드 시 최신 국가 목록 반영

### SEO 가이드 페이지
- `/guides/climate-data-sources`: 기후 데이터 소스 가이드 (롱테일 SEO)
- `/guides/issb-s2-beginners`: ISSB S2 입문 가이드 (ESG 담당자 타깃)

---

## 17. 에이전트 스킬 목록 & 사용 기록

Claude Agent SDK의 `ToolSearch` 시스템을 통해 로드하는 스킬들.

### 실제 사용된 스킬 (이 프로젝트)
| 스킬 | 파일/이름 | 사용 맥락 |
|------|---------|---------|
| `design-system` | DESIGN SYSTEM v2 | 모든 UI 작업 — 색상/타이포/CSS 변수 기준 |
| `phase3-ui` | phase3-ui | 포스터 & 히어로 UI 개편 |
| `kaya-decomposition` | Kaya Identity LMDI | `scripts/analysis/calculate-kaya.ts` 구현 |
| `ndc-gap-methodology` | NDC Gap Tracker | `scripts/analysis/calculate-ndc-gap.ts` 구현 |
| `indicator-map` | 50+ 지표 맵 | 지표 코드 매핑, 데이터 소스 연결 |
| `data-source-catalog` | 12개 소스 카탈로그 | ETL 스크립트 작성 시 API 엔드포인트 확인 |
| `country-profile-template` | 국가 프로파일 템플릿 | CountryClient 10개 섹션 구조화 |
| `issb-s2-mapping` | ISSB S2 + TCFD + GRI 305 | 리포트 카드 5개 도메인 설계 |
| `climate-equity-map` | 기후 형평성 산점도 | EquityScatter 컴포넌트 + 4사분면 정의 |

### 스킬이 생성한 코드/데이터
| 스킬 | 출력 |
|------|------|
| kaya-decomposition | `public/data/kaya/*.json` (67국) + `KayaWaterfall.tsx` |
| ndc-gap-methodology | `public/data/ndc-gap/*.json` (200+국) + `NDCGapChart.tsx` |
| climate-equity-map | `public/data/equity-scatter.json` + `EquityScatter.tsx` |
| indicator-map | `data/analysis/risk-profile-*.json` (6국) |
| design-system | 모든 색상 변수, 타이포 시스템, ChartCard/SectionHeader |

---

## 18. 비즈니스 모델 & 수익화 구조

### 현재 상태
- 완전 무료 공개 서비스
- PNG 내보내기 시 워터마크 "visualclimate.org | Free version" 삽입
- Stripe 미연결

### 계획된 수익 모델
| 제품 | 가격 | 기술 요구사항 |
|------|------|-------------|
| PDF Country Report | $9/건 | `html2canvas` + PDF 라이브러리 + Stripe 결제 |
| Embeddable Widget | $99-299/월 | iframe 임베드 + API 키 + 사용량 제한 |
| API Access | $299-999/월 | Next.js Route Handler + API 키 + rate limiting |

### 무료 티어 가치
- 모든 차트 PNG 무료 다운로드 (워터마크 포함)
- 이 워터마크 = LinkedIn에서 VisualClimate 브랜드 노출 = 유기적 성장

---

## 19. 기술 부채 & 알려진 문제

### 코드 레벨
| 문제 | 파일 | 심각도 |
|------|------|--------|
| `useInView` 훅 존재하나 fade-in 비활성화 (opacity 항상 1) | CountryClient.tsx | 낮음 |
| scene1~8 refs 선언만 되고 미사용 | CountryClient.tsx | 낮음 |
| `CountryClient.tsx.backup` 파일 잔존 | country/[iso3]/ | 낮음 |
| GRADE_LABELS, GRADE_COLOR 중복 정의 (page.tsx + CountryClient.tsx) | 여러 파일 | 중간 |
| `data/source-registry.json` 비어있음 | data/ | 낮음 |

### 데이터 레벨
| 문제 | 영향 | 해결책 |
|------|------|--------|
| risk-profile JSON 6개국만 존재 | 194개국 취약성 텍스트 없음 | 200+ 국가로 확장 |
| emissions-trend JSON 6개국만 | 194개국 배출 인사이트 없음 | 분석 스크립트 전국 확장 |
| EMBER.CARBON.INTENSITY 미활용 | Kaya 인풋 누락 | scripts/analysis/calculate-kaya.ts에 연결 |
| DERIVED.CO2_PER_GDP 미활용 | 경제 섹션에서 표시 안 됨 | 경제 섹션에 추가 |
| DERIVED.ENERGY_TRANSITION 미활용 | 에너지 섹션 인사이트 없음 | 에너지 섹션 텍스트에 연결 |
| `DERIVED.EMISSIONS_INTENSITY` 완전 미사용 | — | 활용 또는 삭제 |
| `/library` 링크 미연결 | 리포트 카탈로그 사용 불가 | PDF API 구현 후 연결 |

### 인프라 레벨
| 문제 | 영향 |
|------|------|
| 빈 디렉토리 다수 (`data/frameworks/`, `data/quality-reports/` 등) | Git 불필요 폴더 |
| `src/app/data/` 빈 디렉토리 | — |
| NDC API unavailable (UNFCCC baseline만 사용) | NDC 데이터 정확도 제한 |

### PNG 다운로드 버튼
- 현재 `/country/[iso3]` 하단에 "Download as PNG" 버튼이 있으나 클릭 핸들러 미연결
- `exportHtmlAsPng` 함수는 구현됨 → 연결만 하면 됨

---

## 20. 확장 로드맵 & 갭 분석

### 데이터 갭 (즉시 해결 가능)
```
현재: 20개국 전체 데이터 + 200+ 국가 NDC/Kaya
목표: 200+ 국가 × 전체 지표 × risk-profile + emissions-trend
작업:
  1. scripts/co2-trend-comparison.ts → 20개국 → 200+개국으로 확장
  2. risk-profile 생성 스크립트 작성 (현재 수동)
  3. EMBER.CARBON.INTENSITY → Kaya 파이프라인 연결
```

### 기능 갭 (우선순위 순)
| 우선순위 | 기능 | 현재 상태 | 작업 |
|---------|------|---------|------|
| P1 | PNG 다운로드 연결 | 버튼 있음, 핸들러 없음 | ref 연결 + `exportHtmlAsPng` 호출 |
| P1 | risk-profile 200+ 국가 | 6개국만 | ETL 스크립트 확장 |
| P2 | PDF Country Report | 없음 | html2canvas + PDF API + Stripe |
| P2 | 스크롤리텔링 7-scene | StoryBlock만 있음 | framer-motion scene 전환 |
| P3 | EMBER.CARBON.INTENSITY 활용 | 미사용 | 에너지 섹션 + Kaya 연결 |
| P3 | API 엔드포인트 | 없음 | Next.js Route Handler + API 키 |
| P4 | Stripe 결제 | 없음 | Stripe SDK + webhook |
| P4 | 사용자 계정 | 없음 | Supabase Auth |

### 컨텐츠 갭
| 갭 | 현황 | 해결 |
|----|------|------|
| insights 아티클 | 2개만 (6개국 배출 + 취약성) | 주제 확장 (탈동조화, Kaya, 형평성) |
| guides 페이지 | 2개 (data sources, ISSB S2) | TCFD, GRI 305, NDC 설명 추가 |
| library 리포트 | 링크 없음 | PDF 생성 파이프라인 구축 |
| methodology 페이지 | 내용 얇음 | derived-methodology.md 반영 |

### 아키텍처 확장 시나리오
```
현재:
  Supabase → SSR → CSR (20개국)

시나리오 A: 200+ 국가 전면 지원
  - country_data 2016행 → ~30,000행
  - risk-profile + emissions-trend 200+ JSON 생성
  - 예상 빌드 시간 변화 없음 (SSR dynamic)

시나리오 B: API 서비스
  GET /api/v1/country/{iso3}/summary
  GET /api/v1/country/{iso3}/indicators
  GET /api/v1/country/{iso3}/kaya
  GET /api/v1/compare?countries=KOR,USA,DEU
  → Next.js Route Handlers + API 키 검증

시나리오 C: AI 인사이트 생성
  Supabase 데이터 → Claude API (Haiku) → 국가별 인사이트 텍스트 생성
  현재 6개국 수동 작성 → 200+ 자동 생성
  → data/analysis/risk-profile-{ISO3}.json 자동화
```

---

## 21. 운영 & 배포

### 배포 명령
```bash
npm run build && git push && npx vercel --prod
```

### 빌드 검증
```bash
npm run build    # TypeScript 에러 0개, 빌드 통과 확인
```

### 환경 분리
| 환경 | URL | 배포 방법 |
|------|-----|---------|
| Production | https://visualclimate.org | `npx vercel --prod` |
| Preview | https://visualclimate-*.vercel.app | `git push` 자동 |
| Local | http://localhost:3000 | `npm run dev` |

### 브랜치 전략
- `main` 단일 브랜치 (현재)
- 직접 push + vercel 배포

### 모니터링
- Vercel Analytics (자동)
- 에러: `console.error('[ChartError]', ...)` 패턴
- Supabase Dashboard: 쿼리 성능, 연결 수

---

## 22. AI 오케스트레이션 설계 제안

이 섹션은 VisualClimate을 AI 에이전트와 딥하게 통합할 때의 설계 방향.

### 현재 AI 활용
- Claude (Sonnet 4.6): 모든 코드 생성, ETL 스크립트, 컴포넌트 구현
- 스킬 시스템: kaya-decomposition, ndc-gap-methodology 등을 로드해 방법론 주입

### 제안: 인사이트 텍스트 자동 생성 파이프라인
```
트리거: 새 국가 데이터 적재 or 수동 실행
  ↓
scripts/generate-risk-profile.ts
  ↓
Supabase에서 해당 국가 전체 지표 fetch
  ↓
Claude API (Haiku — 비용 효율)
  프롬프트: "아래 지표를 기반으로 risk-profile JSON 생성:
    - key_vulnerabilities: 5개
    - strengths: 3개
    - summary: 200자 이내
    - risk_level: low/medium/high"
  ↓
data/analysis/risk-profile-{ISO3}.json 저장
  ↓
200+ 국가 반복
```

### 제안: 국가별 LinkedIn 캡션 자동 생성
```
사용자가 PNG 다운로드 클릭
  ↓
현재 섹션 + 국가 데이터 → Claude API
  ↓
"이 차트의 LinkedIn 포스트 캡션을 3개 버전으로 생성"
  ↓
사용자가 선택 + 클립보드 복사
```

### 제안: 비교 분석 텍스트 자동화
```
/compare 페이지에서 국가 선택
  ↓
선택된 국가들의 지표 차이 계산
  ↓
Claude API: "다음 국가 비교에서 가장 주목할 만한 인사이트 3가지"
  ↓
페이지에 실시간 표시
```

### 오케스트레이션 복잡도 등급
| 작업 | 복잡도 | AI 역할 | 우선순위 |
|------|--------|--------|---------|
| risk-profile 200+ 생성 | 낮음 | 텍스트 생성 (배치) | P1 |
| LinkedIn 캡션 생성 | 낮음 | 텍스트 생성 (실시간) | P2 |
| NDC 정책 설명 자동화 | 중간 | 구조화 데이터 해석 | P2 |
| 국가 비교 분석 | 중간 | 패턴 인식 + 해석 | P3 |
| 전체 보고서 PDF 생성 | 높음 | 긴 문서 생성 + 포맷 | P3 |
| 실시간 기후 뉴스 연결 | 높음 | RAG + 검색 | P4 |

---

## 부록: 색상 시스템 완전판

```css
/* CSS Variables — globals.css :root */
--bg-primary:   #FFFFFF;
--bg-section:   #F8F9FA;
--bg-card:      #FFFFFF;
--border-card:  #E8E8ED;
--shadow-card:  0 2px 8px rgba(0,0,0,0.06);

--accent-primary:  #0066FF;
--accent-positive: #00A67E;
--accent-negative: #E5484D;
--accent-warning:  #F59E0B;

--text-primary:   #1A1A2E;
--text-secondary: #4A4A6A;
--text-muted:     #8888A0;

--chart-1: #0066FF;  /* blue */
--chart-2: #00A67E;  /* green */
--chart-3: #F59E0B;  /* amber */
--chart-4: #E5484D;  /* red */
--chart-5: #8B5CF6;  /* purple */
--chart-6: #EC4899;  /* pink */
```

### 절대 금지 색상
- 배경: `bg-slate-900`, `bg-slate-800`, `#0a0a1a`, `#0d1117`
- 이유: 라이트 테마 전용 플랫폼

---

## 부록: 6개 파일럿 국가 핵심 데이터 (2023년 기준)

| 국가 | CO2/인(t) | 재생에너지% | 화석% | 취약성 | 준비도 | Risk |
|------|----------|-----------|------|--------|--------|------|
| BGD | 0.69 | 1.6% | 98.4% | — | — | — |
| BRA | 2.27 | 89.0% | 9.0% | — | — | — |
| NGA | 0.55 | 22.9% | 77.1% | — | — | — |
| DEU | 7.08 | 54.4% | 44.2% | — | — | — |
| KOR | 11.42 | 9.6% | 61.2% | 0.357 | 0.722 | Medium |
| USA | 13.71 | 22.7% | 59.1% | — | — | — |

---

*이 문서는 `docs/VISUALCLIMATE_WIKI.md`에 저장됩니다.*
*마지막 업데이트: 2026-03-06 (통합 리서치 기반)*
