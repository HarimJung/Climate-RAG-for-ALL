#!/bin/bash
cd ~/Documents/visualclimate

echo "=========================================="
echo "STEP 1: NDC 목표치 — API/크롤링으로 수집"
echo "=========================================="
claude -p "ndc-gap-methodology 스킬 읽고:
1. supabase/migrations/ 에 ndc_targets 테이블 생성 SQL (iso3 PK, country_name, target_year, target_pct_reduction, target_abs_mtco2e, reference_year, base_year_value, submission_status, source_url, updated_at)
2. scripts/etl/collect-ndc-targets.ts 생성:
   - Climate Watch API (https://www.climatewatchdata.org/api/v1/ndcs) 에서 NDC 데이터 fetch
   - 각 국가의 2035 target 추출 (없으면 2030 target 사용)
   - API 실패시 UNFCCC NDC Registry 페이지 크롤링 fallback
   - 108개국 제출분은 submission_status='submitted', 나머지는 'not_submitted'
   - 하드코딩 절대 금지 — 모든 데이터는 API/크롤링 소스에서
   - target이 range(예: 62-70%)이면 lower bound 저장 (conservative)
   - Supabase에 upsert
3. 스크립트 실행
4. 삽입된 행 수 출력으로 확인
5. npm run build. 실패시 3번 재시도." --allowedTools "Bash,Read,Edit,Write"

echo "=========================================="
echo "STEP 2: NDC Gap 계산 — 전체 국가 동적"
echo "=========================================="
claude -p "ndc-gap-methodology 스킬 읽고:
1. scripts/analysis/calculate-ndc-gap.ts 생성
2. Supabase에서 모든 국가의 CO₂ per capita 시계열 조회 (EN.GHG.CO2.PC.CE.AR5)
3. 각 국가별 CAGR(2015-2023) 계산, 2035 외삽
4. ndc_targets 테이블 JOIN — target 있는 국가는 갭+확률 계산, 없는 국가는 projection만
5. z-score 달성 확률 계산
6. 하드코딩 금지 — 국가 목록은 Supabase 쿼리에서 동적으로
7. public/data/ndc-gap/{ISO3}.json 국가별 저장
8. public/data/ndc-gap/summary.json — 전체 국가 요약 (on_track 수, off_track 수, no_target 수)
9. metadata: generated_at, total_countries, methodology_version
10. npm run build. 실패시 3번 재시도." --allowedTools "Bash,Read,Edit,Write"

echo "=========================================="
echo "STEP 3: Kaya LMDI — 전체 국가 동적"
echo "=========================================="
claude -p "kaya-decomposition 스킬 읽고:
1. scripts/analysis/calculate-kaya.ts 생성
2. Supabase에서 모든 국가의 SP.POP.TOTL, NY.GDP.PCAP.CD, EG.USE.PCAP.KG.OE 조회
3. Carbon intensity는 EMBER.CARBON.INTENSITY 우선, 없으면 DERIVED 계산
4. 국가 목록 하드코딩 금지 — 4개 지표 모두 있는 국가만 자동 필터
5. LMDI additive 분해 (2015→2023)
6. 검증: 4요소 합 = 실제 변화 ±2%
7. 초과시 해당 국가 로그 기록하고 결과에 confidence: LOW 표시
8. public/data/kaya/{ISO3}.json 저장
9. public/data/kaya/summary.json — 전체 국가별 biggest factor 요약
10. npm run build. 실패시 3번 재시도." --allowedTools "Bash,Read,Edit,Write"

echo "=========================================="
echo "STEP 4: Equity Map — 전체 국가 동적"
echo "=========================================="
claude -p "climate-equity-map 스킬 읽고:
1. scripts/analysis/calculate-equity.ts 생성
2. Supabase에서 OWID.CUMULATIVE_CO2, SP.POP.TOTL, NDGAIN.VULNERABILITY, EN.GHG.CO2.PC.CE.AR5, DERIVED.CLIMATE_CLASS 조회
3. 국가 목록 하드코딩 금지 — 쿼리 결과에서 동적으로
4. population < 100000 제외, NULL 필드 있는 국가 제외
5. cumulative_co2_per_capita 계산
6. public/data/equity-scatter.json 저장
7. metadata: generated_at, country_count, excluded_count, exclusion_reasons
8. npm run build. 실패시 3번 재시도." --allowedTools "Bash,Read,Edit,Write"

echo "=========================================="
echo "STEP 5: 차트 컴포넌트 3개"
echo "=========================================="
claude -p "design-system 스킬 읽고:
1. src/components/charts/NDCGapChart.tsx — props: iso3. JSON fetch 동적. NDC 미제출 국가는 projection만 표시 + 'NDC not yet submitted' 배지. 호버 툴팁, 디자인시스템 색상.
2. src/components/charts/KayaWaterfall.tsx — props: iso3. JSON fetch 동적. 데이터 없으면 null return (섹션 자동 숨김). 워터폴 차트.
3. src/components/charts/EquityScatter.tsx — props: highlightIso3. 전체 equity-scatter.json fetch. 해당 국가 하이라이트. 200개국 점 모두 표시.
4. 모든 차트: 반응형, motion/react fade-in, 호버 인터랙션
5. 하드코딩 금지 — 모든 데이터는 JSON fetch, 국가 목록/색상/라벨 전부 데이터에서
6. npm run build. 실패시 3번 재시도." --allowedTools "Bash,Read,Edit,Write"

echo "=========================================="
echo "STEP 6: Country 페이지 통합"
echo "=========================================="
claude -p "CountryClient.tsx 수정:
1. NDCGapChart 추가 — iso3 props 전달, 데이터 없으면 'Coming soon' 표시
2. KayaWaterfall 추가 — iso3 props 전달, null이면 섹션 안 보임
3. EquityScatter 추가 — highlightIso3 props 전달
4. 기존 하드코딩된 6개국 Pre-Paris 바차트 완전 제거
5. 기존 하드코딩된 6개국 Vulnerability 산점도 완전 제거
6. 하드코딩된 비교 국가 목록 완전 제거
7. Data Sources Derived accordion default collapsed
8. 섹션간 py-16 + border-b border-gray-100
9. 하드코딩 금지 — 모든 데이터는 fetch/props 기반
10. npm run build. 실패시 3번 재시도." --allowedTools "Bash,Read,Edit,Write"

echo "=========================================="
echo "STEP 7: QA 검증"
echo "=========================================="
claude -p "qa-validator 에이전트로:
1. NDC Gap JSON 파일 수 확인 — ndc_targets 행 수와 일치하는지
2. Kaya JSON 파일에서 4요소 합계 검증 — ±2% 초과 국가 리스트
3. Equity scatter에서 country_count >= 150 확인
4. CountryClient.tsx에 하드코딩된 국가 ISO3 코드가 남아있는지 grep 검사
5. PM2.5 연도 라벨이 실제 데이터 최신 연도와 일치하는지
6. 결과를 tasks/qa-report.md에 기록" --allowedTools "Bash,Read,Edit,Write,Grep,Glob"

echo "=========================================="
echo "STEP 8: 배포"
echo "=========================================="
claude -p "npm run build && git add -A && git commit -m 'feat: 3 killing features — NDC Gap + Kaya + Equity Map (all data-driven, zero hardcoding)' && git push origin main && npx vercel --prod. 실패시 3번 재시도." --allowedTools "Bash"

echo "=========================================="
echo "완료! 하드코딩 제로. 전부 데이터 기반."
echo "=========================================="
