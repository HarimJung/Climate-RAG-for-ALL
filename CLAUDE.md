# VisualClimate — CLAUDE.md v3.0 | 2026-03-15
# https://visualclimate.org
# 다른 MD와 충돌 시 이 파일이 우선. 상세 스펙은 docs/ 참조.

## 제품 한 줄 요약
250개국의 기후 이행 성적표를 시각화해서 보여주는 플랫폼.
핵심 질문: "당신의 나라는 기후 약속을 지키고 있는가?"
성공 지표: 차트 PNG가 LinkedIn에 올라간 횟수.

## 데이터 규모 (2026-03-08 기준)
- Supabase country_data: 172,121행 | 국가: 250개 | 지표: 61개
- Kaya LMDI JSON: 68파일 | NDC Gap JSON: 204파일 | Risk Profile JSON: 6파일
- 소스: World Bank WDI, Ember, OWID/GCP, ND-GAIN, Climate TRACE v7, UNFCCC NDC

## 기술 스택
Next.js 16.1.6 | React 19.2.3 | Tailwind CSS | D3.js | Supabase | Vercel | TypeScript
framer-motion | html2canvas | lucide-react | Inter + JetBrains Mono

## DB 스키마
```sql
countries (250행): id, iso3, name, region, sub_region, income_group, population, lat, lng, flag_url, created_at, iso2
indicators (67행): id, source, code, name, unit, category, domain, issb_s2_ref, sdg_target, created_at
country_data (172,121행): id, country_iso3, indicator_code, year, value, source, created_at
```

## 작업별 파일 위치
| 작업 | 경로 |
|------|------|
| 차트 | src/components/charts/ (14개 TSX) |
| 섹션 UI | src/components/sections/ (5개 TSX) |
| 포스터 | src/components/posters/ (6개 TSX) |
| LinkedIn 카드 | src/components/linkedin/ (2개 TSX) |
| SEO | src/components/seo/ (2개 TSX) |
| 등급/분류 | src/lib/constants.ts |
| 페이지 | src/app/ (18개 라우트) |
| ETL | scripts/ (21개 스크립트) |
| 데이터 | scripts/fetch-*, scripts/calculate-*, public/data/ |

## 핵심 파일
| 파일 | 줄 수 | 상태 |
|------|-------|------|
| CountryClient.tsx | 369 | 리팩토링 완료 |
| PostersClient.tsx | 841 | 분할 필요 |
| src/app/page.tsx | 629 | 재설계 필요 |

## 네비게이션 규칙
- 상단: **Home, Explore, Posters** 3개만
- 푸터: Methodology, About, Insights, Learn, Guides
- Report Card는 검색/Explore에서 진입

## 등급 시스템
A+(90-100), A(80-89), B+(70-79), B(60-69), C+(50-59), C(40-49), D(25-39), F(0-24)
분류: Changer(64국) / Starter(80국) / Talker(72국)

## 금지사항
- 다크 테마/배경 절대 금지 (bg-slate-900, #0a0a1a 등)
- 새 라이브러리 설치 전 반드시 확인
- 하드코딩된 국가 데이터 금지 (Supabase/JSON에서 fetch)
- 환각 데이터 생성 금지 (모든 수치는 DB/JSON 기반)
- 이 문서에 없는 페이지/기능 임의 생성 금지
- 네비게이션에 Home, Explore, Posters 외 항목 추가 금지
- 컴포넌트 400줄 초과 금지

## 토큰 최적화
1. 이 파일의 "작업별 파일 위치"를 먼저 확인. Glob/Grep 최소화.
2. 컴포넌트 400줄 초과 시 즉시 분할.
3. Agent Teams로 독립 작업 병렬 실행.
4. 반복 작업은 /commands/ 사용.

## 상세 스펙 참조
| 문서 | 경로 | 내용 |
|------|------|------|
| 유저 플로우 | docs/user-flows.md | 3개 유저 시나리오 + 공통 규칙 |
| 페이지 스펙 | docs/pages-spec.md | 홈, Report Card, Explore, Posters, Compare 상세 |
| 스코어링 | docs/scoring.md | 정규화, 도메인 가중치, 등급/분류 기준 |
| 디자인 시스템 | docs/design-system.md | 색상, 타이포, 간격, 테마 규칙 |
| 비즈니스 | docs/business.md | 가격 모델, 크론잡 자동화 |
| LinkedIn 전략 | docs/linkedin-strategy.md | 포스트 유형, 빈도, 캡션 구조 |
| 컴포넌트 맵 | docs/component-interfaces.md | 차트/UI 컴포넌트 목록 + .claude 구조 |
| DB/JSON 스키마 | docs/json-schemas.md | 테이블 상세 + JSON 파일 구조 |
| Claude 도구 | docs/claude-tools.md | 에이전트, 스킬, 커맨드 전체 목록 |
| 투두 | todo.md | P0 버그 + 로드맵 Phase 1-5 |
| 프로젝트 상태 | memory.md | 현재 상태, 완료 작업, 기술부채 |
