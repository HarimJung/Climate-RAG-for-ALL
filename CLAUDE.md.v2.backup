---

```markdown
# VisualClimate — Open Climate Accountability Platform
# CLAUDE.md v2.1 | 2026-03-09
# https://visualclimate.org
# 다른 MD와 충돌 시 이 파일이 우선

---

## 1. 이 문서의 목적

이 파일은 VisualClimate 프로젝트의 유일한 설계도다.
Claude Code는 모든 작업 전에 이 문서를 참조하고, 여기 없는 것은 만들지 않는다.
여기 있는 수치는 실제 DB 조회 결과(2026-03-08 기준)이며 환각이 아니다.

---

## 2. 제품 정의

**한 줄 요약**: 250개국의 기후 이행 성적표를 시각화해서 보여주는 플랫폼.

**핵심 질문**: "당신의 나라는 기후 약속을 지키고 있는가?"

**핵심 지표**: 사이트에서 뽑은 차트 PNG가 LinkedIn에 올라간 횟수 = 성공 지표

**데이터 규모**:
- Supabase country_data: 172,121행
- 국가: 250개 (countries 테이블)
- 지표: 61개 (indicators 테이블, indicator_code 기준)
- Kaya LMDI JSON: 68파일 (public/data/kaya/)
- NDC Gap JSON: 204파일 (public/data/ndc-gap/)
- Risk Profile JSON: 6파일 (public/data/)

**데이터 소스 6개**:
- World Bank WDI (경제, 산림, 인구, CO₂)
- Ember Global Electricity Review (전력 믹스, 탄소 집약도)
- Our World in Data / Global Carbon Project (누적 CO₂, 에너지)
- ND-GAIN (적응 준비도, 취약성)
- Climate TRACE v7 (부문별 배출)
- UNFCCC NDC Registry (국가 감축 목표)

---

## 3. 유저 플로우 (모든 UI 작업의 기준)

### User A: 일반 시민 — "우리나라 어때?"
```
홈(/) 
  → 히어로 중앙 검색창에 "Korea" 입력
  → Report Card(/report/KOR)
  → 상단: 등급 뱃지(B+) + 분류(Starter) + 한 줄 요약
  → 5개 도메인 스크롤 (각 섹션 끝에 "So What?" 해석 + "포스터로 저장" 버튼)
  → PNG 다운로드
  → LinkedIn 공유
```
**이 유저에게 필요한 것**: 검색 → 성적표 → 다운로드. 3클릭 이내.

### User B: 연구자/기자 — "국가 간 비교"
```
홈(/) 
  → 네비게이션 "Explore" 클릭
  → Explore(/explore)
  → 250개국 테이블 (정렬: 등급순/배출순/재생에너지순)
  → 필터 (지역, 소득수준, 등급, Changer/Starter/Talker)
  → 체크박스로 2-4개국 선택 → "Compare" 버튼
  → Compare(/compare)
  → Side-by-side 레이더 차트 + 도메인별 비교 테이블
  → CSV 다운로드
```
**이 유저에게 필요한 것**: 전체 데이터 접근 → 필터 → 비교 → 내보내기.

### User C: 활동가/교육자 — "공유할 콘텐츠"
```
홈(/) 
  → 네비게이션 "Posters" 클릭
  → Posters(/posters)
  → 국가 드롭다운 + 6종 포스터 타입 선택
  → 미리보기 그리드
  → "Download PNG" 또는 "Share on LinkedIn" 버튼
```
**이 유저에게 필요한 것**: 국가 선택 → 포스터 선택 → 다운로드. 2클릭.

### 공통 규칙
- 네비게이션: **Home, Explore, Posters** 3개만 상단에 표시
- Report Card는 검색 또는 Explore에서 진입 (네비게이션에 별도 링크 불필요)
- Methodology, About, Insights, Learn → 푸터로 이동
- 모든 페이지 하단에 "다음 행동" CTA 존재 (Report Card → "다른 나라 보기" / "포스터 다운로드")

---

## 4. 페이지별 스펙 (유저 플로우 기반)

### 4-1. 홈 (/)
**목적**: 유저가 10초 안에 "검색하거나 둘러보거나" 선택할 수 있게
**현재 문제**: CTA 묻힘, 링크 과다, 뭘 해야 하는지 불명확
**필수 UI 요소**:
- 히어로: 한 줄 카피 + 검색창(중앙, 가장 큰 요소) + "250개국 기후 성적표"
- 검색창 아래: 인기 국가 6개 태그 (KOR, USA, CHN, DEU, IND, BRA)
- 스크롤 시: 글로벌 스코어보드 맵 (선택 시 해당 국가 Report Card로 이동)
- 하단: 핵심 수치 바 (250 countries, 61 indicators, 172K+ datapoints)
- **제거**: 현재 홈의 과도한 카드/리스트 정리

### 4-2. Report Card (/report/[ISO3])
**목적**: 한 나라의 기후 성적을 한눈에 보여주고, 공유 가능한 차트 제공
**현재 문제**: 내러티브 없음, 숫자만 나열, "그래서 뭐?" 답 없음
**필수 UI 요소**:
- 상단 히어로: 국기 + 국가명 + 등급 뱃지(A+~F) + 분류(Changer/Starter/Talker) + 한 줄 요약
- 레이더 차트: 5개 도메인 한눈에 비교
- 5개 도메인 섹션 (각각):
  - 점수 + 등급
  - 차트 (기존 분리된 charts/ 컴포넌트 사용)
  - "So What?" 해석 텍스트 (2-3문장, 데이터 기반 자동 생성)
  - "포스터로 저장" 버튼 (PNG)
- 하단 CTA: "다른 나라 보기" (검색창) + "비교하기" (Compare 링크)

### 4-3. Explore (/explore)
**목적**: 250개국 전체를 훑어보고 비교 대상을 고르는 곳
**현재 문제**: 24개국만 표시, 필터 없음, Compare 연결 없음
**필수 UI 요소**:
- 상단: 검색 + 필터 바 (지역, 소득수준, 등급, 분류)
- 테이블: 250개국, 컬럼 = 국가명, 등급, 분류, 종합점수, 5개 도메인 점수
- 정렬: 각 컬럼 클릭 시 오름/내림차순
- 체크박스: 2-4개국 선택 → 상단에 "Compare Selected" 버튼 활성화
- 하단: CSV 다운로드 버튼
- 각 국가명 클릭 → 해당 Report Card로 이동

### 4-4. Posters (/posters)
**목적**: 공유 가능한 1080×1080 차트 이미지를 뽑는 곳
**현재 문제**: 맵 로딩 에러, Transition Race 에러
**필수 UI 요소**:
- 국가 드롭다운 (250개국)
- 6종 포스터 타입 선택 (emissions, energy-mix, paris-gap, transition-race, carbon-inequality, air-quality)
- 선택 시 미리보기 렌더링
- 각 포스터 하단: "Download PNG" + "Share on LinkedIn" 버튼
- 에러 시: fallback 메시지 + 다른 포스터 추천 (맵 깨져도 페이지 전체가 죽지 않게)

### 4-5. Compare (/compare)
**목적**: 선택한 2-4개국을 나란히 비교
**필수 UI 요소**:
- 상단: 선택된 국가 태그 + "국가 추가" 드롭다운
- 레이더 차트: 선택 국가 오버레이
- 도메인별 비교 테이블
- CSV 다운로드

### 4-6. 기타 페이지
| 페이지 | 위치 | 상태 |
|--------|------|------|
| Insights (/insights) | 푸터 링크 | Phase 3에서 5개 스토리 작성 |
| Methodology (/methodology) | 푸터 링크 | 작동, 유지 |
| About (/about) | 푸터 링크 | 작동, 유지 |
| Learn (/learn) | 푸터 링크 | 작동, 유지 |
| Dashboard (/dashboard) | 삭제 검토 | Report Card에 통합 가능 |
| Library (/library) | 삭제 검토 | 사용 안 됨 |
| Guides (/guides) | 푸터 링크 | SEO용 유지 |
| LinkedIn Card (/linkedin/[iso3]/[type]) | 내부용 | 직접 접근 불필요, 생성 도구용 |

---

## 5. 스코어링 방법론

**정규화**: (value - min) / (max - min) × 100. 역방향 지표는 100 - norm.

**도메인 가중치**:
| 도메인 | 가중치 | 지표 |
|--------|--------|------|
| Emissions | 30% | CO₂/capita(50%), CO₂/GDP(30%), Decoupling(20%) |
| Energy | 25% | Renewable %(60%), Grid carbon intensity(40%) |
| Economy | 15% | GDP/capita(50%), CO₂/GDP(50%) |
| Responsibility | 15% | 누적 CO₂ 비중(100%) |
| Resilience | 15% | ND-GAIN readiness(60%), vulnerability(40%) |

**등급**: A+(90-100), A(80-89), B+(70-79), B(60-69), C+(50-59), C(40-49), D(25-39), F(0-24)

**분류**:
- Changer: CO₂ 감소 + 재생에너지 증가 (64개국)
- Starter: 한쪽만 개선 (80개국)
- Talker: 파리협정 서명했으나 측정 가능한 진전 없음 (72개국)

---

## 6. 기술 스택

| 항목 | 값 |
|------|-----|
| Framework | Next.js 16.1.6 |
| UI | React 19.2.3 + Tailwind CSS |
| 차트 | D3.js + React SVG |
| DB | Supabase (PostgreSQL) |
| 배포 | Vercel |
| 언어 | TypeScript |
| 인증 | 미구현 (Supabase Auth 예정) |
| 결제 | 미구현 (Stripe 예정) |
| API | /api/og/route.tsx만 존재 |
| Fonts | Inter (본문), JetBrains Mono (숫자/차트) |
| Animation | framer-motion |
| PNG Export | html2canvas |
| Icons | lucide-react |

---

## 7. DB 스키마

```sql
-- countries (250행)
id, iso3, name, region, sub_region, income_group, population, lat, lng, flag_url, created_at, iso2

-- indicators (67행)
id, source, code, name, unit, category, domain, issb_s2_ref, sdg_target, created_at

-- country_data (172,121행)
id, country_iso3, indicator_code, year, value, source, created_at
```

---

## 8. 디렉토리 구조 및 파일 맵

### 작업별 파일 위치
| 작업 | 경로 |
|------|------|
| 차트 수정 | src/components/charts/ (14개 TSX) |
| 섹션 UI | src/components/sections/ (5개 TSX) |
| 포스터 | src/components/posters/ (6개 TSX) |
| LinkedIn 카드 | src/components/linkedin/ (2개 TSX) |
| SEO | src/components/seo/ (2개 TSX) |
| 국가 데이터 추가 | scripts/fetch-*, scripts/calculate-*, public/data/ |
| 등급/분류 로직 | src/lib/constants.ts |
| 데이터 품질 | scripts/qa-* |
| 페이지 | src/app/ (18개 라우트) |
| ETL | scripts/ (21개 스크립트) |
| 설정 | .claude/agents/, .claude/skills/, .claude/commands/ |

### 핵심 파일 크기
| 파일 | 줄 수 | 상태 |
|------|-------|------|
| CountryClient.tsx | 369 | 리팩토링 완료 |
| PostersClient.tsx | 841 | Phase 1에서 분할 |
| src/app/page.tsx | 629 | Phase 1에서 재설계 |

---

## 9. P0 버그 및 UI 개선 (Phase 1 통합)

| # | 항목 | 유형 | 수정 방향 |
|---|------|------|-----------|
| 1 | 홈 CTA 묻힘 | UI 재설계 | 섹션 4-1 스펙대로 히어로+검색창 중앙 배치 |
| 2 | 네비게이션 과다 | UI 재설계 | Home, Explore, Posters 3개만. 나머지 푸터 |
| 3 | Report Card 내러티브 없음 | 기능 추가 | 섹션 4-2 스펙대로 등급뱃지 + So What 텍스트 |
| 4 | Explore 24/250 | 버그 | 섹션 4-3 스펙대로 250개국 + 필터 + Compare 연결 |
| 5 | Posters 맵 에러 | 버그 | try-catch + fallback SVG. 섹션 4-4 스펙대로 재구성 |
| 6 | Transition Race 에러 | 버그 | 에러 바운더리 + 재시도 |
| 7 | LinkedIn Sankey 크기 | 버그 | width=960 height=700, 패딩 제거 |
| 8 | PostersClient.tsx 841줄 | 기술부채 | 400줄 이하로 분할 |
| 9 | 모든 페이지 하단 CTA 없음 | UI 추가 | 각 페이지 끝에 다음 행동 유도 버튼 |

---

## 10. .claude/ 구조

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

### 스킬 (7개 활성, 5개 아카이브)
활성: data-source-catalog, indicator-map, issb-s2-mapping, ndc-gap-methodology, kaya-decomposition, climate-equity-map, design-system

### 커맨드 (5개 + 6개 추가 예정)
**기존**:
| 커맨드 | 용도 |
|--------|------|
| /refactor-section <path> | 큰 컴포넌트 분할 |
| /generate-linkedin-card <ISO3> <type> | 1080×1080 LinkedIn 카드 |
| /add-country <ISO3> | 새 국가 전체 파이프라인 |
| /data-audit [ISO3] | 데이터 품질 감사 |
| /linkedin-caption <ISO3> <type> | LinkedIn 캡션 3종 |

**추가 예정**:
| 커맨드 | 용도 |
|--------|------|
| /fix-broken-page <page> | 버그 페이지 수정 |
| /expand-explore | Explore 250개국 확장 |
| /deploy | git add → commit → push |
| /daily-content <ISO3> | 일일 LinkedIn 콘텐츠 |
| /memory-save | 현재 세션 기억 저장 |
| /full-audit | 전체 시스템 감사 |

---

## 11. 디자인 시스템

**테마**: 라이트 전용. 다크 테마 금지.

**색상**:
- Primary: #0066FF
- Changer: #00A67E
- Starter: #F59E0B
- Talker: #E5484D
- Background: #FFFFFF
- Section BG: #F8F9FA
- Text Primary: #1A1A2E
- Text Secondary: #4A4A6A
- Text Muted: #8888A0
- Border: #E5E7EB

**타이포그래피**: Inter (본문), JetBrains Mono (데이터/코드)
**간격**: 4px 단위
**파일 제한**: 컴포넌트당 400줄 이하
**별칭**: @/ = src/

---

## 12. 비즈니스 모델

| 레이어 | 가격 | 내용 |
|--------|------|------|
| Free | $0 | 성적표, 6종 포스터 PNG, LinkedIn 카드 |
| PDF Report | $49/국가 | 20페이지 상세 보고서 (Hormozi 100:1 가치 비율) |
| API/Widget | $199-$999/월 | REST API + 임베드 위젯 |
| Consulting | $10K-$100K | NDC 분석, ISSB S2 매핑, 맞춤 대시보드 |

---

## 13. LinkedIn 콘텐츠 전략

**빈도**: 주 5회, 연 260개 포스트
**자산 규모**: 250국 × 6종 차트 = 1,500개 이미지 (약 6년치)

**포스트 유형 7가지**:
1. Chart of the Week (월)
2. Data Drop — 숫자 하나로 시작 (화)
3. Country Spotlight (수)
4. Behind the Chart — 방법론 (목)
5. Comparison / VS (금)
6. 월말 종합 (월말)
7. 논쟁 유발형 (격주)

**캡션 구조**: Hook → Data → So What → CTA → Hashtags

---

## 14. 크론잡 자동화

```json
{
  "crons": [
    { "path": "/api/cron/daily-content", "schedule": "0 0 * * *" },
    { "path": "/api/cron/weekly-audit", "schedule": "0 21 * * 0" },
    { "path": "/api/cron/source-check", "schedule": "0 21 * * 2" }
  ]
}
```

---

## 15. 실행 로드맵

### Phase 1 (1-2주): UI 구조 재설계 + 버그 수정 + 첫 LinkedIn 포스트
- [ ] 이 CLAUDE.md로 교체
- [ ] 네비게이션 정리 (Home, Explore, Posters만. 나머지 푸터)
- [ ] 홈 재설계 (섹션 4-1 스펙)
- [ ] Report Card에 등급 뱃지 + So What 텍스트 추가 (섹션 4-2 스펙)
- [ ] Explore 250개국 + 필터 + Compare 연결 (섹션 4-3 스펙)
- [ ] Posters 에러 수정 + 재구성 (섹션 4-4 스펙)
- [ ] LinkedIn Sankey 크기 수정
- [ ] PostersClient.tsx 분할 (841줄 → 400줄 이하)
- [ ] 모든 페이지 하단 CTA 추가
- [ ] 첫 LinkedIn 카드 + 캡션 생성 및 발행
- [ ] memory/, shared-context/ 디렉토리 생성

### Phase 2 (3-4주): 콘텐츠 + 비교 강화
- [ ] Compare 페이지 완성 (섹션 4-5 스펙)
- [ ] LinkedIn 카드 6종 타입 완성
- [ ] 추가 커맨드 6개 생성
- [ ] Report Card 자동 내러티브 고도화

### Phase 3 (5-8주): Insights + 자동화
- [ ] Insights 5개 데이터 스토리 작성
- [ ] 일일 콘텐츠 자동화 (Vercel Cron)
- [ ] Claude 스킬 패키징 및 공유

### Phase 4 (9-12주): 수익화
- [ ] Supabase Auth 구현
- [ ] Stripe Checkout (PDF 보고서)
- [ ] Stripe Subscription (API)
- [ ] REST API v1 엔드포인트 4개
- [ ] Product Hunt 런칭

### Phase 5 (4-6개월): 확장
- [ ] Electron 앱 (vercel-labs/agent-browser)
- [ ] Kaya LMDI 250개국 확장
- [ ] ESG 파트너십
- [ ] 컨설팅 패키지 런칭

---

## 16. 토큰 최적화 규칙

1. 파일 수정 전 이 문서의 "작업별 파일 위치"를 먼저 확인. Glob/Grep 최소화.
2. 컴포넌트 400줄 초과 시 즉시 분할.
3. Agent Teams로 독립 작업은 병렬 실행.
4. 반복 작업은 /commands/ 사용.
5. Supabase 조회는 MCP 도구로 직접 실행.
6. 한 세션에서 context rot 감지 시 GSD 플러그인으로 phase 분리.

---

## 17. 금지사항

- 다크 테마, 다크 배경 절대 금지
- bg-slate-900, bg-slate-800, #0a0a1a, #0d1117 사용 금지
- 새 라이브러리 설치 전 반드시 확인
- 하드코딩된 국가 데이터 금지 (Supabase 또는 JSON에서 fetch)
- UI 변경 없이 리팩토링할 것 (유저 플로우 스펙에 명시된 변경만 허용)
- 환각 데이터 생성 금지 (모든 수치는 DB 조회 또는 JSON 파일 기반)
- 이 문서에 없는 페이지/기능 임의 생성 금지
- 네비게이션에 Home, Explore, Posters 외 항목 추가 금지

---

## 18. TODO: 전략 보강 필요

- [ ] 브랜딩 확정 (태그라인, 톤, 로고 시안)
- [ ] 컨설팅 딜리버러블 상세 정의 (페이지 수, 분석 항목, 납품 형태)
- [ ] 멀티플랫폼 전략 (Reddit, X, Substack)
- [ ] Electron 앱 필요성 최종 판단
- [ ] 스코어링 방법론 개선 (CO₂/GDP 중복 검토, percentile 전환 검토)
- [ ] 수익 예측 벤치마크 (시장 규모, 전환율 근거)
```

---

이전 v2.0 대비 변경사항:

- **섹션 3 추가**: 유저 플로우 3개 시나리오 (모든 UI 작업의 기준)
- **섹션 4 추가**: 페이지별 상세 스펙 (홈, Report Card, Explore, Posters, Compare, 기타)
- **섹션 9 통합**: P0 버그 + UI 개선을 하나로 합침
- **섹션 15 수정**: Phase 1에 UI 구조 재설계 포함
- **섹션 17 수정**: 네비게이션 제한 규칙 추가
- **나머지**: 동일