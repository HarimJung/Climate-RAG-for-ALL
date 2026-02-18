---
name: phase5-deploy
description: Phase 5 deployment — step-by-step
disable-model-invocation: true
---

# Phase 5: Deploy

## 실행 규칙
- 한 스텝씩 순서대로
- 서브에이전트 devops-infra에 위임하라

---

## STEP 1: 환경변수 확인
- .env.local 파일에 아래 키가 있는지 확인:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_SERVICE_ROLE_KEY가 src/ 코드에 노출되지 않았는지 grep 확인
- 결과 보고

## STEP 2: 최종 QA
- qa-validator 서브에이전트에 위임:
  - `npm run build` — exit 0
  - `npx tsc --noEmit` — exit 0
  - Supabase 테이블별 row count 확인
  - 주요 페이지 에러 없는지 확인
- qa-report.md에 최종 QA 결과 기록

## STEP 3: 배포
- `vercel --prod` 실행
- 배포 URL 기록

## STEP 4: 배포 후 확인
- 프로덕션 URL 접속 가능한지 확인
- /api/health 엔드포인트 응답 확인 (있다면)
- 주요 페이지 3개 로딩 확인: /, /country/KOR, /compare

## STEP 5: 최종 Sign-off
- qa-report.md에 Phase 5 최종 결과 기록
- 커밋: `[Phase 5] Production deployment`

