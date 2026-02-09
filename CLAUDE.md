# VisualClimate

## 개요
기후/지속가능성 전문가를 위한 데이터 인텔리전스 플랫폼.

## 기술 스택
- Next.js (App Router), TypeScript, Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage + pgvector)
- OpenAI API (text-embedding-3-small + gpt-4o-mini)
- D3.js, Stripe, Vercel

## 프로젝트 구조
```
src/
├── app/
│   ├── page.tsx (랜딩)
│   ├── dashboard/ (공개 대시보드)
│   ├── country/[iso3]/ (국가 프로파일)
│   ├── library/ (리포트 라이브러리)
│   ├── chat/ (RAG 챗)
│   ├── guides/ (ESG 가이드)
│   ├── pricing/ (요금제)
│   └── api/
│       ├── rag/ (RAG 엔드포인트)
│       └── stripe/ (결제 webhook)
├── components/
│   ├── charts/ (D3.js)
│   ├── rag/ (챗 UI)
│   ├── layout/ (헤더/푸터)
│   └── ui/ (공통)
├── lib/
│   ├── supabase/ (client.ts, server.ts)
│   ├── openai.ts
│   ├── stripe.ts
│   └── constants.ts
scripts/ (데이터 수집)
supabase/migrations/
```

## 코딩 규칙
- TypeScript strict, 서버 컴포넌트 우선
- 'use client' 명시, try-catch 필수, 환경변수 하드코딩 금지
- 컴포넌트 150줄 이하, RLS 필수, 데이터 출처 UI 표시

## 디자인 시스템
- **참조**: `tasks/design-system.md` (Stripe.com 스타일)
- 배경: `#0a2540` (네이비), 카드: `bg-white/5 backdrop-blur-sm`, 보더: `border-white/10`
- 액센트 그라디언트: `from-[#00d4ff] to-[#7b61ff]`
- CTA 버튼: `rounded-full` 그라디언트, 세컨더리: `border-white/20 rounded-full`
- 텍스트: primary `#fff`, secondary `#adbdcc`
- 모든 페이지 다크 테마 통일 (로그인/회원가입 포함)

## 외부 API (인증 불필요, 무료)
- World Bank: `https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&per_page=1000&date=2000:2023`
- Climate Watch: `https://www.climatewatchdata.org/api/v1/data/historical_emissions`
- REST Countries: `https://restcountries.com/v3.1/all?fields=name,cca3,region,subregion,latlng,population,flags`
