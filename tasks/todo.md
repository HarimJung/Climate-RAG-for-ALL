# VisualClimate - Task Tracker

## Task 1: 프로젝트 초기화
- [x] Next.js App Router + TypeScript + Tailwind CSS + ESLint 초기화
- [x] 패키지 설치 (@supabase/supabase-js, @supabase/ssr, openai, d3, stripe, etc.)
- [x] devDependency tsx 설치
- [x] .env.local.example 생성
- [x] .gitignore에 .env.local 포함 확인

## Task 2: CLAUDE.md 생성
- [x] 프로젝트 루트에 CLAUDE.md 생성

## Task 3: tasks/ 폴더 생성
- [x] tasks/todo.md 생성
- [x] tasks/lessons.md 생성

## Task 4: Supabase 스키마
- [x] supabase/migrations/001_schema.sql 생성

## Task 5: lib 파일들
- [x] src/lib/supabase/client.ts (브라우저용, @supabase/ssr createBrowserClient)
- [x] src/lib/supabase/server.ts (서버용, service_role key)
- [x] src/lib/openai.ts (lazy getter 패턴)
- [x] src/lib/stripe.ts (lazy getter 패턴)
- [x] src/lib/constants.ts (PLANS + CLIMATE_INDICATORS)

## Task 6: RAG API
- [x] src/app/api/rag/route.ts (POST: embedding → vector search → GPT-4o-mini)

## Task 7: 챗 UI
- [x] src/components/rag/ChatPanel.tsx ('use client', react-markdown, 출처 뱃지)
- [x] src/app/chat/page.tsx (URL ?country=BGD 지원)

## Task 8: Stripe 결제
- [x] src/app/api/stripe/checkout/route.ts (Checkout Session 생성, 미설정시 503)
- [x] src/app/api/stripe/webhook/route.ts (시그니처 검증, plan 업데이트)

## Task 9: Auth
- [x] src/app/login/page.tsx (이메일+비밀번호 로그인)
- [x] src/app/signup/page.tsx (회원가입 + user_profiles row 생성)
- [x] src/lib/auth.ts (checkPlanAccess, getRagLimit, canUseRag)

## Task 10: 최종 업데이트
- [x] todo.md 최종 상태 업데이트
- [x] 빌드 검증 통과 (Next.js 16.1.6, TypeScript strict)
