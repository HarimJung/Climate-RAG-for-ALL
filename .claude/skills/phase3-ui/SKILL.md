
name: phase3-ui
description: Phase 3 UI implementation — step-by-step execution plan
disable-model-invocation: true


# Phase 3: UI Implementation

아래 스텝을 순서대로, **한 스텝씩** 실행하라.
각 스텝 완료 후 반드시 `npm run build`를 실행하고, 통과해야 다음 스텝으로 넘어간다.
빌드 실패 시 STOP and THINK → 수정 → 재빌드. 2회 실패 시 해당 스텝을 tasks/lessons.md에 기록하고 다음 스텝으로.

design-system 스킬을 먼저 로드하라.
country-profile-template 스킬을 STEP 5 전에 로드하라.


## STEP 1: Header + Footer
- src/components/Header.tsx — 네비게이션 바 (Home, Countries, Compare, Data)
- src/components/Footer.tsx — 저작권, 데이터 출처 링크
- 다크 테마, design-system 토큰 적용
- `npm run build`

## STEP 2: StatCard 컴포넌트
- src/components/StatCard.tsx — 재사용 가능한 데이터 카드
- Props: title, value, unit, trend (up/down/neutral), source
- 다크 테마 카드 스타일
- `npm run build`

## STEP 3: 랜딩 페이지
- src/app/page.tsx 구현
- 히어로: 프로젝트 소개 텍스트 + 6개국 하이라이트
- StatCard 3개: 총 데이터 포인트 수, 국가 수, 지표 수 (Supabase에서 COUNT)
- 6개국 카드 그리드 (클릭 시 /country/{iso3}로 이동)
- `npm run build`

## STEP 4: 레이아웃 적용
- src/app/layout.tsx에 Header, Footer 적용
- 글로벌 다크 테마 배경 (#0a0a0f)
- Inter 폰트 로딩
- `npm run build`

## STEP 5: 국가 프로파일 페이지 뼈대
- src/app/country/[iso3]/page.tsx
- Server component에서 Supabase로 해당 국가 데이터 fetch
- 섹션 placeholder: EmissionsOverview, EnergyProfile, SocioeconomicContext, ClimateRisk, PolicyStatus
- 각 섹션은 빈 컴포넌트로 먼저 생성 (src/components/country/)
- `npm run build`

## STEP 6: EmissionsOverview 컴포넌트
- src/components/country/EmissionsOverview.tsx
- StatCard로 총 GHG, CO2 per capita, YoY 변화 표시
- 차트는 Phase 3 차트 스텝에서 추가 (여기서는 placeholder)
- `npm run build`

## STEP 7: EnergyProfile 컴포넌트
- src/components/country/EnergyProfile.tsx
- StatCard로 에너지 사용량, 재생에너지 비율 표시
- `npm run build`

## STEP 8: 비교 페이지 뼈대
- src/app/compare/page.tsx
- 6개국 선택 UI (체크박스 또는 드롭다운)
- 선택한 국가들의 StatCard 나란히 표시
- `npm run build`

## STEP 9: 데이터 탐색 페이지 뼈대
- src/app/data/page.tsx
- 지표 목록 테이블 (indicators 테이블에서 fetch)
- 국가 필터, 도메인 필터
- `npm run build`

## STEP 10: 최종 확인 + 커밋
- npm run build 최종 확인
- npx tsc --noEmit 타입 체크
- qa-report.md에 Phase 3 UI 결과 기록
- 커밋: [Phase 3] UI implementation — landing, country profile, compare, data explorer
