# 컴포넌트 맵 + .claude 구조

## 차트 컴포넌트 (src/components/charts/)
| 컴포넌트 | 줄 | 용도 |
|----------|-----|------|
| ClimateGap | 267 | 6국 slope chart (CO2 추세) |
| ClimateSankey | 288 | Sankey 다이어그램 |
| NDCGapChart | 238 | NDC 목표 vs 실제 갭 |
| KayaWaterfall | 251 | Kaya decomposition waterfall |
| ClimatePoster | 229 | 포스터용 차트 카드 |
| EquityScatter | 202 | CO2/capita vs GDP scatter |
| WorldScoreboard | 190 | 홈 세계 스코어보드 |
| ClimateSpiral | 181 | 기온 스파이럴 |
| ClimateDivide | 179 | 기후 격차 시각화 |
| WorldMap | 172 | D3 세계 지도 |
| ClimateStripes | 172 | 기온 스트라이프 |
| CountryCard | 154 | 홈 국가 카드 |
| LineChart | 126 | 범용 라인차트 |
| DonutChart | 116 | 도넛 차트 |

## 섹션 컴포넌트 (src/components/sections/)
5개 TSX — 도메인별 섹션 렌더링

## 포스터 컴포넌트 (src/components/posters/)
6개 TSX — 6종 포스터 타입별 렌더링

## LinkedIn 카드 (src/components/linkedin/)
2개 TSX — LinkedIn 공유용 카드

## SEO (src/components/seo/)
2개 TSX — 메타태그, JSON-LD

## CountryClient 10개 섹션
1. Hero (국기, 국가명, Report Card 등급)
2. Emissions (CO2/capita 추세 라인차트 + CAGR 인사이트)
3. Energy (재생에너지 vs 화석연료 비율)
4. Emission Sources (CTRACE 9개 섹터 바차트) — client fetch
5. Fossil Fuel (OWID 연료별 시계열) — client fetch
6. Historical Responsibility (누적 CO2, 점유율, 온도 기여) — client fetch
7. Beyond CO2 (메탄, N2O, 총 GHG) — client fetch
8. Economy (GDP vs CO2 탈동조화)
9. Vulnerability (ND-GAIN 취약성/준비도 + risk-profile JSON)
10. Data Sources (출처 목록)

---

## .claude 구조

### 에이전트 (14개, 13 PASS + 1 INACTIVE)
| 에이전트 | 역할 | 팀 |
|----------|------|-----|
| climate-data-scientist | 데이터 분석, 지표 설계 | Climate Director |
| sdg-paris-analyst | SDG/파리협정 매핑 | Climate Director |
| issb-auditor | ISSB S2 감사 | Climate Director |
| api-manager | API 설계, 인증 | Tech Architect |
| etl-pipeline | 데이터 수집/변환 | Tech Architect |
| devops-infra | 배포, CI/CD | Tech Architect |
| pdf-exporter | PDF 생성 | Tech Architect |
| d3-visualization | D3 차트 구현 | Visual Designer |
| ui-designer | UI 컴포넌트 | Visual Designer |
| data-quality-auditor | 데이터 품질 검증 | Data Scientist |
| qa-validator | QA 테스트 | Data Scientist |
| physical-risk-analyst | 물리적 리스크 | Data Scientist |
| seo-content | SEO, 콘텐츠 | Growth Lead |
| report-embedder | INACTIVE | - |

### 스킬 (7개 활성)
data-source-catalog, indicator-map, issb-s2-mapping, ndc-gap-methodology, kaya-decomposition, climate-equity-map, design-system

### 커맨드 (11개)
| 커맨드 | 용도 |
|--------|------|
| /refactor-section <path> | 큰 컴포넌트 분할 |
| /generate-linkedin-card <ISO3> <type> | 1080x1080 LinkedIn 카드 |
| /add-country <ISO3> | 새 국가 전체 파이프라인 |
| /data-audit [ISO3] | 데이터 품질 감사 |
| /linkedin-caption <ISO3> <type> | LinkedIn 캡션 3종 |
| /fix-broken-page <page> | 버그 페이지 수정 |
| /expand-explore | Explore 250개국 확장 |
| /deploy | git add → commit → push |
| /daily-content <ISO3> | 일일 LinkedIn 콘텐츠 |
| /memory-save | 현재 세션 기억 저장 |
| /full-audit | 전체 시스템 감사 |
