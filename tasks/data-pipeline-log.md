# Data Pipeline Log

> 모든 ETL 작업의 실행 기록.

---

## Format
- **Timestamp**: ISO 8601
- **Source**: 데이터 소스명
- **Indicator**: 지표 코드
- **Countries**: ISO3 목록
- **Rows inserted**: 숫자
- **Status**: SUCCESS / PARTIAL / FAILED
- **Notes**: 비고

---

## 2026-02-11 | Phase 2 Derived Indicators & Trend Analysis

### 실행 정보
- **Timestamp**: 2026-02-12T04:42:22Z ~ 2026-02-12T04:43:14Z
- **Scripts**: scripts/derived-emissions-intensity.ts, scripts/co2-trend-comparison.ts
- **Phase**: 2 (분석 — 파생 지표 및 추세 비교)
- **대상 국가**: KOR, USA, DEU, BRA, NGA, BGD (6개 파일럿)
- **연도 범위**: 2000-2023

### Task 1: 파생 지표 — 배출 집약도 (Emissions Intensity)

| 항목 | 값 |
|---|---|
| 파생 지표 코드 | DERIVED.EMISSIONS_INTENSITY |
| 공식 | EN.ATM.GHGT.KT.CE / NY.GDP.MKTP.CD |
| 단위 | kt CO2e per USD |
| 소스 테이블 | indicator_values (JOIN indicators, countries) |
| 결과 테이블 | country_data |
| 신규 지표 등록 | indicators 테이블 ID 20 (source='derived') |
| 삽입 행 수 | 144 (6개국 x 24년) |
| 검증 행 수 | 144 |
| 상태 | SUCCESS |
| 신뢰도 | HIGH (GHG + GDP 2개 소스 교차) |

#### 국가별 삽입 행 수

| Country | 행 수 |
|---|---|
| KOR | 24 |
| USA | 24 |
| DEU | 24 |
| BRA | 24 |
| NGA | 24 |
| BGD | 24 |
| **TOTAL** | **144** |

#### 최신 연도 (2023) 배출 집약도 샘플

| Country | Emissions Intensity (kt CO2e / USD) |
|---|---|
| KOR | 3.70e-7 |
| USA | 2.22e-7 |
| DEU | 1.53e-7 |
| BRA | 1.30e-6 |
| NGA | 1.07e-6 |
| BGD | 5.37e-7 |

### Task 2: CO2 1인당 배출량 추세 비교 (2000 vs 최신)

| 항목 | 값 |
|---|---|
| 소스 지표 | EN.GHG.CO2.PC.CE.AR5 (country_data 테이블) |
| 기준 연도 | 2000 |
| 비교 연도 | 2023 (최신) |
| 출력 파일 | data/analysis/co2-trend-comparison.md |
| 상태 | SUCCESS |
| 신뢰도 | MEDIUM (단일 소스 Climate Watch / WDI) |

#### 추세 비교 결과

| Rank | Country | ISO3 | 2000 Value | 2023 Value | Change % | Trend |
|---|---|---|---|---|---|---|
| 1 | United States | USA | 21.01 | 13.71 | -34.7% | Decreasing |
| 2 | Germany | DEU | 10.60 | 7.08 | -33.2% | Decreasing |
| 3 | Nigeria | NGA | 0.79 | 0.55 | -30.3% | Decreasing |
| 4 | Brazil | BRA | 2.01 | 2.27 | +13.3% | Increasing |
| 5 | South Korea | KOR | 9.92 | 11.42 | +15.1% | Increasing |
| 6 | Bangladesh | BGD | 0.20 | 0.69 | +246.1% | Increasing |

### 이슈
- 없음. 모든 6개국에 대해 두 태스크 모두 정상 완료.
- NGA의 CO2 per capita 감소 추세 (-30.3%)는 예상 밖이며, 향후 데이터 교차 검증 필요 (EDGAR 또는 Climate TRACE 대조).

---

## 2026-02-11 | Phase 2 Extended Data Collection

### 실행 정보
- **Timestamp**: 2026-02-12T04:38:50Z ~ 2026-02-12T04:38:59Z
- **Script**: scripts/etl-additional-indicators.ts
- **Phase**: 2 (확장 데이터 수집)
- **대상 국가**: KOR, USA, DEU, BRA, NGA, BGD (6개 파일럿)
- **연도 범위**: 2000-2023

### WDI API 상태
- World Bank API (api.worldbank.org) HTTP 502 Bad Gateway
- 재시도 1회 후에도 실패 -> 대체 소스 사용

### 지표별 수집 결과

| 지표 코드 | 지표명 | 단위 | 소스 | Pilot 행 수 | 국가 수 | DB 전체 행 수 | 상태 |
|---|---|---|---|---|---|---|---|
| SP.POP.TOTL | Total population | people | GitHub/datasets | 144 | 6 | 144 | SUCCESS |
| SP.URB.TOTL.IN.ZS | Urban population (% of total) | % | OWID API | 144 | 6 | 144 | SUCCESS |
| EG.FEC.RNEW.ZS | Renewable energy consumption (% of total) | % | OWID Energy CSV | 120 | 5 | 4712 | PARTIAL |
| EN.ATM.GHGT.KT.CE | Total GHG emissions | kt CO2e | OWID CO2 CSV | 144 | 6 | 144 | SUCCESS |
| NY.GDP.MKTP.CD | GDP (current US$) | current US$ | GitHub/datasets | 144 | 6 | 5002 | SUCCESS |

### 국가 x 지표 매트릭스 (삽입 행 수)

| Country | SP.POP.TOTL | SP.URB.TOTL.IN.ZS | EG.FEC.RNEW.ZS | EN.ATM.GHGT.KT.CE | NY.GDP.MKTP.CD |
|---|---|---|---|---|---|
| KOR | 24 | 24 | 24 | 24 | 24 |
| USA | 24 | 24 | 24 | 24 | 24 |
| DEU | 24 | 24 | 24 | 24 | 24 |
| BRA | 24 | 24 | 24 | 24 | 24 |
| NGA | 24 | 24 | 0 | 24 | 24 |
| BGD | 24 | 24 | 24 | 24 | 24 |
| **TOTAL** | **144** | **144** | **120** | **144** | **144** |

### 총계
- **신규/갱신 행 수**: 696
- **기존 지표 (이미 DB에 존재)**: EG.FEC.RNEW.ZS (ID 2), NY.GDP.MKTP.CD (ID 4)
- **신규 등록 지표**: SP.POP.TOTL (ID 17), SP.URB.TOTL.IN.ZS (ID 18), EN.ATM.GHGT.KT.CE (ID 19)

### 이슈/NULL
- **EG.FEC.RNEW.ZS / NGA**: OWID Energy 데이터에 나이지리아 재생에너지 비율 없음 (DATA_NOT_AVAILABLE_OWID_2000-2023)
- **WDI API 장애**: api.worldbank.org가 502 반환. 대체 소스로 수집 완료.
  - SP.POP.TOTL, NY.GDP.MKTP.CD -> GitHub datasets org (datasets/population, datasets/gdp)
  - SP.URB.TOTL.IN.ZS -> OWID API (indicator 1145573, UN World Urbanization Prospects)
  - EN.ATM.GHGT.KT.CE -> OWID CO2 data (total_ghg * 1000 to convert Mt -> kt)
  - EG.FEC.RNEW.ZS -> OWID Energy data (renewables_share_energy column)
- WDI API가 복구되면 재실행하여 1차 소스 데이터로 갱신 가능

### 데이터 소스 출처 정리
| 소스 | URL | 비고 |
|---|---|---|
| GitHub/datasets (population) | github.com/datasets/population | World Bank 원본 데이터 미러 |
| GitHub/datasets (GDP) | github.com/datasets/gdp | World Bank 원본 데이터 미러 |
| OWID CO2 | github.com/owid/co2-data | total_ghg 컬럼 (MtCO2e 단위, x1000 변환) |
| OWID Energy | github.com/owid/energy-data | renewables_share_energy 컬럼 (%) |
| OWID API | api.ourworldindata.org/v1/indicators/1145573 | UN WUP 기반 도시 인구 비율 |

---
