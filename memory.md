# VisualClimate — 프로젝트 상태
# 마지막 업데이트: 2026-03-15 (세션 2)

## 현재 상태
- 총 커밋: 85+ | 브랜치: main only
- 빌드: PASS (최근 확인)
- 프로덕션: https://visualclimate.org
- 현재 Phase: Phase 1 진행 중

## 데이터 현황
- Supabase: 172,121행, 250국, 61 지표
- Kaya LMDI: 68국 | NDC Gap: 204국 | Risk Profile: 6국만
- 데이터 소스: WB WDI, Ember, OWID/GCP, ND-GAIN, Climate TRACE, UNFCCC NDC

## 최근 완료 작업 (역순)
- `b7b58cf` docs: CLAUDE.md v3 restructure (454→83줄) + docs/ 9개 + memory.md + todo.md
- 루트 정리: IEA 참조 이미지 → mockups/, 구 문서 → archive/
- Carbon Inequality 포스터 KOR 검증: 코드 에러 없음, 타입 PASS, 빌드 PASS
- `fbf9734` feat: Compare page redesign + 6 new Claude commands
- `cd0bff1` feat: Phase 1 Section 9 — UI redesign + bug fixes + PostersClient refactor
- `9dacbad` feat: linkedin card system + full refactor
- `8a6837b` chore: save recent progress
- `b401d66` fix: hero fan animation
- `6954d0e` fix: hero-bento crossfade + 3D tilt
- `6a9d16e` feat: hero fan-to-grid + bento + explorer

## 알려진 기술부채
- useInView hooks: fade-in disabled (opacity always 1)
- Scene refs (1-8): assigned but unused
- CountryClient.tsx.backup: 삭제 필요
- risk-profile JSON: 6국만 (KOR, USA, DEU, BRA, NGA, BGD)
- emissions-trend: 6국만 → 나머지 인사이트 텍스트 없음
- /library 페이지: 리포트 링크 미연결
- EMBER.CARBON.INTENSITY, DERIVED.CO2_PER_GDP, DERIVED.ENERGY_TRANSITION 미활용
- 빈 디렉토리: src/app/data/, data/frameworks/, data/quality-reports/, data/reports/, data/risk/, data/source-registry/

## 포스터 검증 로그
- Carbon Inequality (KOR vs BGD): 2026-03-15 검증 완료
  - PILOT_DATA 사용 (co2: KOR=11.4t, BGD=0.7t, ratio=16)
  - TypeScript/빌드 에러 없음
  - 잠재 리스크: html2canvas의 inline SVG 렌더링 제한 (브라우저 테스트 필요)
  - 비파일럿 국가 선택 시 adj 필드가 국가명으로 대체됨 (headline 어색할 수 있음)

## 패턴 & 주의사항
- SafeChart: 모든 차트를 ErrorBoundary로 감쌈
- CTRACE sector keys: CTRACE.POWER, CTRACE.TRANSPORTATION 등 9개
- OWID fuel keys: client fetch로 가져옴
- PILOT_ISO3 6개 + ALL_ISO3 20개 (src/lib/constants.ts)
- Grade system: A+~F (7~0), class: Changer/Starter/Talker (1/2/3)

## 데이터 흐름
```
Supabase (country_data, countries, indicators)
  → page.tsx (SSR fetch) → CountryClient.tsx (props)
  → CountryClient useEffect (OWID, CTRACE client fetch)
  → data/analysis/*.json (static import)
```

## ETL 스크립트
etl-expand-countries, etl-owid, etl-climatetrace, etl-ember, etl-ndgain, etl-additional-indicators, co2-trend-comparison, qa-data-check
