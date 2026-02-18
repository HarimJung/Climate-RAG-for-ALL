# VisualClimate — CLAUDE.md (Single Source of Truth)
# 마지막 업데이트: 2026-02-18
# 다른 MD와 충돌 시 이 파일이 우선

## 1. 프로덕트 정의

### 한 줄 정의
기후 데이터를 차트와 해석 텍스트로 보여주는 오픈 플랫폼.
사이트의 모든 차트가 곧 LinkedIn 콘텐츠. 별도 콘텐츠 제작 없음.

### 무엇인가
- 6개 파일럿 국가의 기후 프로필을 차트 + "So what?" 분석 텍스트로 보여준다
- 국가 간 비교가 가능하다
- 차트를 PNG로 다운로드해서 LinkedIn에 바로 올릴 수 있다

### 무엇이 아닌가 (지금은)
- $79 SaaS가 아니다 (유료화는 트래픽 확보 후)
- RAG 챗봇이 아니다 (보고서 1개로는 의미 없음)
- 250개국 플랫폼이 아니다 (6개국 파일럿)

### 핵심 지표
사이트에서 뽑은 차트 PNG가 LinkedIn에 올라간 횟수 = 성공 지표

## 2. 기술 스택
Next.js 16 App Router | TypeScript strict | Tailwind (라이트 테마) | Supabase PG | D3.js client-only | Vercel

## 3. 디자인 규칙
- 배경: #FFFFFF (body), #F8F9FA (section) — 다크 배경 절대 금지
- bg-slate-900, bg-slate-800, #0a0a1a, #0d1117 사용 금지
- 텍스트: #1A1A2E (제목), #4A4A6A (본문)
- 액센트: #0066FF (기본), #00A67E (긍정), #E5484D (부정)
- 폰트: Inter, 제목 font-weight 600

## 4. 데이터 규칙

### 절대 규칙: 하드코딩 금지
- 숫자, 국가명, 분석 텍스트를 코드에 직접 쓰지 마라
- 코드 수정 전에 관련 JSON/데이터 파일을 cat으로 읽고 키 구조를 파악해라

### 데이터 소스 우선순위
1. Supabase country_data 테이블 (2,016행, 15개 indicator_code) — 수치 데이터
2. data/analysis/emissions-trend-6countries.json — 배출 CAGR, Paris 비교, 랭킹
3. data/analysis/risk-profile-{ISO3}.json (6개) — 취약성, 준비도, 강점, 약점, summary
4. data/analysis/*.md — 분석 텍스트, 방법론

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

## 5. 사이트 구조

### 핵심 페이지 (네비게이션에 표시)
| 라우트 | 역할 | 데이터 소스 |
|--------|------|------------|
| / | Key Findings 3개 + 국가 카드 6개 | 홈페이지만 하드코딩 허용 (갱신 1년) |
| /country/[iso3] | 핵심 제품: 차트 5개 + 동적 인사이트 | Supabase + analysis JSON |
| /compare | 국가 비교 테이블 | Supabase |
| /insights | 횡단 분석 2편 | analysis JSON/MD |

### 보조 페이지 (푸터에만)
| 라우트 | 역할 | 상태 |
|--------|------|------|
| /dashboard | 6개 지표 바 차트 | 작동 |
| /library | 리포트 카탈로그 | 링크 미연결 |
| /guides | SEO 가이드 2편 | 작동 |

### 비활성 페이지 (현재 불필요)
/chat, /pricing, /login, /signup — 유료화 시점까지 보류

## 6. 파일럿 국가
| ISO3 | Country | 핵심 스토리 |
|------|---------|------------|
| KOR | South Korea | 파리 후 감속 -2.85pp, 재생에너지 OECD 최하위 9.6% |
| USA | United States | 최대 역사적 배출국, 디커플링 선두 +6.35 |
| DEU | Germany | 재생에너지 54.4%, 에너지 전환 리더 |
| BRA | Brazil | 재생전력 89%, 산림 벌채 리스크 |
| NGA | Nigeria | PM2.5 WHO 11배, 아프리카 최대 경제 |
| BGD | Bangladesh | CO₂ +246%, 1인당 미국의 1/17, 최취약국 |

## 7. 현재 핵심 문제 (DIAGNOSIS.md 기반, 우선순위순)
1. CountryClient InsightText가 KOR 하드코딩 → 6개국 동적화 필수
2. /insights/climate-vulnerability 다크 테마 → 라이트 전환
3. /insights/emissions-trend 차트 내부 다크 색상 → 라이트
4. data/analysis/ JSON이 앱에서 미사용 → import 연결
5. 홈페이지 "250 countries" → "6 pilot countries"

## 8. 작업 규칙
- 코드 수정 전: cat으로 관련 파일 읽기 → 키 구조 파악 → 코드 작성
- ES modules | camelCase (fn) | PascalCase (component) | kebab-case (file)
- Error → STOP → read msg → root cause → fix once. 2 fails → /clear
- Build: npm run build (에러 제로)
- Git: commit message "[Phase X] desc"

## 9. Role Split
- Claude = execution (코드, ETL, 컴포넌트, D3, 빌드, 배포, git)
- Antigravity = research + content → docs/drafts/*
- Claude reads docs/drafts/* but NEVER modifies
