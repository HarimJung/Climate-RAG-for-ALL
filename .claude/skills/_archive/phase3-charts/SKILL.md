---
name: phase3-charts
description: Phase 3 D3 chart implementation — step-by-step
disable-model-invocation: true
---

# Phase 3: D3 Charts

아래 스텝을 순서대로, 한 스텝씩 실행하라.
각 스텝 완료 후 npm run build 필수.
design-system 스킬을 먼저 로드하라.
모든 차트: 'use client', 반응형, 다크 테마, aria-label 필수.

---

## STEP 1: LineChart
- src/components/charts/LineChart.tsx
- CO2 per capita 시계열 (6개국 비교)
- X축: year, Y축: value, 범례: 국가별 색상 (design-system 차트 팔레트)
- Props: data, indicator, countries
- `npm run build`

## STEP 2: BarChart
- src/components/charts/BarChart.tsx
- 국가간 비교 (수평 막대)
- Props: data, indicator, year
- `npm run build`

## STEP 3: DonutChart
- src/components/charts/DonutChart.tsx
- 비율 표시 (에너지 믹스, 섹터별 배출)
- Props: data, labels, colors
- `npm run build`

## STEP 4: 차트를 페이지에 연결
- EmissionsOverview.tsx에 LineChart 연결 (CO2 per capita)
- EnergyProfile.tsx에 DonutChart placeholder 연결
- compare/page.tsx에 BarChart 연결
- `npm run build`

## STEP 5: 최종 확인 + 커밋
- npm run build
- qa-report.md Phase 3 Charts 결과 기록
- 커밋: [Phase 3] D3 charts — line, bar, donut integrated

