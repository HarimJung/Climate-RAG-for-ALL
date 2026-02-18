# VisualClimate — Product & Technical Specification

> 최종 업데이트: 2026-02-09
> 문서 목적: 개발 현황 총망라 + 사업 구조 설계 + 기술 개발 로드맵
> 대상 독자: AI 엔지니어, ESG 도메인 전문가, 비즈니스 어드바이저

---

## 1. 프로덕트 정의

### 1.1 한 줄 정의
> **"ESG 컨설턴트가 국가별 기후 리스크 비교 브리프를 3일이 아닌 10초에 만들 수 있는 플랫폼"**

### 1.2 무엇이 아닌가
- 기후 데이터 뷰어가 **아님** (World Bank가 이미 함)
- 범용 AI 챗봇이 **아님** (ChatGPT/Claude가 이미 함)
- 엔터프라이즈 ESG 플랫폼이 **아님** (MSCI/Sustainalytics 영역)

### 1.3 무엇인가
**"구조화된 기후 데이터 + 권위 있는 보고서 인용 + 비교 분석"을 하나의 워크플로우로 합친 도구.**

핵심 차별점:
1. **비교**: 여러 국가를 한 화면에서 비교 (World Bank는 불가)
2. **인용 가능**: 실제 데이터 수치 + IPCC 등 원문 인용 (ChatGPT는 숫자를 지어냄)
3. **즉시 납품물**: 브리프가 곧 클라이언트 딜리버러블 (엑셀 수작업 대체)
4. **가격**: $79/월 (Bloomberg $24,000/년, MSCI $50,000+/년의 1/300)

---

## 2. 타겟 사용자

### 2.1 Primary Persona: 프리랜서/소규모 ESG 컨설턴트

| 항목 | 내용 |
|------|------|
| 직함 | ESG Consultant, Sustainability Advisor, Climate Risk Analyst |
| 조직 규모 | 1~20인 독립 컨설팅, Big 4 소속 주니어~미들 |
| 연 수입 | $60,000 ~ $150,000 |
| 청구 단가 | 시간당 $200~$500 |
| 도구 | Excel, PowerPoint, World Bank 웹사이트, Google Scholar, ChatGPT |
| 못 사는 것 | Bloomberg Terminal ($24K), MSCI ESG ($50K+), Refinitiv ($20K+) |
| 핵심 불만 | "같은 데이터 수집 작업을 매번 반복한다" |

### 2.2 사용 시나리오 (As-Is → To-Be)

**현재 (As-Is):**
1. 클라이언트: "베트남, 인도네시아, 필리핀 기후 리스크 비교해주세요"
2. 컨설턴트: World Bank 접속 → 국가별 CO2, 재생에너지, GDP 각각 검색 (3시간)
3. Climate Watch 접속 → GHG 배출 추이 수집 (2시간)
4. IPCC/TCFD 보고서 Ctrl+F → 관련 문단 발췌 (3시간)
5. Excel에 비교 테이블 수작업 (2시간)
6. 내러티브 작성 + 출처 달기 (4시간)
7. PPT/PDF 포맷팅 (2시간)
8. **총 소요: 2~3일 (16~24시간)**

**목표 (To-Be):**
1. VisualClimate `/compare?countries=VNM,IDN,PHL` 접속
2. 비교 테이블 즉시 확인 (0초)
3. "Generate Brief" 클릭 → AI 요약 + IPCC 인용 (10초)
4. PDF 내보내기 → 클라이언트에 전달 (30초)
5. **총 소요: 1분 미만**

### 2.3 ROI 계산
- 절약 시간: 프로젝트당 ~16시간
- 컨설턴트 시급: $300
- 프로젝트당 절약 가치: **$4,800**
- VisualClimate 월 구독료: $79
- **ROI: 첫 프로젝트 30분 만에 구독료 회수**

---

## 3. 현재 개발 현황

### 3.1 기술 스택

| 레이어 | 기술 | 상태 |
|--------|------|------|
| 프레임워크 | Next.js 16.1.6 (App Router, Turbopack) | 완료 |
| 언어 | TypeScript (strict mode) | 완료 |
| 스타일링 | Tailwind CSS | 완료 |
| DB | Supabase (PostgreSQL + pgvector) | 완료 |
| 벡터 검색 | pgvector + match_report_chunks RPC | 완료 |
| AI 임베딩 | OpenAI text-embedding-3-small (1536차원) | 완료 |
| AI 생성 | OpenAI gpt-4o-mini | 완료 |
| 차트 | D3.js (WorldMap, BarChart, LineChart) | 완료 |
| 인증 | Supabase Auth (이메일+비밀번호) | 완료 |
| 결제 | Stripe (Checkout + Webhook) | 코드 완료, 키 미설정 |
| 배포 | Vercel 대상 | 미배포 |

### 3.2 데이터베이스 스키마

```
countries (250 rows)
├── id, iso3, name, region, sub_region, income_group
├── population, lat, lng, flag_url
└── RLS: public read

indicators (6 rows)
├── id, source, code, name, unit, category
├── unique(source, code)
└── RLS: public read

indicator_values (14,939 rows)
├── indicator_id (FK → indicators)
├── country_id (FK → countries)
├── year, value
├── unique(indicator_id, country_id, year)
└── RLS: public read

reports (3 rows, 1개만 유효)
├── id, title, org, url, published_date, tags, summary
└── RLS: public read

report_chunks (120 rows)
├── report_id (FK → reports)
├── chunk_index, content
├── embedding vector(1536)
└── RLS: public read

email_signups — 이메일 수집
user_profiles — 사용자 플랜/Stripe 연동
```

### 3.3 보유 데이터 상세

#### 국가 데이터 (250개국)
| 소스 | 지표 | 코드 | 단위 | 기간 | 건수 |
|------|------|------|------|------|------|
| World Bank | Renewable energy consumption (% of total) | EG.FEC.RNEW.ZS | % | 2000~2021 | 4,702 |
| World Bank | Population affected by climate disasters (%) | EN.CLC.MDAT.ZS | % | 2000~2009 | 168 |
| World Bank | GDP (current US$) | NY.GDP.MKTP.CD | US$ | 2000~2023 | 5,002 |
| World Bank | Forest area (% of land) | AG.LND.FRST.ZS | % | 2000~2022 | 5,043 |
| World Bank | CO2 per capita | EN.ATM.CO2E.PC | metric tons | — | **0 (API 빈응답)** |
| Climate Watch | Total GHG Emissions | TOTAL_GHG | MtCO2e | 2000~2021 | 24 |

**문제점:**
- CO2 per capita (가장 중요한 지표)가 0건 — World Bank API에서 빈 응답
- Climate Watch에서 겨우 24건만 수집 (API가 50개국만 반환)
- 전체 14,939건 중 실질적으로 의미 있는 비교가 가능한 건 재생에너지, GDP, 산림면적 3개 지표뿐

#### 보고서 임베딩
| 보고서 | 조직 | Chunks | 상태 |
|--------|------|--------|------|
| IPCC AR6 Synthesis Report SPM | IPCC | 120 | 임베딩 완료 |
| UNEP Emissions Gap Report 2024 | UNEP | 0 | 다운로드 실패 (403) |
| WMO State of Global Climate 2024 | WMO | 0 | URL이 PDF 직링크 아님 |

**문제점:**
- 보고서 1개로는 RAG가 사실상 무용. 최소 20~30개 필요
- 국가별 특화 정보(NDC, 국가 기후 계획 등)가 전무

### 3.4 현재 페이지/기능 목록

| 경로 | 기능 | 상태 | 품질 |
|------|------|------|------|
| `/` | 랜딩페이지 | 완료 | 제네릭, 가치 제안 불명확 |
| `/compare` | **국가 비교 + AI 브리프** | 완료 | **핵심 기능, 작동함** |
| `/dashboard` | 세계지도 + 지표 시각화 | 완료 | 데이터 부족으로 허전 |
| `/country/[iso3]` | 국가 프로파일 | 완료 | 지표 카드 + 트렌드 차트 |
| `/chat` | RAG 채팅 | 완료 | 보고서 부족으로 답변 품질 낮음 |
| `/guides` | 가이드 목록 | 완료 | 정적 콘텐츠 2개 |
| `/guides/climate-data-sources` | 데이터 소스 가이드 | 완료 | SEO용 콘텐츠 |
| `/guides/issb-s2-beginners` | ISSB S2 가이드 | 완료 | SEO용 콘텐츠 |
| `/library` | 리포트 라이브러리 | 완료 | 거의 빈 페이지 |
| `/pricing` | 요금제 | 완료 | UI만 존재 |
| `/login` | 로그인 | 완료 | Supabase Auth |
| `/signup` | 회원가입 | 완료 | user_profiles 자동 생성 |
| `/api/rag` | RAG API | 완료 | 임베딩→벡터검색→GPT |
| `/api/stripe/checkout` | 결제 세션 | 완료 | Stripe 키 미설정 |
| `/api/stripe/webhook` | 결제 웹훅 | 완료 | 플랜 업데이트 로직 |
| `/sitemap.xml` | SEO 사이트맵 | 완료 | — |
| `/robots.txt` | SEO | 완료 | — |

### 3.5 파일 구조

```
src/
├── app/
│   ├── page.tsx                    # 랜딩
│   ├── layout.tsx                  # 글로벌 레이아웃 (Header/Footer)
│   ├── compare/
│   │   ├── page.tsx                # 비교 페이지 (서버)
│   │   └── CompareClient.tsx       # 비교 UI (클라이언트)
│   ├── dashboard/
│   │   ├── page.tsx                # 대시보드 데이터 fetch
│   │   └── DashboardClient.tsx     # 대시보드 UI
│   ├── country/[iso3]/
│   │   ├── page.tsx                # 국가 프로파일 데이터 fetch
│   │   └── CountryClient.tsx       # 국가 차트 UI
│   ├── chat/page.tsx               # RAG 챗 페이지
│   ├── library/page.tsx            # 리포트 라이브러리
│   ├── guides/                     # 정적 가이드 페이지들
│   ├── pricing/page.tsx            # 요금제
│   ├── login/page.tsx              # 로그인
│   ├── signup/page.tsx             # 회원가입
│   └── api/
│       ├── rag/route.ts            # RAG 엔드포인트
│       └── stripe/
│           ├── checkout/route.ts   # Stripe Checkout
│           └── webhook/route.ts    # Stripe Webhook
├── components/
│   ├── charts/
│   │   ├── WorldMap.tsx            # D3 세계지도
│   │   ├── BarChart.tsx            # D3 막대차트
│   │   └── LineChart.tsx           # D3 라인차트
│   ├── rag/ChatPanel.tsx           # 채팅 UI
│   ├── layout/
│   │   ├── Header.tsx              # 네비게이션
│   │   └── Footer.tsx              # 푸터
│   ├── IndicatorSelector.tsx       # 지표 선택 드롭다운
│   └── EmailSignupForm.tsx         # 이메일 수집 폼
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # 브라우저용 (createBrowserClient)
│   │   └── server.ts               # 서버용 (service_role)
│   ├── openai.ts                   # OpenAI lazy getter
│   ├── stripe.ts                   # Stripe lazy getter
│   ├── constants.ts                # PLANS, CLIMATE_INDICATORS
│   └── auth.ts                     # checkPlanAccess, getRagLimit, canUseRag
scripts/
├── seed-countries.ts               # REST Countries → Supabase
├── fetch-worldbank.ts              # World Bank API → indicator_values
├── fetch-climatewatch.ts           # Climate Watch API → indicator_values
└── embed-reports.ts                # PDF → chunks → OpenAI embedding → Supabase
supabase/migrations/
└── 001_schema.sql                  # 전체 스키마 + RLS + vector search function
```

---

## 4. 비즈니스 모델

### 4.1 요금제 구조 (현재 설계)

| 플랜 | 가격 | 대상 | 핵심 가치 |
|------|------|------|-----------|
| Free | $0 | 탐색 사용자 | 3개국 프로파일/월, 비교 제한 |
| Pro | $79/월 | 프리랜서 컨설턴트 | 무제한 비교 + AI 브리프 + PDF 내보내기 |
| Kit | $199/월 | 소규모 컨설팅 팀 | Pro + API 액세스 + ISSB S2 초안 생성기 |

### 4.2 수익 시나리오

| 시나리오 | 유료 사용자 | MRR | ARR |
|----------|-------------|-----|-----|
| 보수적 (6개월) | 50명 Pro | $3,950 | $47,400 |
| 중간 (12개월) | 200 Pro + 20 Kit | $19,800 | $237,600 |
| 목표 (24개월) | 500 Pro + 50 Kit | $49,450 | $593,400 |

---

## 5. 경쟁 환경

| 경쟁자 | 가격 | 강점 | 약점 (우리의 기회) |
|--------|------|------|-------------------|
| World Bank Data Portal | 무료 | 가장 포괄적 데이터 | 비교 불가, 내러티브 없음, UX 불편 |
| Climate Watch | 무료 | GHG 배출 전문 | 비교 제한적, 보고서 생성 불가 |
| ChatGPT / Claude | $20/월 | 범용 AI, 자연어 | 숫자 지어냄, 출처 불명, 감사 불가 |
| Bloomberg Terminal | $24,000/년 | 가장 포괄적 금융+ESG | 가격, 소규모 컨설턴트 접근 불가 |
| MSCI ESG | $50,000+/년 | 기업 ESG 평가 | 가격, 국가 레벨 약함 |
| Refinitiv (LSEG) | $20,000+/년 | ESG 점수 | 가격, 기후 물리적 리스크 약함 |

**우리의 포지셔닝:** Bloomberg와 무료 도구 사이의 빈 공간. "감사 가능한 기후 데이터 브리프를 $79/월에."

---

## 6. 현재 치명적으로 부족한 것들 (우선순위 순)

### 6.1 데이터 (가장 긴급)

| 우선순위 | 항목 | 현재 상태 | 필요 상태 | 난이도 |
|----------|------|-----------|-----------|--------|
| **P0** | CO2 per capita 데이터 | 0건 | 250개국 × 20년 | World Bank API 재시도 또는 대체 소스 |
| **P0** | 보고서 임베딩 20개+ | 1개 (IPCC SPM) | IPCC WG1~3, TCFD, UNEP, NDC 등 | 접근 가능한 PDF 수집 + embed |
| **P1** | Climate Watch GHG 전체 국가 | 24건 | 200개국 × 20년 | API 페이지네이션 또는 벌크 다운로드 |
| **P1** | ND-GAIN 취약성 지수 | 없음 | 국가별 기후 취약성 점수 | ND-GAIN API 연동 |
| **P2** | 국가별 NDC (탄소 감축 공약) | 없음 | 파리협정 공약 데이터 | Climate Watch NDC API |
| **P2** | 탄소 가격 데이터 | 없음 | 국가별 탄소세/ETS 가격 | World Bank Carbon Pricing Dashboard |

### 6.2 기능 (핵심 기능 강화)

| 우선순위 | 기능 | 현재 | 필요 |
|----------|------|------|------|
| **P0** | PDF 내보내기 | 없음 | 비교 브리프를 클라이언트 납품용 PDF로 다운로드 |
| **P0** | AI 브리프 품질 | 보고서 1개, 답변 빈약 | 보고서 20개+ 기반, 국가별 특화 답변 |
| **P1** | 비교 차트 | 테이블만 있음 | 비교 막대차트, 레이더 차트, 트렌드 오버레이 |
| **P1** | 인증 연동 비교 | 비교 페이지 인증 없음 | Free: 월 3회 비교, Pro: 무제한 |
| **P1** | 랜딩페이지 | 제네릭 | 비교 기능 데모, 가치 제안 명확화 |
| **P2** | 알림 (이메일) | 없음 | 특정 국가 지표 변동 시 알림 |
| **P2** | CSV/Excel 내보내기 | 없음 | 비교 데이터 테이블 다운로드 |
| **P3** | ISSB S2 초안 생성기 | 없음 | 국가+산업 입력 → S2 공시 초안 자동 생성 (Kit 플랜) |

### 6.3 품질/UX

| 항목 | 현재 문제 | 해결 방향 |
|------|-----------|-----------|
| 대시보드 | 지도만 떡하니 → 의미 불명 | 비교 페이지로 유도하는 허브로 전환 |
| 리포트 라이브러리 | 거의 빈 페이지 | 임베딩된 보고서 목록 + 검색 가능하게 |
| 프라이싱 | 뭘 주는지 불명확 | 비교 횟수, PDF 내보내기 등 구체적 제한 명시 |
| 모바일 | 미확인 | 비교 테이블 반응형 처리 |
| 에러 처리 | 기본적 | 데이터 없는 국가에 대한 graceful fallback |

---

## 7. 기술 부채 (Gemini 코드 문제)

Gemini(안티그래비티)가 작성한 코드에서 발견된 시스템적 문제:

| 문제 | 영향 범위 | 수정 상태 |
|------|-----------|-----------|
| DB 컬럼명 불일치 (`indicator_code` vs `indicator_id`) | 스크립트 3개 + 페이지 2개 | **수정 완료** |
| `as const` 리터럴 타입 미고려 | DashboardClient.tsx | **수정 완료** |
| topojson 타입 불일치 | WorldMap.tsx | **수정 완료** |
| Climate Watch 섹터명 오타 (`LUCF` → `LULUCF`) | fetch-climatewatch.ts | **수정 완료** |
| pdf-parse v2 API 변경 미반영 | embed-reports.ts | **수정 완료** |
| reports 테이블 unique constraint 없이 upsert 시도 | embed-reports.ts | **수정 완료** |

**근본 원인:** Gemini가 DB 스키마(001_schema.sql)를 읽지 않고 컬럼명을 추측으로 작성함.
**교훈:** 다중 AI 협업 시, 스키마/인터페이스 계약(contract)을 먼저 공유해야 함.

---

## 8. 외부 데이터 소스 레퍼런스

### 현재 사용 중
| 소스 | API 엔드포인트 | 인증 | 비용 |
|------|---------------|------|------|
| World Bank | `api.worldbank.org/v2/country/all/indicator/{code}?format=json` | 불필요 | 무료 |
| Climate Watch | `climatewatchdata.org/api/v1/data/historical_emissions` | 불필요 | 무료 |
| REST Countries | `restcountries.com/v3.1/all` | 불필요 | 무료 |
| IPCC AR6 SPM | PDF 직접 다운로드 | 불필요 | 무료 |

### 추가 연동 필요
| 소스 | 데이터 | API | 인증 | 비용 |
|------|--------|-----|------|------|
| ND-GAIN | 기후 취약성 지수 | `gain.nd.edu/our-work/country-index/` | 불필요 | 무료 |
| Climate Watch NDC | 국가별 탄소 감축 공약 | `climatewatchdata.org/api/v1/ndcs` | 불필요 | 무료 |
| World Bank Carbon Pricing | 탄소세/ETS 가격 | `carbonpricingdashboard.worldbank.org` | 불필요 | 무료 |
| IPCC WG1/WG2/WG3 풀텍스트 | 기후 과학/영향/완화 | PDF 직접 다운로드 | 불필요 | 무료 |
| TCFD 권고안 | 기후 공시 프레임워크 | PDF 직접 다운로드 | 불필요 | 무료 |
| ISSB S2 표준 전문 | 기후 공시 표준 | IFRS 웹사이트 PDF | 불필요 | 무료 |

---

## 9. 핵심 사용자 플로우 (목표 상태)

```
[랜딩페이지]
    │
    ├──→ "Try Demo" → /compare?countries=VNM,IDN,PHL (비로그인 체험)
    │                    │
    │                    ├── 비교 테이블 (즉시)
    │                    ├── 비교 차트 (즉시)
    │                    ├── "Generate Brief" → AI 요약 + 출처 (10초)
    │                    └── "Download PDF" → 회원가입 유도
    │
    ├──→ /signup → /compare (무료: 월 3회 비교)
    │
    ├──→ /pricing → Stripe Checkout → Pro 플랜
    │                    │
    │                    └── 무제한 비교 + PDF + CSV + 알림
    │
    └──→ /chat → RAG 채팅 (보고서 기반 Q&A)
```

---

## 10. 즉시 실행 가능한 액션 아이템 (우선순위 순)

### Phase 1: 데이터 보강 (1~2일)
1. CO2 per capita 데이터 대체 소스 확보 (IEA 또는 Climate Watch에서)
2. IPCC WG1, WG2, WG3 SPM PDF 임베딩 (3개 추가 → 총 4개)
3. TCFD 권고안 PDF 임베딩
4. ISSB S2 표준 PDF 임베딩
5. Climate Watch 전체 국가 GHG 데이터 벌크 수집

### Phase 2: 핵심 기능 완성 (3~5일)
1. PDF 내보내기 (비교 브리프 → 클라이언트 납품용 PDF)
2. 비교 페이지 차트 추가 (막대 비교, 트렌드 오버레이)
3. 랜딩페이지 재설계 (가치 제안 + 데모 유도)
4. Free/Pro 인증 연동 (비교 횟수 제한)

### Phase 3: GTM 준비 (1주)
1. Stripe 프로덕션 키 설정 + 결제 테스트
2. Vercel 배포
3. SEO 최적화 (메타태그, OG 이미지)
4. 프라이싱 페이지 구체화

---

## 11. 기술 환경 정보

| 항목 | 값 |
|------|-----|
| Node.js | v24.13.0 |
| Next.js | 16.1.6 |
| TypeScript | strict mode |
| Supabase | PostgreSQL + pgvector |
| OpenAI 모델 (임베딩) | text-embedding-3-small (1536 dim) |
| OpenAI 모델 (생성) | gpt-4o-mini |
| Stripe SDK | v20.3.1 (API: 2026-01-28.clover) |
| D3.js | 차트 렌더링 |
| 배포 대상 | Vercel |
| 도메인 | 미설정 |

---

## 12. 이 문서의 사용법

이 문서를 기반으로 다음 전문가에게 자문을 구할 수 있습니다:

1. **AI 엔지니어에게:** Section 3, 6, 7을 공유 → "RAG 품질을 어떻게 올릴 것인가", "데이터 파이프라인 개선"
2. **ESG 도메인 전문가에게:** Section 2, 4, 5를 공유 → "이 페인 포인트가 실제로 돈이 되는가", "빠진 데이터가 있는가"
3. **비즈니스 어드바이저에게:** Section 4, 5, 9를 공유 → "프라이싱이 맞는가", "GTM 전략"
4. **디자인/UX 전문가에게:** Section 6.3을 공유 → "비교 UX 개선", "모바일 대응"

---

*이 문서는 VisualClimate 프로젝트의 현재 상태를 있는 그대로 기술합니다. 좋게 포장하지 않았습니다. 부족한 부분이 명확해야 올바른 의사결정이 가능합니다.*
