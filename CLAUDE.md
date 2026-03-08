# VisualClimate — CLAUDE.md (Single Source of Truth)
# 마지막 업데이트: 2026-03-07
# 다른 MD와 충돌 시 이 파일이 우선

## 1. 프로덕트 정의

### 한 줄 정의
기후 데이터를 차트와 해석 텍스트로 보여주는 오픈 플랫폼.
사이트의 모든 차트가 곧 LinkedIn 콘텐츠. 별도 콘텐츠 제작 없음.

### 무엇인가
- 200+ 국가 × 15+ 지표 × 통합 대시보드 — 기후 프로필을 10 sections + "So what?" 분석 텍스트로 보여준다
- 국가 간 비교가 가능하다
- 차트를 PNG로 다운로드해서 LinkedIn에 바로 올릴 수 있다

### 무엇이 아닌가 (지금은)
- RAG 챗봇이 아니다 (보고서 1개로는 의미 없음)

### 핵심 지표
사이트에서 뽑은 차트 PNG가 LinkedIn에 올라간 횟수 = 성공 지표

## 2. 기술 스택
| 항목 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js App Router | 16.1.6 |
| Language | TypeScript strict | ^5 |
| Styling | Tailwind CSS (라이트 테마) | ^4 |
| DB | Supabase PostgreSQL | @supabase/supabase-js ^2.95 |
| Charts | React SVG (CountryClient) + D3.js (standalone 차트 컴포넌트) | d3 ^7.9 |
| Animation | framer-motion | ^12.34 |
| PNG Export | html2canvas | ^1.4.1 |
| Icons | lucide-react | ^0.575 |
| Deploy | Vercel | `npx vercel --prod` |
| Fonts | Inter (본문), JetBrains Mono (숫자/차트) | Google Fonts |

## 3. 디자인 규칙 (절대 변경 금지)

### 색상
- 배경: `#FFFFFF` (body), `#F8F9FA` (section) — **다크 배경 절대 금지**
- `bg-slate-900`, `bg-slate-800`, `#0a0a1a`, `#0d1117` **사용 금지**
- 텍스트: `#1A1A2E` (제목), `#4A4A6A` (본문), `#8888A0` (muted)
- 액센트: `#0066FF` (기본), `#00A67E` (긍정), `#E5484D` (부정), `#F59E0B` (경고)
- 차트 팔레트: `#0066FF`, `#00A67E`, `#F59E0B`, `#E5484D`, `#8B5CF6`, `#EC4899`

### 타이포
- 폰트: Inter (본문), JetBrains Mono (stat-number, chart-value)
- 제목 font-weight: 600
- `.big-stat`: 3rem / 800 / JetBrains Mono

### CSS 변수 (globals.css :root)
`--bg-primary`, `--bg-section`, `--bg-card`, `--border-card`, `--shadow-card`,
`--accent-primary/positive/negative/warning`, `--text-primary/secondary/muted`,
`--chart-1~6`

## 4. 핵심 파일
| 파일 | 줄 | 역할 |
|------|-----|------|
| `src/app/country/[iso3]/CountryClient.tsx` | 1650 | **핵심 제품** — 10개 섹션 차트 + 인사이트 (분리 필요) |
| `src/app/country/[iso3]/page.tsx` | 589 | SSR 데이터 fetch → CountryClient에 props 전달 |
| `src/app/page.tsx` | 629 | 홈 — WorldScoreboard + HeroSearch + 국가카드 |
| `src/components/charts/` | 14개 | 독립 차트 컴포넌트 (D3 + React SVG) |
| `src/components/climate/` | — | UI 시스템 컴포넌트 |
| `src/lib/supabase/client.ts` | — | Supabase anon client |
| `src/lib/supabase/server.ts` | — | Supabase service_role client |
| `src/lib/constants.ts` | — | CLIMATE_INDICATORS, PILOT_ISO3, ALL_ISO3, CHART_COLORS |
| `src/lib/exportPng.ts` | — | exportSvgAsPng(), exportHtmlAsPng() |
| `scripts/` | 13개 | ETL 스크립트 (npx tsx 실행) |
| `public/data/` | — | Kaya 67국 JSON, NDC Gap 200+ JSON, equity-scatter.json |

## 5. DB 스키마
| 테이블 | 컬럼 | 설명 |
|--------|-------|------|
| `countries` | iso3(PK), iso2, name, region | 국가 마스터 |
| `indicators` | code(PK), name, unit, source, category | 지표 정의 |
| `country_data` | id, country_iso3, indicator_code, year, value, source | 수치 데이터 (2,016행) |

## 6. 등급 시스템
- **Climate Class**: Changer (CO2↓ + 재생에너지↑) / Starter (하나만) / Talker (둘 다 X)
- **Climate Grade**: A+(7) ~ F(0), 5개 도메인 가중 합산

## 7. 데이터 규칙

### 절대 규칙: 하드코딩 금지
- 'use client'는 인터랙션 필요한 컴포넌트만
- 데이터 fetch는 최대한 Server Component에서
- 차트 크래시 시 SafeChart(ErrorBoundary)로 격리
- PNG 내보내기: `exportSvgAsPng()`, `exportHtmlAsPng()` in `lib/exportPng.ts`
- 숫자, 국가명, 분석 텍스트를 코드에 직접 쓰지 마라
- 코드 수정 전에 관련 JSON/데이터 파일을 읽고 키 구조를 파악해라

### 데이터 소스 우선순위
1. Supabase `country_data` 테이블 (2,016행, 15개 indicator_code) — 수치 데이터
2. `data/analysis/emissions-trend-6countries.json` — 배출 CAGR, Paris 비교, 랭킹
3. `data/analysis/risk-profile-{ISO3}.json` (6개) — 취약성, 준비도, 강점, 약점, summary
4. `data/analysis/*.md` — 분석 텍스트, 방법론

### Supabase indicator_code 전체 목록
| code | 설명 | 앱 사용 |
|------|------|---------|
| EN.GHG.CO2.PC.CE.AR5 | CO2/capita | ✅ 핵심 |
| NY.GDP.PCAP.CD | GDP/capita | ✅ 핵심 |
| EMBER.RENEWABLE.PCT | 재생에너지% | ✅ 핵심 |
| EMBER.FOSSIL.PCT | 화석연료% | ✅ |
| EMBER.CARBON.INTENSITY | 전력 탄소집약도 | ⚠️ 미사용 → 활용 |
| NDGAIN.VULNERABILITY | 취약성 | ✅ 핵심 |
| NDGAIN.READINESS | 준비도 | ✅ 핵심 |
| AG.LND.FRST.ZS | 산림면적 | ⚠️ 대시보드만 |
| EG.USE.PCAP.KG.OE | 에너지사용량 | ⚠️ 대시보드만 |
| EN.ATM.PM25.MC.M3 | PM2.5 | ⚠️ 대시보드만 |
| CT.GHG.TOTAL | 총GHG | ✅ |
| DERIVED.CO2_PER_GDP | GDP당CO2 | ⚠️ 미사용 |
| DERIVED.DECOUPLING | 탈동조화 | ✅ |
| DERIVED.EMISSIONS_INTENSITY | 배출집약도 | ❌ 미사용 |
| DERIVED.ENERGY_TRANSITION | 에너지전환속도 | ⚠️ 미사용 |

### Analysis JSON 연결 규칙
| 파일 | 연결 대상 |
|------|-----------|
| emissions-trend-6countries.json | → CountryClient.tsx 배출 추세 인사이트 텍스트 |
| risk-profile-{ISO3}.json | → CountryClient.tsx 취약성 섹션 텍스트 |
| emissions-trend-6countries.md | → /insights/emissions-trend 페이지 본문 |
| derived-methodology.md | → Data Sources 또는 About 섹션 |

## 8. 사이트 구조

### 핵심 페이지 (네비게이션에 표시)
| 라우트 | 역할 | 렌더링 |
|--------|------|--------|
| `/` | WorldScoreboard + HeroSearch + 국가 카드 | Dynamic (SSR) |
| `/country/[iso3]` | **핵심 제품**: 10 sections + 동적 인사이트 | Dynamic (SSR → CSR fetch) |
| `/compare` | 국가 비교 테이블 | Dynamic |
| `/insights` | 횡단 분석 2편 | Static |
| `/explore` | 국가 탐색 + 필터 | Dynamic |
| `/posters` | 기후 포스터 벤토 그리드 | Static |

### 보조 페이지
| 라우트 | 역할 | 상태 |
|--------|------|------|
| `/dashboard` | 6개 지표 바 차트 | Dynamic, 작동 |
| `/library` | 리포트 카탈로그 | Static, 링크 미연결 |
| `/guides` | SEO 가이드 2편 (climate-data-sources, issb-s2-beginners) | Static, 작동 |
| `/report/[iso3]` | 리포트 카드 | Dynamic |
| `/learn`, `/about`, `/methodology` | 정보 페이지 | Static |

### 비활성 페이지 (현재 불필요)
/chat, /pricing, /login, /signup — 유료화 시점까지 보류

## 9. 비즈니스 모델
| 제품 | 가격 | 설명 |
|------|------|------|
| PDF Country Report | $9 | 국가별 기후 프로필 PDF 다운로드 |
| Embeddable Widget | $99-299/mo | 차트 위젯 iframe embed |
| API Access | $299-999/mo | 프로그래매틱 데이터 접근 |

## 10. 작업 규칙

### 코딩 컨벤션
- ES modules | camelCase (fn) | PascalCase (component) | kebab-case (file)
- 코드 수정 전: 관련 파일 읽기 → 키 구조 파악 → 코드 작성
- Error → STOP → read msg → root cause → fix once. 2 fails → /clear
- Build: `npm run build` (에러 제로)
- Git: commit message 형식 `feat:`, `fix:`, `docs:` 등 conventional

### 경로 별칭
- `@/*` → `./src/*` (tsconfig paths)

### Role Split
- Claude = execution (코드, ETL, 컴포넌트, D3, 빌드, 배포, git)
- Antigravity = research + content → `docs/drafts/*`
- Claude reads `docs/drafts/*` but **NEVER modifies**

### Deploy
```
npm run build && git push && npx vercel --prod
```
Production: https://visualclimate.org

## 11. 가용 도구

### 에이전트 (14개)
| 이름 | model | 용도 |
|------|-------|------|
| api-manager | sonnet | API 라우트 관리 |
| climate-data-scientist | opus | 기후 데이터 분석 |
| d3-visualization | sonnet | D3/SVG 차트 구현 |
| data-quality-auditor | sonnet | 데이터 품질 검증 |
| devops-infra | sonnet | 배포/인프라 |
| etl-pipeline | sonnet | ETL 파이프라인 |
| issb-auditor | inherit | ISSB/TCFD 프레임워크 |
| pdf-exporter | sonnet | PDF 보고서 생성 |
| physical-risk-analyst | sonnet | 물리적 기후 리스크 |
| qa-validator | sonnet | QA 검증 |
| report-embedder | inherit | (비활성 — RAG 미구현) |
| sdg-paris-analyst | sonnet | SDG/파리협정 분석 |
| seo-content | sonnet | SEO 콘텐츠 |
| ui-designer | inherit | UI/UX 디자인 |

### 스킬 (7개 Active)
data-source-catalog, indicator-map, issb-s2-mapping, ndc-gap-methodology, kaya-decomposition, climate-equity-map, design-system

### MCP 도구
Supabase MCP 12종 연결됨 (settings.local.json). DB 직접 쿼리 가능.

### 커맨드
.claude/commands/ 참조 (생성 예정)

## 12. 알려진 기술 부채
- CountryClient.tsx: 1650줄 → 섹션별 분리 필요
- PostersClient.tsx: 840줄 → 분리 검토
- etl-climatetrace.ts + etl-climate-trace.ts: 중복 가능성 → 통합 필요
- 300줄+ 파일 10개: 토큰 효율 개선 필요

## 13. 파일 크기 규칙
- 컴포넌트 파일: 400줄 이하 권장
- 400줄 초과 시 섹션 분리 필수

## 14. 작업별 파일 맵
- 차트 수정 → src/components/charts/ 만 수정
- 섹션 UI 수정 → src/components/sections/ 만 수정
- 국가 데이터 추가 → scripts/fetch-*, scripts/calculate-*, public/data/
- 링크드인 카드 → src/components/linkedin/
- 등급/분류 로직 → src/lib/constants.ts
- 포스터 → src/components/posters/
- 데이터 품질 → scripts/qa-*, data/
- SEO/메타 → src/components/seo/

## 15. 사용 가능한 커맨드
- /refactor-section <파일경로> — 큰 컴포넌트를 섹션별 분리
- /generate-linkedin-card <ISO3> <chart-type> — 1080x1080 링크드인 카드 생성
- /add-country <ISO3> — 새 국가 전체 데이터 파이프라인
- /data-audit [ISO3] — 데이터 품질 감사
- /linkedin-caption <ISO3> <chart-type> — 링크드인 캡션 3종 생성
