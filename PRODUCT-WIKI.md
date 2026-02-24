# PRODUCT-WIKI.md — VisualClimate 전체 프로덕트 문서

> 마지막 업데이트: 2026-02-24
> 기준 커밋: `2addfd7` (main)
> 이 문서는 코드베이스의 모든 것을 설명하는 단일 진실 소스(Single Source of Truth)입니다.

---

## 목차

1. [프로덕트 정의](#1-프로덕트-정의)
2. [기술 스택](#2-기술-스택)
3. [디렉토리 구조](#3-디렉토리-구조)
4. [페이지 라우트](#4-페이지-라우트)
5. [컴포넌트 목록](#5-컴포넌트-목록)
6. [데이터 아키텍처](#6-데이터-아키텍처)
7. [데이터 과학 — 파생 지표 & 알고리즘](#7-데이터-과학--파생-지표--알고리즘)
8. [ETL 파이프라인](#8-etl-파이프라인)
9. [AI 에이전트 & 스킬 시스템](#9-ai-에이전트--스킬-시스템)
10. [분석 JSON 파일](#10-분석-json-파일)
11. [디자인 시스템](#11-디자인-시스템)
12. [환경 변수](#12-환경-변수)
13. [SEO & 성능](#13-seo--성능)
14. [개발 히스토리 — Git 커밋 타임라인](#14-개발-히스토리--git-커밋-타임라인)
15. [현재 상태 — 작동 / 미작동](#15-현재-상태--작동--미작동)

---

## 1. 프로덕트 정의

| 항목 | 내용 |
|------|------|
| **이름** | VisualClimate |
| **슬로건** | Climate Accountability Through Data |
| **목적** | 200+ 국가의 기후 데이터를 차트와 분석 텍스트로 시각화. 차트 PNG를 LinkedIn에 바로 공유할 수 있는 오픈 플랫폼 |
| **배포 URL** | https://visualclimate.com (Vercel) |
| **핵심 성공 지표** | 차트 PNG가 LinkedIn에 올라간 횟수 |

### 무엇인가
- **200+ 국가 기후 프로필**: 배출량, 에너지 전환, 경제 효율성, 기후 취약성 등 9개 섹션으로 구성
- **Climate Report Card**: 205개국을 A+~F로 채점, 5개 도메인(배출·에너지·경제·책임·회복력)으로 세분화
- **국가 분류**: Changer / Starter / Talker — 실제 행동 기반 3단계 분류
- **국가 비교**: 최대 5개 국가를 지표별로 대조
- **LinkedIn 콘텐츠 엔진**: 사이트의 모든 차트 = 바로 올릴 수 있는 콘텐츠

### 무엇이 아닌가 (지금은)
- $79 SaaS가 아님 (유료화는 트래픽 확보 후)
- RAG 챗봇이 아님
- 완성된 250개국 플랫폼이 아님 (일부 국가 데이터 공백 존재)

---

## 2. 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 프레임워크 | Next.js App Router | 16.1.6 |
| 언어 | TypeScript (strict mode) | ^5 |
| 스타일링 | Tailwind CSS | ^4 |
| 데이터베이스 | Supabase (PostgreSQL) | @supabase/supabase-js ^2.95.3 |
| 차트 | D3.js + Pure React SVG | d3 ^7.9.0 |
| 세계 지도 | topojson-client | ^3.1.0 |
| PNG 내보내기 | html2canvas | ^1.4.1 |
| 호스팅 | Vercel | Production |
| 폰트 | Inter (본문) + JetBrains Mono (수치) | Google Fonts |
| ETL 런타임 | tsx (TypeScript 스크립트 직접 실행) | ^4.21.0 |
| DB 직접 접근 | pg (ETL용) | ^8.18.0 |

**제거된 패키지** (코드베이스에서 완전 제거됨):
- `d3-sankey` — Pure React SVG로 교체 완료
- `@types/d3-sankey` — 함께 제거
- `react-markdown` — 사용처 없어 제거

---

## 3. 디렉토리 구조

```
visualclimate/
├── src/
│   ├── app/                          # Next.js App Router 페이지들
│   │   ├── page.tsx                  # 홈페이지
│   │   ├── layout.tsx                # 루트 레이아웃 (Header, Footer, JsonLd)
│   │   ├── globals.css               # CSS 변수 토큰 (라이트 테마)
│   │   ├── sitemap.ts                # 동적 사이트맵
│   │   ├── country/[iso3]/
│   │   │   ├── page.tsx              # 서버: 국가 데이터 fetch + 헤더 렌더링
│   │   │   └── CountryClient.tsx     # 클라이언트: 9개 섹션 차트 + 인사이트
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # 서버: 200+ 국가 카드 데이터 fetch
│   │   │   └── DashboardClient.tsx   # 클라이언트: 필터 + 그리드 뷰
│   │   ├── explore/
│   │   │   ├── page.tsx              # 서버: 200+ 국가 + 분류 데이터
│   │   │   └── ExploreClient.tsx     # 클라이언트: Changer/Starter/Talker 필터
│   │   ├── compare/
│   │   │   ├── page.tsx              # 서버: 비교 데이터 fetch
│   │   │   └── CompareClient.tsx     # 클라이언트: 국가 선택 + 지표 테이블
│   │   ├── report/
│   │   │   ├── page.tsx              # 서버: 205개국 Report Card 인덱스
│   │   │   ├── ReportIndexClient.tsx # 클라이언트: 지역별 필터 + 검색
│   │   │   └── [iso3]/
│   │   │       ├── page.tsx          # 서버: 개별 Report Card 데이터
│   │   │       └── ReportCardClient.tsx # 클라이언트: 5도메인 점수 시각화
│   │   ├── methodology/
│   │   │   └── page.tsx              # 정적: Report Card 방법론 설명
│   │   ├── learn/
│   │   │   └── page.tsx              # 정적: Insights/Library/Guides/Methodology 탭 허브
│   │   ├── insights/
│   │   │   ├── page.tsx              # 인사이트 인덱스 (2편)
│   │   │   ├── emissions-trend/
│   │   │   │   ├── page.tsx          # 배출 추세 분석 (JSON 연동)
│   │   │   │   └── chart.tsx         # D3 멀티라인 차트
│   │   │   └── climate-vulnerability/
│   │   │       ├── page.tsx          # 취약성 비교 분석
│   │   │       └── chart.tsx         # D3 산점도
│   │   ├── library/
│   │   │   └── page.tsx              # 8개 기후 보고서 카탈로그 (외부 링크 연결됨)
│   │   ├── guides/
│   │   │   ├── page.tsx              # 가이드 인덱스
│   │   │   ├── climate-data-sources/ # SEO 가이드: 무료 기후 데이터
│   │   │   └── issb-s2-beginners/    # SEO 가이드: ISSB S2 공시
│   │   ├── posters/
│   │   │   ├── page.tsx              # 서버: 포스터 데이터
│   │   │   └── PostersClient.tsx     # 클라이언트: 다운로드용 차트 모음
│   │   ├── about/
│   │   │   └── page.tsx              # About 페이지
│   │   └── api/
│   │       └── og/                   # OG 이미지 생성 엔드포인트
│   ├── components/
│   │   ├── charts/
│   │   │   ├── ClimateGap.tsx        # Pure SVG — Pre/Post Paris slope chart
│   │   │   ├── ClimateSankey.tsx     # Pure SVG — 에너지 흐름 Sankey
│   │   │   ├── ClimateStripes.tsx    # D3 — 온난화 스트라이프
│   │   │   ├── ClimateSpiral.tsx     # Pure SVG — CO2 나선형 차트
│   │   │   ├── ClimateDivide.tsx     # Pure SVG — CO2 격차 바차트 (6개국)
│   │   │   ├── ClimatePoster.tsx     # D3 — 1080x1080 포스터 (비활성)
│   │   │   ├── CountryCard.tsx       # D3 — 카드형 요약 (비활성)
│   │   │   ├── DonutChart.tsx        # D3 — 도넛 차트
│   │   │   ├── LineChart.tsx         # D3 — 제네릭 라인 차트
│   │   │   ├── WorldMap.tsx          # D3 + TopoJSON — 코로플레스 지도
│   │   │   └── WorldScoreboard.tsx   # D3 + TopoJSON — Changer/Starter/Talker 세계지도
│   │   ├── seo/
│   │   │   ├── JsonLd.tsx            # JSON-LD 구조화 데이터
│   │   │   └── MetaTags.tsx          # OpenGraph + Twitter Card 팩토리
│   │   ├── Header.tsx                # 메인 헤더 (sticky, 모바일 햄버거)
│   │   ├── Footer.tsx                # 메인 푸터
│   │   ├── HeroSearch.tsx            # 홈페이지 국가 검색 컴포넌트
│   │   ├── StatCard.tsx              # 재사용 스탯 카드 (value, unit, trend, source)
│   │   └── IndicatorSelector.tsx     # 지표 선택 드롭다운
│   └── lib/
│       ├── constants.ts              # CLIMATE_INDICATORS, PILOT_ISO3, ALL_ISO3, CHART_COLORS
│       ├── exportPng.ts              # SVG→PNG, HTML→PNG 내보내기 유틸
│       ├── iso3ToFlag.ts             # ISO3 → 이모지 국기 변환
│       └── supabase/
│           ├── client.ts             # 브라우저 클라이언트 (createBrowserClient)
│           └── server.ts             # 서버 클라이언트 (service_role key)
├── scripts/                          # ETL + 분석 스크립트 (npx tsx로 실행)
│   ├── seed-countries.ts             # 국가 기초 데이터 시딩 (250개국)
│   ├── fetch-worldbank.ts            # World Bank WDI API 수집
│   ├── fetch-climatewatch.ts         # Climate Watch API 수집
│   ├── etl-ember.ts                  # Ember 전력 데이터 ETL
│   ├── etl-ndgain.ts                 # ND-GAIN 취약성/준비도 ETL
│   ├── etl-climate-trace.ts          # Climate TRACE 총량 GHG ETL
│   ├── etl-climatetrace.ts           # Climate TRACE 섹터별 ETL
│   ├── etl-owid.ts                   # Our World in Data CO2 데이터 (27개 컬럼) ETL
│   ├── etl-expand-countries.ts       # 20→200+ 국가 확장 ETL
│   ├── etl-additional-indicators.ts  # 추가 지표 수집 (658줄)
│   ├── derived-emissions-intensity.ts # DERIVED.EMISSIONS_INTENSITY 계산
│   ├── co2-trend-comparison.ts       # CO2 추세 분석 스크립트
│   ├── analysis-classify.ts          # Changer/Starter/Talker 분류 알고리즘
│   ├── analysis-report-card.ts       # Report Card 점수 계산 (A+~F 채점)
│   └── qa-data-check.ts              # 데이터 품질 검사
├── data/
│   └── analysis/
│       ├── emissions-trend-6countries.json  # 6개국 배출 CAGR/Paris/순위
│       ├── emissions-trend-6countries.md    # 텍스트 분석
│       ├── risk-profile-KOR.json            # 국가별 위험 프로파일
│       ├── risk-profile-USA.json
│       ├── risk-profile-DEU.json
│       ├── risk-profile-BRA.json
│       ├── risk-profile-NGA.json
│       ├── risk-profile-BGD.json
│       ├── derived-methodology.md           # 파생 지표 공식 문서
│       └── co2-trend-comparison.md
├── .claude/
│   ├── agents/                       # Claude 서브에이전트 정의 (14개)
│   └── skills/                       # Claude 스킬 정의 (8개)
├── supabase/
│   └── migrations/001_schema.sql     # 전체 스키마 (테이블, RLS, 인덱스)
├── CLAUDE.md                         # 프로젝트 규칙 (Single Source of Truth)
├── PRODUCT-WIKI.md                   # 이 문서
└── tasks/                            # 작업 로그, 설계 노트
```

---

## 4. 페이지 라우트

### 핵심 페이지 (네비게이션 표시)

| 라우트 | 렌더링 | 설명 | 데이터 소스 |
|--------|--------|------|------------|
| `/` | Server + Client | 홈페이지: 히어로 + WorldScoreboard 지도 + Changer 국가 카드 + 통계 | Supabase (countries, country_data) |
| `/dashboard` | Server + Client | 200+ 국가 그리드: CO2, 재생에너지, GDP, 분류 배지, Report Card 등급 | Supabase |
| `/explore` | Server + Client | 국가 탐색: Changer/Starter/Talker 필터 + 정렬 | Supabase |
| `/report` | Server + Client | 205개국 Climate Report Card 인덱스 (A+~F 등급) | Supabase (REPORT.*) |
| `/report/[iso3]` | Server + Client | 개별 국가 Report Card: 5도메인 레이더/바 + 점수 분해 | Supabase (REPORT.*) |
| `/country/[iso3]` | Server + Client | 핵심 제품: 9개 섹션 차트 + 동적 인사이트 텍스트 | Supabase + analysis JSON |
| `/compare` | Server + Client | 국가 비교 테이블 (최대 5개국) | Supabase |

### 학습 허브 페이지

| 라우트 | 렌더링 | 설명 |
|--------|--------|------|
| `/learn` | Static | Insights/Library/Guides/Methodology 4탭 허브 페이지 |
| `/insights` | Static | 분석 아티클 인덱스 (2편) |
| `/insights/emissions-trend` | Static + Client | D3 멀티라인 + CAGR 테이블 + Paris 비교 |
| `/insights/climate-vulnerability` | Static + Client | D3 산점도 + 6개국 위험 프로파일 카드 |
| `/library` | Static | 8개 기후 보고서 카탈로그 (IPCC, UNEP, WMO, IEA, GCP — 외부 링크 연결됨) |
| `/guides` | Static | SEO 가이드 인덱스 |
| `/guides/climate-data-sources` | Static | 장문 SEO 가이드: 무료 기후 데이터 소스 |
| `/guides/issb-s2-beginners` | Static | 장문 SEO 가이드: ISSB S2 공시 입문 |
| `/methodology` | Static | Report Card 방법론: 5도메인 × 가중치 × 지표 × 채점 공식 |

### 보조 페이지

| 라우트 | 렌더링 | 설명 |
|--------|--------|------|
| `/posters` | Server + Client | 다운로드용 포스터: ClimateGap + ClimateSankey (6개국) |
| `/about` | Static | About 페이지 |
| `/sitemap.xml` | Generated | 동적 사이트맵 |

### 비활성 (미구현)
- `/chat` — RAG 챗봇 (유료화 시점 이후)
- `/pricing` — 가격 정책 페이지
- `/login`, `/signup` — 인증 (deferred)

---

## 5. 컴포넌트 목록

### 차트 컴포넌트 (`src/components/charts/`)

#### 활성 — 프로덕션 사용 중

| 컴포넌트 | 기술 | Props 주요 항목 | 사용 페이지 | 특징 |
|----------|------|--------------|-----------|------|
| `ClimateSankey` | Pure React SVG (커스텀) | `country, fossil, renewable, nuclear` | /country, /posters | D3-sankey 대체. Cubic-bezier band 직접 계산. 호버 시 glow 효과 |
| `ClimateGap` | Pure React SVG | `highlightIso3?` | /country, /posters | 6개국 Pre-Paris vs Post-Paris CAGR slope chart. 하드코딩 데이터 |
| `WorldScoreboard` | D3 + TopoJSON | `countries: CountryClass[]` | / (홈) | Changer/Starter/Talker 세계 코로플레스 지도. CDN에서 TopoJSON fetch |
| `ClimateSpiral` | Pure React SVG | `country, iso3, data` | /country (Section 1) | CO2 나선형 차트. 연도별 각도 계산 |
| `ClimateDivide` | Pure React SVG | 없음 (하드코딩) | /posters | 6개국 CO2 격차 바차트. 초록→빨강 그라디언트 |
| `DonutChart` | D3 | `data: Slice[]` | /country Energy 섹션 (`<details>` 안) | 에너지 믹스 도넛. 라이트 테마 적용 |

#### 비활성 (컴포넌트 존재하지만 페이지에서 미사용)

| 컴포넌트 | 이유 | 비고 |
|----------|------|------|
| `ClimateStripes` | D3 SSR 이슈로 비활성화 | 홈페이지 import 주석 처리됨 |
| `ClimatePoster` | D3 SSR 이슈 | CountryClient에서 import 주석 처리됨 |
| `CountryCard` | 동일 이슈 | 주석 처리됨 |
| `LineChart` | 제네릭 컴포넌트이나 실제 사용처 없음 | CountryClient가 인라인 SVG 사용 |
| `WorldMap` | WorldScoreboard로 대체됨 | 별도 코로플레스 존재 |

### 인라인 차트 컴포넌트 (CountryClient.tsx 내부 정의)

CountryClient.tsx는 9개 섹션의 차트를 모두 파일 내 함수로 정의합니다:

| 함수명 | 타입 | 설명 |
|--------|------|------|
| `EmissionsLineChart` | React SVG | CO2/capita 라인+면적 차트. Paris 2015 수직선 마커. 소비기반 비교선 옵션 |
| `IndexedDualLineChart` | React SVG | 2개 시계열 인덱스 비교 (WB vs CT, GDP vs CO2) |
| `StackedAreaChart` | React SVG | 연료별 누적 면적 차트 (Coal/Oil/Gas/Cement/Flaring) |
| `HorizontalBarChart` | React SVG | 섹터별 배출 수평 바차트 |
| `ScatterChart` | React SVG | ND-GAIN 취약성 × 준비도 산점도 |
| `DonutChart` | React SVG + D3 | 에너지 믹스 도넛 (`<details>` 토글 내) |

### 레이아웃 & UI 컴포넌트

| 컴포넌트 | 설명 | 사용처 |
|----------|------|--------|
| `Header` | 스티키 네비게이션, 모바일 햄버거 메뉴 | layout.tsx |
| `Footer` | Product/Resources/Data 링크 섹션 | layout.tsx |
| `HeroSearch` | 홈 히어로 국가 검색 (실시간 필터) | / |
| `StatCard` | 수치 + 단위 + 트렌드 화살표 + 출처 카드 | /, /country |
| `IndicatorSelector` | 지표 선택 드롭다운 | DashboardClient |
| `JsonLd` | JSON-LD 구조화 데이터 주입 | layout.tsx, /country |
| `MetaTags (createMetaTags)` | OG + Twitter Card 메타 팩토리 함수 | 전체 페이지 |

---

## 6. 데이터 아키텍처

### Supabase 테이블 구조

#### `countries` — 기준 국가 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | integer | PK, serial |
| iso3 | varchar | 고유, e.g. "KOR" |
| name | varchar | e.g. "South Korea" |
| region | text | e.g. "Asia" |
| sub_region | text | e.g. "Eastern Asia" |
| income_group | text | e.g. "High income" |
| population | bigint | 최신 인구 |
| lat, lng | numeric | 좌표 |
| flag_url | text | flagcdn.com/{iso2}.svg |
| iso2 | varchar | 2자리 코드 |

**현재 행 수**: ~250개국

#### `indicators` — 지표 메타데이터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | integer | PK |
| code | varchar | 고유 코드 e.g. "EN.GHG.CO2.PC.CE.AR5" |
| name | varchar | 한국어/영어 이름 |
| source | varchar | "World Bank WDI", "Ember", "Derived" 등 |
| unit | varchar | e.g. "t CO2e/capita" |
| category | text | |
| domain | varchar | "emissions", "energy", "economy" 등 |
| issb_s2_ref | varchar | ISSB S2 공시 참조 코드 |
| sdg_target | varchar | SDG 목표 매핑 |

#### `country_data` — 핵심 시계열 데이터 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | integer | PK |
| country_iso3 | varchar | FK → countries.iso3 |
| indicator_code | varchar | FK → indicators.code |
| year | integer | 2000–2024 |
| value | numeric | 측정값 |
| source | varchar | 데이터 소스명 |

**RLS: 비활성 (공개 읽기)**
**현재 행 수**: ~수만 행 (200+ 국가 × 지표 × 연도)

#### `indicator_values` — 레거시 테이블 (미사용)

앱 코드에서 전혀 쿼리하지 않음. 모든 쿼리는 `country_data`에서.

### indicator_code 전체 목록

#### 핵심 기후 지표 (Supabase country_data)

| code | 설명 | 단위 | 출처 | 앱 사용 |
|------|------|------|------|---------|
| `EN.GHG.CO2.PC.CE.AR5` | CO2 1인당 배출량 | t CO2e/capita | World Bank/Climate Watch | ✅ 핵심 |
| `NY.GDP.PCAP.CD` | GDP 1인당 | 현재 USD | World Bank WDI | ✅ 핵심 |
| `EMBER.RENEWABLE.PCT` | 재생에너지 전력 비율 | % | Ember | ✅ 핵심 |
| `EMBER.FOSSIL.PCT` | 화석연료 전력 비율 | % | Ember | ✅ 핵심 |
| `EMBER.CARBON.INTENSITY` | 전력 탄소집약도 | gCO2/kWh | Ember | ✅ Transition Progress 카드 표시 |
| `NDGAIN.VULNERABILITY` | 기후 취약성 지수 | 0~1 | ND-GAIN | ✅ 핵심 |
| `NDGAIN.READINESS` | 기후 준비도 지수 | 0~1 | ND-GAIN | ✅ 핵심 |
| `AG.LND.FRST.ZS` | 산림면적 | % of land | World Bank WDI | ⚠️ Data Sources만 |
| `EG.USE.PCAP.KG.OE` | 에너지사용량 1인당 | kg oil eq. | World Bank WDI | ⚠️ Data Sources만 |
| `EN.ATM.PM25.MC.M3` | PM2.5 대기오염 | µg/m³ | World Bank WDI | ✅ 헤더 카드 |
| `CT.GHG.TOTAL` | 총 GHG (절대량) | Mt CO2e | Climate TRACE | ✅ 비교 차트 |

#### 파생 지표 (scripts/로 계산 후 country_data 저장)

| code | 설명 | 단위 | 계산 주체 |
|------|------|------|----------|
| `DERIVED.CO2_PER_GDP` | GDP당 CO2 강도 | t CO2/$1k GDP | derived-emissions-intensity.ts |
| `DERIVED.DECOUPLING` | 탈동조화 지수 | pp | derived-emissions-intensity.ts |
| `DERIVED.EMISSIONS_INTENSITY` | 배출 집약도 | t CO2/person | derived-emissions-intensity.ts |
| `DERIVED.ENERGY_TRANSITION` | 에너지전환 모멘텀 (5년 변화) | pp/5yr | derived-emissions-intensity.ts |
| `DERIVED.CLIMATE_CLASS` | 국가 분류 | 1=Changer, 2=Starter, 3=Talker | analysis-classify.ts |

#### Report Card 지표 (analysis-report-card.ts로 계산)

| code | 설명 | 연도 |
|------|------|------|
| `REPORT.TOTAL_SCORE` | 총합 점수 (0~100) | 2024 (year=2024로 저장) |
| `REPORT.GRADE` | 등급 숫자 (7=A+, 6=A, 5=B+, 4=B, 3=C+, 2=C, 1=D, 0=F) | 2024 |
| `REPORT.EMISSIONS_SCORE` | 배출 도메인 점수 | 2024 |
| `REPORT.ENERGY_SCORE` | 에너지 도메인 점수 | 2024 |
| `REPORT.ECONOMY_SCORE` | 경제 도메인 점수 | 2024 |
| `REPORT.RESPONSIBILITY_SCORE` | 역사적 책임 도메인 점수 | 2024 |
| `REPORT.RESILIENCE_SCORE` | 회복력 도메인 점수 | 2024 |

#### OWID 지표 (Our World in Data CO2 데이터셋 — 27개 컬럼)

| code | 설명 |
|------|------|
| `OWID.CO2` | 연간 CO2 배출 총량 (Mt) |
| `OWID.CO2_PER_CAPITA` | 1인당 CO2 (t) |
| `OWID.CO2_PER_GDP` | GDP당 CO2 (kg/$) |
| `OWID.CUMULATIVE_CO2` | 누적 CO2 배출량 (Mt) |
| `OWID.SHARE_GLOBAL_CO2` | 전 세계 CO2 점유율 (%) |
| `OWID.SHARE_GLOBAL_CUMULATIVE_CO2` | 누적 CO2 글로벌 점유율 (%) → Report Card Responsibility 도메인 |
| `OWID.CONSUMPTION_CO2` | 소비기반 CO2 (Mt) |
| `OWID.CONSUMPTION_CO2_PER_CAPITA` | 소비기반 CO2 1인당 |
| `OWID.CO2_INCLUDING_LUC` | 토지이용변화 포함 CO2 |
| `OWID.METHANE` | 메탄 배출량 |
| `OWID.NITROUS_OXIDE` | 아산화질소 배출량 |
| `OWID.TOTAL_GHG` | 총 GHG |
| `OWID.GHG_PER_CAPITA` | 1인당 GHG |
| `OWID.TEMPERATURE_CHANGE_FROM_GHG` | GHG로 인한 온도 기여 (°C) |
| `OWID.TEMPERATURE_CHANGE_FROM_CO2` | CO2로 인한 온도 기여 |
| `OWID.TEMPERATURE_CHANGE_FROM_CH4` | CH4로 인한 온도 기여 |
| `OWID.TEMPERATURE_CHANGE_FROM_N2O` | N2O로 인한 온도 기여 |
| `OWID.COAL_CO2` | 석탄 CO2 |
| `OWID.OIL_CO2` | 석유 CO2 |
| `OWID.GAS_CO2` | 가스 CO2 |
| `OWID.CEMENT_CO2` | 시멘트 CO2 |
| `OWID.FLARING_CO2` | 플레어링 CO2 |
| `SP.POP.TOTL` | 인구 (OWID에서 함께 수집) |

#### Climate TRACE 섹터별 지표

| code 패턴 | 설명 |
|-----------|------|
| `CTRACE.POWER` | 발전 섹터 배출 |
| `CTRACE.TRANSPORTATION` | 교통 |
| `CTRACE.MANUFACTURING` | 제조업 |
| `CTRACE.AGRICULTURE` | 농업 |
| `CTRACE.FOSSIL-FUEL-OPERATIONS` | 화석연료 운영 |
| `CTRACE.BUILDINGS` | 건물 |
| `CTRACE.WASTE` | 폐기물 |
| `CTRACE.FORESTRY` | 산림 |
| `CTRACE.MINERAL-EXTRACTION` | 광물 채굴 |

### 데이터 Fetch 위치 요약

| 파일 | Fetch 방식 | 주요 지표 |
|------|-----------|----------|
| `src/app/page.tsx` | Server (service_role) | countries, country_data (climate class, grade, co2) |
| `src/app/country/[iso3]/page.tsx` | Server (service_role) | 전체 지표 (해당 국가) |
| `src/app/country/[iso3]/CountryClient.tsx` | Client (브라우저 supabase) | OWID.*, CTRACE.*, 소비기반 CO2 |
| `src/app/dashboard/page.tsx` | Server | co2, renewable, gdp, climate_class, grade |
| `src/app/explore/page.tsx` | Server | co2, renewable, gdp, climate_class, grade |
| `src/app/report/page.tsx` | Server | REPORT.* (전체 국가) |
| `src/app/report/[iso3]/page.tsx` | Server | REPORT.* (단일 국가) |
| `src/app/compare/page.tsx` | Server | 선택된 지표 × 선택된 국가 |
| `src/app/posters/page.tsx` | Server | co2, renewable, fossil, pm25, vulnerability |
| `data/analysis/*.json` | Static import | 6개국 분석 데이터 (emissions-trend, risk-profile) |

---

## 7. 데이터 과학 — 파생 지표 & 알고리즘

### DERIVED.CO2_PER_GDP — GDP당 탄소 집약도

```
공식: EN.GHG.CO2.PC.CE.AR5 ÷ NY.GDP.PCAP.CD × 1,000
단위: tCO2 per $1,000 GDP
해석: 낮을수록 경제가 깨끗함
커버리지: 6개국, 2000-2023 (144행)
2023 검증값: DEU 0.13 < USA 0.17 < BRA 0.22 < NGA 0.26 < BGD 0.27 < KOR 0.32
```

### DERIVED.DECOUPLING — 탈동조화 지수

```
공식: GDP_growth_rate(%) - CO2_growth_rate(%)
  GDP_growth_rate  = (GDP(t) - GDP(t-1)) / GDP(t-1) × 100
  CO2_growth_rate  = (CO2(t) - CO2(t-1)) / CO2(t-1) × 100
단위: percentage points (pp)
해석: 양수 = 경제 > 배출 증가속도 (탈동조화). 음수 = 재동조화.
2023 값: DEU +19.0, USA +10.6, BRA +12.0, KOR +6.3, BGD -3.3, NGA -21.7
커버리지: 2001-2023 (2000년 제외 — 직전 년도 데이터 없음)
```

### DERIVED.ENERGY_TRANSITION — 에너지전환 모멘텀

```
공식: RENEWABLE_PCT(t) - RENEWABLE_PCT(t-5)
단위: pp over 5 years
해석: 5년간 재생에너지 비율 변화. 양수 = 전환 가속.
2023 값: DEU +19.2pp, BRA +6.6pp, USA +5.2pp, KOR +4.9pp, NGA +1.7pp, BGD -0.1pp
커버리지: 2005-2023 (2000-2004 제외 — t-5 데이터 없음)
```

### DERIVED.CLIMATE_CLASS — 국가 분류 알고리즘

**스크립트**: `scripts/analysis-classify.ts`
**저장**: indicator_code=`DERIVED.CLIMATE_CLASS`, year=2023

```
분류 기준:
  Changer (1): CO2 CAGR(2015-2023) < 0 AND Renewable delta(2018-2023) > 2pp
  Starter (2): 위 두 조건 중 하나만 충족
  Talker  (3): 두 조건 모두 미충족
  NoData     : 데이터 부족 시 (행 미삽입)

CO2 CAGR 계산:
  CAGR = (CO2_2023 / CO2_2015)^(1/8) - 1
  (2023 데이터 없으면 2022, 2021 순으로 fallback)

Renewable delta:
  delta = RENEWABLE_PCT_2023 - RENEWABLE_PCT_2018
  (2018 없으면 2019 fallback)

구현: Supabase에서 paginate fetch (1000행 단위) → 국가별 그룹화 → 계산 → upsert
```

### REPORT.GRADE — Climate Report Card 채점 알고리즘

**스크립트**: `scripts/analysis-report-card.ts` (304줄)
**저장**: REPORT.* indicator_code들, year=2024

```
5개 도메인 가중치:
  Emissions     30%  (EN.GHG.CO2.PC.CE.AR5 50% + DERIVED.CO2_PER_GDP 30% + DERIVED.DECOUPLING 20%)
  Energy        25%  (EMBER.RENEWABLE.PCT 60% + EMBER.CARBON.INTENSITY 40%)
  Economy       15%  (NY.GDP.PCAP.CD 50% + DERIVED.CO2_PER_GDP 50%)
  Responsibility 15% (OWID.SHARE_GLOBAL_CUMULATIVE_CO2 100%)
  Resilience    15%  (NDGAIN.READINESS 50% + NDGAIN.VULNERABILITY 50%)

정규화 방법: Min-Max Normalization (0~1 스케일)
  score_i = (value_i - min_global) / (max_global - min_global)
  방향 반전: Emissions/CO2 계열은 inverse(낮을수록 좋음) → 1 - score_i

등급 임계값:
  A+ (7): total ≥ 75
  A  (6): total ≥ 65
  B+ (5): total ≥ 55
  B  (4): total ≥ 45
  C+ (3): total ≥ 35
  C  (2): total ≥ 25
  D  (1): total ≥ 15
  F  (0): total < 15

커버리지: 205개국 채점 완료
```

### CAGR (Compound Annual Growth Rate)

emissions-trend-6countries.json에 수록된 CAGR 계산:

```
CAGR = (CO2_end / CO2_start)^(1/n) - 1 (× 100 to get %)
Pre-Paris CAGR  = 2000→2015 (15년)
Post-Paris CAGR = 2015→2023 (8년)
Paris 영향 = Post-Paris CAGR - Pre-Paris CAGR (pp)
```

### ClimateSankey — 에너지 흐름 레이아웃

D3-sankey 라이브러리 없이 Pure React SVG로 구현:

```
레이아웃 상수:
  S   = 3.2 (scale: px per %)
  GAP = 16px (left 컬럼 노드 간격)
  NW  = 30px (노드 너비)
  LX  = 160px (좌측 x), MX = 420px (중간), RX = 680px (우측)

Band 계산 (band 함수):
  입력 포인트 (x1, y1top, y1bottom) → 출력 포인트 (x2, y2top, y2bottom)
  Cubic-bezier: cx = (x1 + x2) / 2
  SVG path: M, C, L, C, Z

유니크 gradient ID: gsk-{country}-{type} → 동일 페이지 다중 인스턴스 충돌 방지
```

---

## 8. ETL 파이프라인

### 데이터 흐름

```
외부 소스 → scripts/*.ts → Supabase country_data → Next.js 페이지
```

### 스크립트별 상세

| 스크립트 | 실행 명령 | 소스 | 대상 테이블 | 설명 |
|----------|----------|------|------------|------|
| `seed-countries.ts` | `npm run seed:countries` | ISO 3166 | countries | 250개국 기초 정보 시딩 |
| `fetch-worldbank.ts` | `npm run seed:worldbank` | World Bank WDI API | country_data | CO2, GDP, PM2.5, Forest, Energy 지표 |
| `fetch-climatewatch.ts` | `npm run seed:climatewatch` | Climate Watch API | country_data | GHG 시계열 |
| `etl-ember.ts` | `npx tsx` | Ember Global Electricity | country_data | RENEWABLE.PCT, FOSSIL.PCT, CARBON.INTENSITY |
| `etl-ndgain.ts` | `npx tsx` | ND-GAIN Dataset | country_data | VULNERABILITY, READINESS (2000-2023) |
| `etl-climate-trace.ts` | `npx tsx` | Climate TRACE API | country_data | CT.GHG.TOTAL (총량) |
| `etl-climatetrace.ts` | `npx tsx` | Climate TRACE API | country_data | CTRACE.* (9개 섹터별) |
| `etl-owid.ts` | `npx tsx` | OWID CO2 CSV (CDN) | country_data | 27개 OWID.* 지표 |
| `etl-expand-countries.ts` | `npx tsx` | 복합 소스 | country_data | 20→200+ 국가 확장 |
| `etl-additional-indicators.ts` | `npx tsx` | 복합 소스 | country_data | 추가 지표 수집 (658줄) |
| `derived-emissions-intensity.ts` | `npx tsx` | Supabase → 계산 → Supabase | country_data | DERIVED.* 4개 지표 |
| `analysis-classify.ts` | `npx tsx` | Supabase | country_data | DERIVED.CLIMATE_CLASS (Changer/Starter/Talker) |
| `analysis-report-card.ts` | `npx tsx` | Supabase | country_data | REPORT.* 7개 지표 |
| `qa-data-check.ts` | `npx tsx` | Supabase | 검사만 | 데이터 품질 검사 리포트 |

### 실행 순서 (최초 세팅)

```bash
1. npx tsx --env-file=.env.local scripts/seed-countries.ts
2. npx tsx --env-file=.env.local scripts/fetch-worldbank.ts
3. npx tsx --env-file=.env.local scripts/etl-ember.ts
4. npx tsx --env-file=.env.local scripts/etl-ndgain.ts
5. npx tsx --env-file=.env.local scripts/etl-climate-trace.ts
6. npx tsx --env-file=.env.local scripts/etl-climatetrace.ts
7. npx tsx --env-file=.env.local scripts/etl-owid.ts
8. npx tsx --env-file=.env.local scripts/etl-expand-countries.ts
9. npx tsx --env-file=.env.local scripts/derived-emissions-intensity.ts  # DERIVED.*
10. npx tsx --env-file=.env.local scripts/analysis-classify.ts            # CLIMATE_CLASS
11. npx tsx --env-file=.env.local scripts/analysis-report-card.ts         # REPORT.*
12. npx tsx --env-file=.env.local scripts/qa-data-check.ts                # QA 확인
```

---

## 9. AI 에이전트 & 스킬 시스템

Claude Code CLI의 서브에이전트 시스템을 활용해 개발 효율을 높였습니다.

### 에이전트 (`.claude/agents/`)

각 에이전트는 특정 도메인에 특화된 서브프로세스입니다:

| 에이전트 | 역할 |
|---------|------|
| `etl-pipeline` | 데이터 ETL 파이프라인 실행 (12개 소스) |
| `climate-data-scientist` | 통계 분석, 추세 분해, 파생 지표 계산 |
| `data-quality-auditor` | 교차 소스 검증, 이상값 탐지, 품질 점수 |
| `ui-designer` | Stripe 스타일 라이트 테마 UI 구현 |
| `d3-visualization` | D3.js 차트 컴포넌트 구축 |
| `devops-infra` | Vercel 배포, 환경 변수, DB 마이그레이션 |
| `api-manager` | API 키 관리, 레이트 리밋, 소스 레지스트리 |
| `qa-validator` | 빌드 검증, 타입 체크, 페이지 렌더링 QA |
| `report-embedder` | 기후 보고서 청킹 + pgvector 임베딩 |
| `seo-content` | SEO 메타태그, JSON-LD, 사이트맵, 랜딩 카피 |
| `pdf-exporter` | PDF 국가 리포트 생성 |
| `issb-auditor` | ISSB S2 공시 요구사항 매핑 |
| `sdg-paris-analyst` | SDG 목표 + 파리협정 NDC 정렬 분석 |
| `physical-risk-analyst` | TCFD 카테고리 + CMIP6 시나리오 물리적 위험 분석 |

### 스킬 (`.claude/skills/`)

Claude가 특정 작업 시 자동으로 로드하는 컨텍스트 파일:

| 스킬 | 로드 시점 |
|------|---------|
| `design-system` | UI 컴포넌트 구축 시 — 색상 토큰, 타이포그래피, 컴포넌트 패턴 |
| `indicator-map` | 데이터 수집/차트 작업 시 — 50+ 지표 × 도메인 × 출처 × ISSB S2 |
| `data-source-catalog` | 데이터 수집 시 — 12개 소스 API 엔드포인트, 형식, 접근 방법 |
| `issb-s2-mapping` | 프레임워크 매핑 시 — ISSB S2 + TCFD + GRI 305 + SDG 13 |
| `country-profile-template` | 국가 프로파일 작업 시 |
| `phase3-charts` | Phase 3 차트 구현 시 |
| `phase3-ui` | Phase 3 UI 구현 시 |
| `phase4-content` | Phase 4 콘텐츠 작업 시 |
| `phase5-deploy` | 배포 작업 시 |

---

## 10. 분석 JSON 파일

### `data/analysis/emissions-trend-6countries.json`

6개 파일럿 국가의 배출 추세 분석 데이터. CountryClient.tsx와 insights/emissions-trend/page.tsx에서 static import:

```json
{
  "cagr_2000_2023": [
    { "iso3": "...", "country": "...", "cagr": number, "rank": number }
  ],
  "pre_paris_vs_post_paris": [
    {
      "iso3": "...", "country": "...",
      "pre_paris_cagr": number,
      "post_paris_cagr": number,
      "paris_impact": number,
      "rank": number
    }
  ],
  "decoupling_score": [
    { "iso3": "...", "country": "...", "score": number, "rank": number }
  ],
  "energy_transition_ranking": [
    {
      "iso3": "...", "country": "...",
      "energy_transition_value": number,
      "renewable_pct_latest": number,
      "rank": number
    }
  ]
}
```

**사용 위치**: CountryClient.tsx가 이 데이터로 동적 인사이트 텍스트 생성

### `data/analysis/risk-profile-{ISO3}.json` (6개 파일)

```json
{
  "iso3": "KOR",
  "country": "South Korea",
  "risk_level": "Medium",
  "vulnerability": 0.341,
  "readiness": 0.665,
  "key_vulnerabilities": ["string", ...],
  "strengths": ["string", ...],
  "summary": "string"
}
```

**사용 위치**: CountryClient.tsx Section 8 (취약성 섹션) 위험 프로파일 카드

### `data/analysis/derived-methodology.md`

파생 지표 공식 문서. `/country/[iso3]` 페이지의 Data Sources 섹션에 "Derived Indicators — Methodology" 아코디언으로 인라인 표시.

---

## 11. 디자인 시스템

### CSS 변수 토큰 (`src/app/globals.css`)

```css
--bg-primary:    #FFFFFF   /* 페이지 배경 */
--bg-section:    #F8F9FA   /* 섹션 배경 */
--text-primary:  #1A1A2E   /* 제목 */
--text-secondary:#4A4A6A   /* 본문 */
--text-muted:    #94A3B8   /* 부가 정보 */
--accent-primary: #0066FF  /* 블루 — 링크, CTA */
--accent-positive:#00A67E  /* 그린 — 긍정 지표 */
--accent-negative:#E5484D  /* 레드 — 부정 지표 */
--border-card:   #E8E8ED   /* 카드 테두리 */
--shadow-card:   0 1px 3px rgba(0,0,0,0.08) /* 카드 그림자 */
```

### 절대 금지 규칙

- 배경에 `bg-slate-900`, `bg-slate-800`, `#0a0a1a`, `#0d1117` 등 다크 컬러 사용 금지
- 수치 하드코딩 금지 (Supabase 또는 analysis JSON에서 읽어야 함)

### 차트 색상 팔레트

```js
CHART_COLORS = ['#0066FF', '#00A67E', '#F59E0B', '#E5484D', '#8B5CF6', '#EC4899']
```

### 국가 분류 색상

| 분류 | 색상 | 배경 |
|------|------|------|
| Changer | `#10B981` (초록) | `#ECFDF5` |
| Starter | `#F59E0B` (노랑) | `#FFFBEB` |
| Talker  | `#EF4444` (빨강) | `#FEF2F2` |

### Report Card 등급 색상

| 등급 | 색상 | 배경 |
|------|------|------|
| A+, A | `#10B981` 초록 | `#ECFDF5` |
| B+, B | `#3B82F6` 블루 | `#EFF6FF` |
| C+, C | `#F59E0B` 앰버 | `#FFFBEB` |
| D | `#EF4444` 레드 | `#FEF2F2` |
| F | `#991B1B` 다크레드 | `#FFF1F2` |

### 폰트

| 용도 | 폰트 | 클래스 |
|------|------|--------|
| 제목 | Inter | `font-semibold` (600) |
| 본문 | Inter | 기본 |
| 수치 | JetBrains Mono | `font-mono` |

---

## 12. 환경 변수

| 변수 | 용도 | 상태 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ 필수 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 익명 키 (퍼블릭) | ✅ 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | 관리자 키 (서버 전용) | ✅ 필수 |
| `SUPABASE_URL` | ETL 스크립트용 (non-NEXT_PUBLIC_) | ✅ ETL 필수 |
| `NEXT_PUBLIC_SITE_URL` | 사이트맵/메타태그용 | ✅ 권장 |
| `OPENAI_API_KEY` | RAG (미사용) | ⚠️ 미사용 |
| `STRIPE_SECRET_KEY` | 결제 (미사용) | ⚠️ 미사용 |
| `STRIPE_WEBHOOK_SECRET` | Stripe 웹훅 (미사용) | ⚠️ 미사용 |

---

## 13. SEO & 성능

### 메타데이터

- **루트 layout.tsx**: 제목 템플릿 `%s | VisualClimate`, 전체 OG/Twitter Card 기본값
- **각 페이지**: `createMetaTags({ title, description, path })` 팩토리 함수
- **JSON-LD**: 홈페이지 → WebSite 스키마, 국가 페이지 → Dataset 스키마
- **Canonical URL**: `alternates.canonical` 자동 설정

### 사이트맵 (`src/app/sitemap.ts`)

정적 라우트 + 6개 파일럿 국가 페이지 동적 생성.
⚠️ 미포함 라우트: `/insights`, `/insights/*`, `/posters`, `/report`, `/report/*`, `/explore`

### 외부 CDN 의존성

| 소스 | URL | 용도 |
|------|-----|------|
| flagcdn.com | `https://flagcdn.com/{iso2}.svg` | 국기 이미지 |
| jsDelivr | `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | 세계 지도 TopoJSON |

### 성능 특이사항

- 대부분 서버 페이지가 `export const dynamic = 'force-dynamic'` — ISR 미사용
- 국기 이미지: `<Image unoptimized />` — Next.js 이미지 최적화 우회
- `loading.tsx`, `error.tsx` 없음 — 라우트 세그먼트 로딩/에러 UI 미구성
- 분석 없음 — Google Analytics, Vercel Analytics 미설치

---

## 14. 개발 히스토리 — Git 커밋 타임라인

```
[최신]
2addfd7  design: complete visual overhaul
dd869c8  hero redesign
ed3cca4  feat: EMBER.CARBON.INTENSITY + derived methodology section
6380c80  chore: remove unused d3-sankey and react-markdown packages
b7432b4  design: visual upgrade — gradients, glow, typography, cards
e4e988a  fix: posters nav + report card CTA blocks
c56da4f  redesign: hero + nav restructure + dashboard grouping + poster gallery + country grade badge
29a1bf5  feat: Climate Report Card — 205 countries graded + methodology + cleanup
f5ec9bb  upgrade: country page 9 sections + all indicators visualized
c621c1a  fix: dashboard redesign + remove all hardcoded 6-country refs
8953416  redesign: homepage + dashboard 215 countries + brand update
4a91ae0  data: owid 27col + climatetrace sectors all countries
e6d4e69  scale: 180 countries + classification + world map
f9fd56e  scale: 180 countries + classification + world map (first run)
6e7812d  fix: carbon inequality ratio + icon sizes
c59b953  redesign: story-driven posters with 5 poster types
6b45cc8  data: ndgain + 20country gap chart
1275f5b  scale: expand to 20 countries (add 14 new countries)
06dff0f  feat: watermark + og-image + library-links
11c8b9a  feat: spiral + divide poster charts
[이하 Phase 1-4 초기 개발 커밋들...]
```

### 주요 마일스톤

| 마일스톤 | 내용 |
|---------|------|
| Phase 0 | 인프라 셋업 — Supabase 스키마, 에이전트/스킬 구성 |
| Phase 1 | 6개 파일럿 국가 데이터 ETL (World Bank, Ember, Climate TRACE, ND-GAIN) |
| Phase 2 | 파생 지표 계산 (DERIVED.*), 분석 JSON 생성 |
| Phase 3 | 차트 컴포넌트 구축 (Sankey, Gap, Spiral, Divide) |
| Phase 4 | SEO — 메타태그, JSON-LD, 사이트맵, 가이드 콘텐츠 |
| Phase 5 | 배포 (Vercel) |
| 확장 1 | 20개국 확장 + ND-GAIN 데이터 추가 |
| 확장 2 | OWID 27컬럼 + Climate TRACE 섹터 데이터 |
| 확장 3 | 180→215→200+ 국가 확장 + 국가 분류 알고리즘 |
| 확장 4 | Climate Report Card — 205개국 5도메인 채점 |
| 디자인 | 전체 비주얼 업그레이드 (그라디언트, glow, 타이포그래피) |
| 정리 | 미사용 패키지 제거, EMBER.CARBON.INTENSITY 연결, 방법론 연결 |

---

## 15. 현재 상태 — 작동 / 미작동

### ✅ 완전히 작동 중

| 기능 | 위치 |
|------|------|
| 국가 프로파일 9개 섹션 차트 | /country/[iso3] |
| 에너지 Sankey (Pure SVG, 호버 glow) | /country, /posters |
| Climate Report Card 전체 (205개국) | /report, /report/[iso3] |
| 국가 분류 세계지도 (Changer/Starter/Talker) | / |
| 200+ 국가 대시보드 필터 | /dashboard |
| 국가 탐색 (Explore) | /explore |
| 방법론 페이지 | /methodology |
| Library 외부 링크 (8개 보고서) | /library |
| EMBER.CARBON.INTENSITY 표시 | /country Transition Progress 카드 |
| derived-methodology 인라인 표시 | /country Data Sources 아코디언 |
| SEO 메타태그 + JSON-LD | 전체 페이지 |
| PNG 내보내기 (ClimateGap, ClimateSankey) | /posters |
| 동적 인사이트 텍스트 (JSON 기반) | /country |
| 취약성 위험 프로파일 카드 | /country |

### ⚠️ 부분 작동 / 제한사항

| 이슈 | 상세 |
|------|------|
| ClimateStripes | D3 SSR 이슈로 비활성화 (홈 import 주석 처리) |
| ClimatePoster, CountryCard | 동일 SSR 이슈 |
| 사이트맵 | `/insights`, `/posters`, `/report`, `/explore` 미포함 |
| EN.ATM.PM25.MC.M3 | 2020년까지만 데이터 (2021-2023 공백) |
| DERIVED.CO2_PER_GDP 차트 | 데이터는 있으나 country 페이지에 별도 차트 없음 (Data Sources에만 노출) |
| DERIVED.EMISSIONS_INTENSITY | 144행 존재하나 앱 사용 없음 |

### ❌ 미구현 / 비활성

| 기능 | 상태 |
|------|------|
| RAG 챗봇 (/chat) | 유료화 전 보류 |
| 결제/구독 (/pricing) | 보류 |
| 인증 (/login, /signup) | 보류 |
| Vercel Analytics | 미설치 |
| loading.tsx / error.tsx | 없음 |
| ISR (Incremental Static Regeneration) | force-dynamic 사용 중 |

### 삭제된 패키지

| 패키지 | 이유 |
|--------|------|
| `d3-sankey` | Pure React SVG ClimateSankey로 교체 |
| `@types/d3-sankey` | 함께 제거 |
| `react-markdown` | 사용처 없음 |

---

*이 문서는 코드베이스와 함께 유지됩니다. 기능 추가/변경 시 해당 섹션을 업데이트하세요.*
