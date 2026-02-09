# VisualClimate - Lessons Learned

## 판단 기록

### 1. Lazy client initialization (Stripe, OpenAI)
- **문제**: `export const stripe = new Stripe(...)` 패턴은 빌드 시점에 환경변수를 읽음. .env.local이 비어있으면 빌드 실패.
- **해결**: `getStripe()`, `getOpenAI()` lazy getter 패턴으로 변경. 런타임에만 초기화.
- **교훈**: 외부 서비스 클라이언트는 항상 lazy init으로 만들어야 빌드/테스트가 안전하다.

### 2. replace_all 사용 시 import 경로 손상 주의
- **문제**: `replace_all`로 `openai` → `getOpenAI()`를 치환하면 import 경로 내부 문자열도 변경됨.
- **교훈**: replace_all은 변수명처럼 맥락 없는 텍스트에는 위험. 정확한 범위의 old_string을 지정할 것.

### 3. Stripe API 버전
- **판단**: stripe@20.3.1이 설치되어 있고 해당 패키지의 `apiVersion`은 `'2026-01-28.clover'`. 이를 명시적으로 사용.

### 4. constants.ts 오타 수정
- **판단**: 스펙에서 GDP unit이 `'US`로 닫는 따옴표가 누락되어 있었음. `'US$'`로 수정하여 사용.

### 5. searchParams를 Promise로 처리
- **판단**: Next.js 16에서 page props의 searchParams는 Promise. `await searchParams`로 접근.

### 6. Gemini 스크립트/페이지의 DB 쿼리 불일치 (반복 패턴)
- **문제**: Gemini가 작성한 모든 Supabase 쿼리가 `indicator_code`, `country_iso3` 같은 존재하지 않는 컬럼을 사용. 실제 스키마는 `indicator_id`, `country_id` (FK 정수).
- **영향 범위**: scripts 3개, dashboard/page.tsx, country/[iso3]/page.tsx — 사실상 DB를 읽는 모든 코드
- **근본 원인**: Gemini가 스키마(001_schema.sql)를 읽지 않고 컬럼명을 추측으로 작성
- **교훈**: 다른 AI가 만든 코드를 받을 때, DB 쿼리 컬럼명을 스키마와 대조 검증 필수

### 7. RAG threshold 0.7은 너무 높음
- **문제**: 리포트 1개(IPCC SPM)만 있을 때 0.7 threshold로는 대부분 쿼리가 매칭 실패
- **수정**: 0.3으로 낮추고 match_count 5→8로 증가
- **교훈**: 초기 데이터가 적을 때는 threshold를 낮게 설정하고, 리포트가 쌓이면 올리는 전략

### 8. 디자인 리팩터링: Stripe 스타일 적용
- **문제**: 기존 디자인이 Tailwind 기본 `slate-XXX` + `emerald-XXX` 패턴 → 스타터 템플릿처럼 보임
- **판단**: Stripe.com 스타일 (deep navy #0a2540, cyan-purple gradient, glassmorphism 카드) 채택
- **변경 범위**: Tailwind 클래스만 수정, 기능 로직/API/lib 절대 미수정
- **교훈**: 디자인 토큰을 CSS 변수로 globals.css에 정의하면 일관성 유지가 쉬움
- **주의**: `bg-gray-50 bg-white` 사용하던 로그인/회원가입 페이지도 다크 테마로 통일 필수
- **참조**: tasks/design-system.md

