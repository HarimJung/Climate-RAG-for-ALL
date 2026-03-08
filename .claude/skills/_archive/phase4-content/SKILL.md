---
name: phase4-content
description: Phase 4 content and SEO — step-by-step
disable-model-invocation: true
---

# Phase 4: Content + SEO

## 실행 규칙
- 한 스텝씩 순서대로
- 각 스텝 후 `npm run build` 필수
- 서브에이전트 seo-content에 위임하라

## 전제 조건
- docs/drafts/에 Antigravity가 작성한 파일이 있어야 한다
- 없으면 STEP 1을 건너뛰고 STEP 2에서 직접 작성

---

## STEP 1: Antigravity 결과물 읽기
- docs/drafts/ 폴더의 모든 .md 파일을 읽어라
- 디자인 메모, 국가 프로파일 초안, SEO 초안이 있는지 확인
- 있으면 해당 내용을 참고하여 아래 스텝 진행
- 없으면 자체 판단으로 진행

## STEP 2: MetaTags 컴포넌트
- src/components/seo/MetaTags.tsx
- Props: title, description, ogImage, url
- 기본 title 포맷: `{Page} | VisualClimate — Climate Data Wiki`
- description: max 160자
- `npm run build`

## STEP 3: 페이지별 메타 적용
- src/app/page.tsx에 MetaTags 적용
- src/app/country/[iso3]/page.tsx에 국가별 동적 MetaTags
- src/app/compare/page.tsx에 MetaTags
- src/app/data/page.tsx에 MetaTags
- `npm run build`

## STEP 4: JSON-LD 구조화 데이터
- src/components/seo/JsonLd.tsx
- Dataset 스키마 (각 데이터 카테고리)
- Organization 스키마 (VisualClimate)
- WebPage 스키마 (각 페이지)
- `npm run build`

## STEP 5: 사이트맵
- public/sitemap.xml 생성
- 모든 정적 페이지 + 6개국 동적 페이지
- `npm run build`

## STEP 6: 최종 확인
- `npm run build`
- `npx tsc --noEmit`
- qa-report.md Phase 4 결과 기록
- 커밋: `[Phase 4] Content + SEO — meta tags, JSON-LD, sitemap`

