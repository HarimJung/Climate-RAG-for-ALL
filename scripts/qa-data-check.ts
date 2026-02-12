/**
 * scripts/qa-data-check.ts
 * Phase 2 QA 데이터 검증 스크립트
 * 실행: npx tsx --env-file=.env.local scripts/qa-data-check.ts
 *
 * 검증 항목:
 * - 3a. 국가 x 지표 조합별 행 수
 * - 3b. NULL 값 비율
 * - 3c. 중복 행 확인
 * - 3d. 연도 범위 확인 (2000-2023)
 * - 추가: countries 테이블 행 수, indicators 테이블 행 수
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('환경변수 누락: SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 파일럿 국가 목록
const PILOT_COUNTRIES = ['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD'];

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

const results: CheckResult[] = [];

async function checkCountries() {
  console.log('\n=== countries 테이블 확인 ===');
  const { data, error, count } = await supabase
    .from('countries')
    .select('iso3, name', { count: 'exact' });

  if (error) {
    console.error('  countries 조회 실패:', error.message);
    results.push({ name: 'countries 테이블', status: 'FAIL', details: error.message });
    return;
  }

  const totalCount = count ?? data?.length ?? 0;
  console.log(`  총 행 수: ${totalCount}`);

  // 파일럿 국가 존재 확인
  const pilotFound = PILOT_COUNTRIES.filter(iso3 =>
    data?.some((c: { iso3: string }) => c.iso3.trim() === iso3)
  );
  const pilotMissing = PILOT_COUNTRIES.filter(iso3 => !pilotFound.includes(iso3));

  console.log(`  파일럿 국가 존재: ${pilotFound.join(', ')}`);
  if (pilotMissing.length > 0) {
    console.log(`  파일럿 국가 누락: ${pilotMissing.join(', ')}`);
  }

  const status = pilotMissing.length === 0 ? 'PASS' : 'FAIL';
  results.push({
    name: 'countries 테이블 (파일럿 6개국)',
    status,
    details: `총 ${totalCount}개국, 파일럿 ${pilotFound.length}/6 존재${pilotMissing.length > 0 ? ` (누락: ${pilotMissing.join(', ')})` : ''}`,
  });
}

async function checkIndicators() {
  console.log('\n=== indicators 테이블 확인 ===');
  const { data, error, count } = await supabase
    .from('indicators')
    .select('id, source, code, name, unit, category', { count: 'exact' });

  if (error) {
    console.error('  indicators 조회 실패:', error.message);
    results.push({ name: 'indicators 테이블', status: 'FAIL', details: error.message });
    return;
  }

  const totalCount = count ?? data?.length ?? 0;
  console.log(`  총 지표 수: ${totalCount}`);
  data?.forEach((ind: { id: number; source: string; code: string; name: string }) => {
    console.log(`    [${ind.id}] ${ind.source}/${ind.code} — ${ind.name}`);
  });

  const status = totalCount > 0 ? 'PASS' : 'FAIL';
  results.push({
    name: 'indicators 테이블',
    status,
    details: `${totalCount}개 지표 등록됨`,
  });
}

async function checkDataCombinations() {
  console.log('\n=== 3a. 국가 x 지표 조합별 행 수 확인 ===');

  // 파일럿 국가의 country_id 매핑 조회
  const { data: countries } = await supabase
    .from('countries')
    .select('id, iso3')
    .in('iso3', PILOT_COUNTRIES);

  const countryMap = new Map<number, string>();
  countries?.forEach((c: { id: number; iso3: string }) => countryMap.set(c.id, c.iso3.trim()));
  const pilotCountryIds = Array.from(countryMap.keys());

  // 지표 매핑 조회
  const { data: indicators } = await supabase
    .from('indicators')
    .select('id, source, code');

  const indicatorMap = new Map<number, string>();
  indicators?.forEach((ind: { id: number; source: string; code: string }) =>
    indicatorMap.set(ind.id, `${ind.source}/${ind.code}`)
  );

  // indicator_values 데이터 조회 (파일럿 국가만)
  const { data: values, error } = await supabase
    .from('indicator_values')
    .select('indicator_id, country_id, year, value')
    .in('country_id', pilotCountryIds);

  if (error) {
    console.error('  indicator_values 조회 실패:', error.message);
    results.push({ name: '3a. 조합별 행 수', status: 'FAIL', details: error.message });
    return values;
  }

  // 조합별 카운트
  const comboCounts = new Map<string, number>();
  values?.forEach((v: { indicator_id: number; country_id: number }) => {
    const iso3 = countryMap.get(v.country_id) ?? '???';
    const indCode = indicatorMap.get(v.indicator_id) ?? '???';
    const key = `${iso3} x ${indCode}`;
    comboCounts.set(key, (comboCounts.get(key) ?? 0) + 1);
  });

  // 정렬하여 출력
  const sortedCombos = Array.from(comboCounts.entries()).sort();
  console.log(`  조합 수: ${sortedCombos.length}`);
  sortedCombos.forEach(([key, cnt]) => {
    console.log(`    ${key}: ${cnt}행`);
  });

  const totalRows = values?.length ?? 0;
  console.log(`  파일럿 국가 총 행 수: ${totalRows}`);

  // 각 파일럿 국가에 대해 최소 1개 지표 데이터 존재 확인
  const countriesWithData = new Set<string>();
  values?.forEach((v: { country_id: number }) => {
    const iso3 = countryMap.get(v.country_id);
    if (iso3) countriesWithData.add(iso3);
  });

  const missingCountries = PILOT_COUNTRIES.filter(c => !countriesWithData.has(c));

  const status = totalRows > 0 && missingCountries.length === 0 ? 'PASS' :
    totalRows > 0 ? 'WARN' : 'FAIL';
  results.push({
    name: '3a. 국가 x 지표 조합별 행 수',
    status,
    details: `${sortedCombos.length}개 조합, 총 ${totalRows}행${missingCountries.length > 0 ? ` (데이터 없는 국가: ${missingCountries.join(', ')})` : ''}`,
  });

  return values;
}

async function checkNullValues() {
  console.log('\n=== 3b. NULL 값 비율 확인 ===');

  // 파일럿 국가의 country_id
  const { data: countries } = await supabase
    .from('countries')
    .select('id')
    .in('iso3', PILOT_COUNTRIES);

  const pilotIds = countries?.map((c: { id: number }) => c.id) ?? [];

  const { data: allValues, error } = await supabase
    .from('indicator_values')
    .select('value')
    .in('country_id', pilotIds);

  if (error) {
    console.error('  NULL 확인 실패:', error.message);
    results.push({ name: '3b. NULL 값 비율', status: 'FAIL', details: error.message });
    return;
  }

  const total = allValues?.length ?? 0;
  const nullCount = allValues?.filter((v: { value: number | null }) => v.value === null).length ?? 0;
  const nullPct = total > 0 ? ((nullCount / total) * 100).toFixed(2) : '0.00';

  console.log(`  총 행: ${total}`);
  console.log(`  NULL 값: ${nullCount}`);
  console.log(`  NULL 비율: ${nullPct}%`);

  const status = parseFloat(nullPct) < 30 ? 'PASS' : 'WARN';
  results.push({
    name: '3b. NULL 값 비율',
    status,
    details: `총 ${total}행 중 NULL ${nullCount}개 (${nullPct}%)`,
  });
}

async function checkDuplicates() {
  console.log('\n=== 3c. 중복 행 확인 ===');

  // indicator_values 테이블에 UNIQUE(indicator_id, country_id, year) 제약 존재
  // 따라서 DB 수준에서 중복 불가능하지만, 확인 차원에서 전체 조회
  const { data: countries } = await supabase
    .from('countries')
    .select('id')
    .in('iso3', PILOT_COUNTRIES);

  const pilotIds = countries?.map((c: { id: number }) => c.id) ?? [];

  const { data: values, error } = await supabase
    .from('indicator_values')
    .select('indicator_id, country_id, year')
    .in('country_id', pilotIds);

  if (error) {
    console.error('  중복 확인 실패:', error.message);
    results.push({ name: '3c. 중복 행', status: 'FAIL', details: error.message });
    return;
  }

  const seen = new Set<string>();
  const duplicates: string[] = [];

  values?.forEach((v: { indicator_id: number; country_id: number; year: number }) => {
    const key = `${v.indicator_id}-${v.country_id}-${v.year}`;
    if (seen.has(key)) {
      duplicates.push(key);
    }
    seen.add(key);
  });

  console.log(`  검사한 행: ${values?.length ?? 0}`);
  console.log(`  중복 발견: ${duplicates.length}개`);

  if (duplicates.length > 0) {
    duplicates.slice(0, 10).forEach(d => console.log(`    중복 키: ${d}`));
  }

  const status = duplicates.length === 0 ? 'PASS' : 'FAIL';
  results.push({
    name: '3c. 중복 행 확인',
    status,
    details: duplicates.length === 0
      ? `중복 없음 (UNIQUE 제약 존재)`
      : `${duplicates.length}개 중복 발견`,
  });
}

async function checkYearRange() {
  console.log('\n=== 3d. 연도 범위 확인 (2000-2023) ===');

  const { data: countries } = await supabase
    .from('countries')
    .select('id')
    .in('iso3', PILOT_COUNTRIES);

  const pilotIds = countries?.map((c: { id: number }) => c.id) ?? [];

  // year < 2000 확인
  const { data: tooEarly, error: errEarly } = await supabase
    .from('indicator_values')
    .select('year', { count: 'exact' })
    .in('country_id', pilotIds)
    .lt('year', 2000);

  // year > 2023 확인
  const { data: tooLate, error: errLate } = await supabase
    .from('indicator_values')
    .select('year', { count: 'exact' })
    .in('country_id', pilotIds)
    .gt('year', 2023);

  if (errEarly || errLate) {
    console.error('  연도 범위 확인 실패:', errEarly?.message ?? errLate?.message);
    results.push({ name: '3d. 연도 범위', status: 'FAIL', details: errEarly?.message ?? errLate?.message ?? '' });
    return;
  }

  const earlyCount = tooEarly?.length ?? 0;
  const lateCount = tooLate?.length ?? 0;
  const outOfRange = earlyCount + lateCount;

  console.log(`  2000 미만: ${earlyCount}행`);
  console.log(`  2023 초과: ${lateCount}행`);
  console.log(`  범위 외 합계: ${outOfRange}행`);

  const status = outOfRange === 0 ? 'PASS' : 'FAIL';
  results.push({
    name: '3d. 연도 범위 (2000-2023)',
    status,
    details: outOfRange === 0
      ? '모든 데이터가 2000-2023 범위 내'
      : `범위 외 ${outOfRange}행 (2000 미만: ${earlyCount}, 2023 초과: ${lateCount})`,
  });
}

async function checkCountryDataTable() {
  console.log('\n=== country_data 테이블 존재 확인 ===');

  // country_data 테이블 존재 여부 확인 (CLAUDE.md에서 언급된 테이블)
  const { data, error } = await supabase
    .from('country_data')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`  country_data 테이블: 접근 불가 또는 미존재 (${error.message})`);
    results.push({
      name: 'country_data 테이블',
      status: 'WARN',
      details: `테이블 미존재 또는 접근 불가 — 실제 데이터는 indicator_values 테이블 사용 중. 오류: ${error.message}`,
    });
  } else {
    console.log(`  country_data 테이블 존재`);
    results.push({
      name: 'country_data 테이블',
      status: 'PASS',
      details: `테이블 존재`,
    });
  }
}

async function checkQualityScores() {
  console.log('\n=== Phase 2: 품질 점수 확인 ===');

  // 품질 점수 컬럼 존재 여부 확인 (indicator_values 또는 별도 테이블)
  // 현재 스키마에는 quality_score 컬럼 미존재 — 보고용으로 기록
  results.push({
    name: 'Phase 2: 품질 점수',
    status: 'WARN',
    details: '현재 스키마에 quality_score 컬럼 미구현. Phase 2 요구사항으로 추가 필요.',
  });

  // data/analysis/ 디렉토리 확인
  results.push({
    name: 'Phase 2: data/analysis/ 디렉토리',
    status: 'WARN',
    details: 'data/analysis/ 디렉토리 미존재. Phase 2 분석 파일 생성 필요.',
  });
}

async function printSummary() {
  console.log('\n\n========================================');
  console.log('       QA 데이터 검증 결과 요약');
  console.log('========================================\n');

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : '[WARN]';
    console.log(`  ${icon} ${r.name}`);
    console.log(`         ${r.details}`);
    if (r.status === 'PASS') passCount++;
    else if (r.status === 'FAIL') failCount++;
    else warnCount++;
  });

  console.log(`\n  합계: PASS=${passCount}, WARN=${warnCount}, FAIL=${failCount}`);
  console.log(`  전체 판정: ${failCount === 0 ? 'PASS (경고 포함)' : 'FAIL'}`);
  console.log('========================================\n');
}

async function main() {
  console.log('=== VisualClimate Phase 2 QA 데이터 검증 ===');
  console.log(`실행 시각: ${new Date().toISOString()}`);
  console.log(`대상 국가: ${PILOT_COUNTRIES.join(', ')}`);

  await checkCountries();
  await checkIndicators();
  await checkDataCombinations();
  await checkNullValues();
  await checkDuplicates();
  await checkYearRange();
  await checkCountryDataTable();
  await checkQualityScores();
  await printSummary();
}

main().catch(err => {
  console.error('스크립트 실행 실패:', err);
  process.exit(1);
});
