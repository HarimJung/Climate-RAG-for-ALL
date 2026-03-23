# VisualClimate — Project Diagnosis Report
Generated: 2026-02-18

---

## A. 데이터 자산

### Supabase 테이블 현황

| 테이블 | 행 수 | 주요 컬럼 | 용도 |
|--------|-------|-----------|------|
| `countries` | 250 | iso3, name, region, sub_region, income_group, population, lat, lng, flag_url, iso2 | 전 세계 국가 기본 정보 |
| `country_data` | 2,016 | country_iso3, indicator_code, year, value, source | **앱이 실제 읽는 메인 데이터 테이블** |
| `indicators` | 22 | code, name, unit, category, domain, issb_s2_ref, sdg_target | 지표 메타데이터 |
| `indicator_values` | 15,381 | indicator_id, country_id, year, value | **레거시 테이블 — 앱에서 미사용** |

> ⚠️ `indicator_values`(15k rows)는 아무 페이지에서도 읽지 않음. 구버전 스키마 잔재. 정리 필요.

### country_data 지표별 분포 (6개국 × 각 지표)

| indicator_code | 행 수 | 설명 | 앱 사용 여부 |
|----------------|-------|------|-------------|
| EN.GHG.CO2.PC.CE.AR5 | 144 | CO2/capita (WB) | ✅ 핵심 사용 |
| NY.GDP.PCAP.CD | 144 | GDP/capita (WB) | ✅ 핵심 사용 |
| EMBER.RENEWABLE.PCT | 144 | 재생에너지 비율 | ✅ 핵심 사용 |
| EMBER.FOSSIL.PCT | 144 | 화석연료 비율 | ✅ country profile |
| EMBER.CARBON.INTENSITY | 144 | 전력 탄소집약도 | ⚠️ DB만 있고 표시 없음 |
| NDGAIN.VULNERABILITY | 144 | 취약성 지수 | ✅ 핵심 사용 |
| NDGAIN.READINESS | 144 | 적응 준비도 | ✅ 핵심 사용 |
| AG.LND.FRST.ZS | 144 | 산림 면적 % | ⚠️ dashboard만 (미활용) |
| EG.USE.PCAP.KG.OE | 144 | 에너지 사용량/capita | ⚠️ dashboard만 (미활용) |
| DERIVED.CO2_PER_GDP | 144 | 탄소집약도/GDP | ⚠️ DB만 있고 표시 없음 |
| DERIVED.DECOUPLING | 138 | 탈동조화 지수 | ✅ country profile |
| DERIVED.EMISSIONS_INTENSITY | 144 | 배출 집약도 | ❌ 완전 미사용 |
| DERIVED.ENERGY_TRANSITION | 114 | 에너지전환 속도 | ⚠️ country profile 미연결 |
| EN.ATM.PM25.MC.M3 | 126 | PM2.5 | ⚠️ dashboard만 |
| CT.GHG.TOTAL | 54 | 총 GHG (Climate TRACE) | ✅ comparison chart |

**총계**: 6개국 × 15개 indicator_code × 약 24년치 = **2,016 행**

### data/analysis/ 파일 현황

| 파일 | 내용 | 앱 사용 여부 |
|------|------|-------------|
| `emissions-trend-6countries.json` | CAGR, Paris비교, 탈동조화, 에너지전환 랭킹 | ❌ **미사용** — page.tsx에 동일값 하드코딩 |
| `risk-profile-KOR/USA/DEU/BRA/NGA/BGD.json` | 6개국 리스크 프로파일 (영/한) | ❌ **미사용** — vulnerability page에 하드코딩 |
| `co2-trend-comparison.md` | CO2 추세 분석 텍스트 | ❌ 미사용 |
| `emissions-trend-6countries.md` | 배출 트렌드 마크다운 분석 | ❌ 미사용 |
| `derived-methodology.md` | 지표 계산 방법론 | ❌ 미사용 |
| `data/climate-trace-ghg.json` | Climate TRACE 원본 | ❌ 미사용 (ETL 완료 후 잔존) |
| `data/ember-electricity.json` | Ember 원본 | ❌ 미사용 |
| `data/ndgain-scores.json` | ND-GAIN 원본 | ❌ 미사용 |
| `data/owid-energy-data.csv` | OWID 에너지 데이터 | ❌ 미사용 |

> ⚠️ `data/analysis/` 폴더의 JSON/MD 파일이 **단 하나도 앱에서 import되지 않음**. 페이지 코드에 동일 값이 하드코딩되어 있어 중복 상태.

---

## B. 페이지 현황

### 전체 라우트 목록

| 라우트 | 타입 | 데이터 소스 | 실데이터 표시 | 테마 |
|--------|------|------------|--------------|------|
| `/` | Dynamic (SSR) | Supabase `country_data`, `countries`, `indicators` | ✅ StatCards, 국가별 CO2+Renewable | ✅ Light |
| `/dashboard` | Dynamic (SSR) | Supabase `country_data` (CLIMATE_INDICATORS 6개) | ✅ BarChart (6개 지표) | ✅ Light |
| `/compare` | Dynamic (SSR) | Supabase `country_data` + `countries` (250개국) | ✅ 비교 테이블 | ✅ Light |
| `/country/[iso3]` | Dynamic (SSR) | Supabase (15개 indicator_code 전체) | ✅ 5개 D3 차트 + StatCards | ✅ Light |
| `/insights` | Static | 하드코딩 | ✅ 인덱스 카드 2개 | ✅ Light |
| `/insights/emissions-trend` | Static | 하드코딩 (analysis JSON 미사용) | ✅ D3 멀티라인 + 테이블들 | ⚠️ 차트 내부 Dark |
| `/insights/climate-vulnerability` | Static | 하드코딩 (risk-profile JSON 미사용) | ✅ 스캐터 + 국가 카드 | ❌ **전체 Dark** |
| `/library` | Static | 하드코딩 8개 리포트 | ⚠️ 카드만 있고 링크 없음 | ✅ Light |
| `/guides` | Static | 하드코딩 2개 가이드 | ✅ 링크 페이지 | ✅ Light |
| `/guides/climate-data-sources` | Static | 하드코딩 | ✅ 가이드 텍스트 | ✅ Light |
| `/guides/issb-s2-beginners` | Static | 하드코딩 | ✅ 가이드 텍스트 | ✅ Light |

### 데이터 페치 방식

- **SSR 페이지** (`/`, `/dashboard`, `/compare`, `/country/[iso3]`): `createServiceClient()` → Supabase REST, `force-dynamic`
- **Static 페이지** (`/insights/*`, `/library`, `/guides/*`): 데이터 페치 없음, 모두 하드코딩
- **CountryPage**: 가장 복잡 — 단일 요청으로 15개 지표 전체 가져온 후 서버에서 시리즈 구성, 클라이언트에 props 전달

### 실데이터 vs 빈 화면

- **실데이터 표시**: `/dashboard`, `/compare`, `/country/KOR` (+ 다른 5개 파일럿)
- **의심 케이스**: 6개 파일럿 외 국가는 `/country/[iso3]` 진입 시 `notFound()` 반환 (countries 테이블에는 있지만 `country_data`에 없음)

---

## C. 컴포넌트 현황

### 차트 컴포넌트

| 컴포넌트 | 위치 | 사용처 | 테마 | 비고 |
|----------|------|--------|------|------|
| `BarChart` | `src/components/charts/BarChart.tsx` | DashboardClient | ✅ Light | 재사용 가능, href 클릭 지원 |
| `LineChart` | `src/components/charts/LineChart.tsx` | **미사용** | ✅ Light | 존재하지만 import 없음 |
| `DonutChart` | `src/components/charts/DonutChart.tsx` | **미사용** | 미확인 | CountryClient가 inline EnergyDonut 사용 |
| `WorldMap` | `src/components/charts/WorldMap.tsx` | **미사용** | 미확인 | 단 하나의 페이지에도 없음 |
| `EmissionsTrendChart` | `insights/emissions-trend/chart.tsx` | emissions-trend page | ❌ **Dark 색상** | 데이터 하드코딩, dark grid |
| `VulnerabilityChart` | `insights/climate-vulnerability/chart.tsx` | vulnerability page | ❌ Dark | 미확인 내용 |
| `EmissionsChart` (inline) | `CountryClient.tsx` | country profile | ✅ Light | 재사용 불가 inline |
| `ComparisonChart` (inline) | `CountryClient.tsx` | country profile | ✅ Light | 재사용 불가 inline |
| `EnergyDonut` (inline) | `CountryClient.tsx` | country profile | ✅ Light | DonutChart 컴포넌트 무시하고 재구현 |
| `DecouplingChart` (inline) | `CountryClient.tsx` | country profile | ✅ Light | 재사용 불가 inline |
| `VulnerabilityScatter` (inline) | `CountryClient.tsx` | country profile | ✅ Light | 재사용 불가 inline |

### 구조적 문제

- **Header/Footer 중복**: `src/components/Header.tsx` + `src/components/layout/Header.tsx` 동시 존재 (어떤 것이 실제 사용되는지 확인 필요)
- **재사용 가능 vs 하드코딩**: `BarChart`, `LineChart`는 재사용 가능. CountryClient의 5개 차트는 inline 하드코딩. DonutChart, WorldMap은 존재하나 미사용.
- **CountryClient 인사이트 텍스트**: `InsightText` 컴포넌트 내용이 **한국 고정 텍스트**. 다른 국가(USA, DEU 등) 방문 시 "Korea reaches 50% renewable by 2064" 등 잘못된 분석 표시됨.

---

## D. 콘텐츠 자산

### 외부 공유 가능한 것들

1. **국가 프로필 `/country/KOR`** — 5개 D3 차트(배출 추세, WB vs Climate TRACE 비교, 에너지믹스 도넛, GDP vs CO2 탈동조화, 취약성 스캐터), StatCard 4개, Data Sources 테이블. 가장 완성도 높음.
2. **Emissions Trend 페이지 `/insights/emissions-trend`** — 멀티라인 D3, CAGR 테이블, Paris Agreement 비교, 탈동조화 카드, 에너지전환 바. 데이터 밀도 높음.
3. **비교 페이지 `/compare?countries=KOR,USA,DEU`** — 테이블형 비교, 인라인 바 시각화.

### LinkedIn 공유 가능 품질 여부

**현재 스크린샷 바로 올릴 수 있는 페이지**: `/country/KOR` (라이트 테마, 실제 D3 차트 5개)

**그러나 문제점**:
- `/insights/climate-vulnerability`는 전체가 다크 테마 — 나머지와 일관성 없음
- `EmissionsTrendChart` 내부 그리드 색상이 다크(`#1e293b`) — 라이트 배경 위에 dark 차트
- CountryClient `InsightText`가 KOR 전용 텍스트 하드코딩 — 다른 국가 방문 시 오분석

---

## E. 핵심 문제 Top 5

### 1. 🔴 [높음] `insights/climate-vulnerability` — 전체 다크 테마
사이트 전체가 라이트 테마로 전환됐지만 이 페이지만 `bg-slate-900`, `text-slate-400`, `emerald-400` 사용. 네비게이션하면 배경이 완전히 바뀌어 브랜드 일관성 파괴.

### 2. 🔴 [높음] CountryClient 인사이트 텍스트 — KOR 하드코딩
`InsightText` 4개 블록이 모두 "Korea", "한국", "9.6% renewable" 등 KOR 고정 문자열. USA, DEU, BGD 방문 시 틀린 분석이 표시됨. 사이트 신뢰도 직결.

### 3. 🟡 [중간] 홈페이지 3초 내 이해 불가
"Climate Intelligence for Sustainability Professionals" — 너무 추상적. 폴드 위에 실제 차트나 숫자가 없음. 방문자가 "여기서 뭘 볼 수 있나?"를 3초 안에 파악하기 어려움. StatCard가 아래쪽에 있고 수치가 작음.

### 4. 🟡 [중간] `data/analysis/` JSON과 페이지 코드가 분리된 이중 진실
`emissions-trend-6countries.json`의 CAGR 데이터가 `insights/emissions-trend/page.tsx`에 그대로 복붙되어 있음. JSON 업데이트 시 페이지 코드도 별도로 수정해야 하는 유지보수 위험. risk-profile JSON 6개도 동일.

### 5. 🟡 [중간] Library 페이지 — 링크 없는 리포트 목록
8개 리포트 카드가 있지만 클릭해도 아무 곳에도 안 감 (Link 아님). "1000+ Pages Searchable" 통계를 표시하지만 검색 기능 없음. RAG 챗 기능도 있는데 Library와 연결 안 됨.

---

## F. 할 수 있는 것 vs 해야 하는 것

### 추가 API 없이 지금 당장 만들 수 있는 것

| 작업 | 소요 | 임팩트 |
|------|------|--------|
| climate-vulnerability 페이지 라이트 테마 전환 | 30분 | 즉각적 — 브랜드 일관성 회복 |
| CountryClient InsightText를 동적 props로 교체 | 1-2시간 | 신뢰도 즉각 향상 |
| EmissionsTrendChart 차트 색상 light로 교체 | 20분 | 즉각적 |
| data/analysis JSON → page import로 교체 (하드코딩 제거) | 1시간 | 유지보수성 |
| Library 리포트 카드 → 외부 링크 (PDF) | 30분 | UX |
| 홈페이지 폴드 위에 key stat 바 또는 미니 차트 추가 | 2-3시간 | 임팩트 대 |
| country profile insight text를 countryName 기반 동적 생성 | 2-3시간 | 신뢰도 핵심 |

### 추가 데이터 수집이 필요한 것

- 파일럿 외 국가 country_data (현재 6개국만)
- 시계열 차트용 멀티라인 (현재 country profile은 1개국만 라인 표시)
- 비교 페이지 차트 (현재 테이블만, D3 시각화 없음)

### LinkedIn 주목을 받기 위해 가장 먼저 고쳐야 할 한 가지

**CountryClient의 KOR 하드코딩 인사이트 텍스트를 모든 6개국 동적 버전으로 교체.**

이유: `/country/KOR` 스크린샷은 LinkedIn 게시물로 올릴 수 있는 완성도가 있음. 그런데 다른 국가 링크를 공유하면 "Korea reaches 50% renewable" 같은 잘못된 분석이 그대로 표시되어 즉각적인 신뢰도 타격. 이걸 고치면 6개국 모두 공유 가능한 국가 프로필 페이지가 생기고, 각 국가 프로필마다 LinkedIn 포스트를 쓸 수 있게 됨.

---

## 요약

```
총 페이지: 11 (Static 7 + Dynamic 4)
총 DB 행: 2,016 (country_data) + 15,381 (indicator_values, 미사용)
총 국가: 250 (countries 테이블) / 실데이터: 6개국
총 지표: 22 (indicators) / 앱 사용: 11개
총 차트 컴포넌트: 10 / 실제 렌더링: 7

라이트 테마 완료: 10/11 페이지
남은 다크: /insights/climate-vulnerability (전체), emissions-trend 차트 내부

다음 우선순위:
1. climate-vulnerability 라이트 테마 (30분)
2. CountryClient 인사이트 동적화 (2시간)
3. EmissionsTrendChart 색상 수정 (20분)
```
