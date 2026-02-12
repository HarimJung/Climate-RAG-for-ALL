/**
 * scripts/derived-emissions-intensity.ts
 * Phase 2 파생 지표: 배출 집약도 (Emissions Intensity)
 *
 * 계산 공식: emissions_intensity = EN.ATM.GHGT.KT.CE / NY.GDP.MKTP.CD
 * 단위: kt CO2e per USD
 *
 * 데이터 소스:
 *   - EN.ATM.GHGT.KT.CE (총 GHG 배출량, kt CO2e) -> indicator_values 테이블
 *   - NY.GDP.MKTP.CD (GDP, current US$) -> indicator_values 테이블
 *
 * 결과 저장:
 *   - indicators 테이블에 'DERIVED.EMISSIONS_INTENSITY' 등록 (source='derived')
 *   - country_data 테이블에 결과 삽입
 *
 * 실행: npx tsx --env-file=.env.local scripts/derived-emissions-intensity.ts
 */

import { createClient } from '@supabase/supabase-js';

// ── 환경변수 검증 ──
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수 누락');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── 파일럿 국가 ──
const PILOT_ISO3 = ['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD'];

// ── 파생 지표 정의 ──
const DERIVED_INDICATOR = {
  source: 'derived',
  code: 'DERIVED.EMISSIONS_INTENSITY',
  name: 'Emissions Intensity',
  unit: 'kt CO2e per USD',
  category: 'emissions',
};

// ── 입력 지표 코드 ──
const GHG_CODE = 'EN.ATM.GHGT.KT.CE';
const GDP_CODE = 'NY.GDP.MKTP.CD';

// ── 데이터 포인트 타입 ──
interface IndicatorValue {
  iso3: string;
  year: number;
  value: number;
}

/**
 * indicator_values 테이블에서 특정 지표의 파일럿 국가 데이터를 조회
 * indicators 테이블과 countries 테이블을 JOIN하여 iso3 코드를 얻음
 */
async function fetchIndicatorData(indicatorCode: string): Promise<IndicatorValue[]> {
  // 1단계: indicators 테이블에서 indicator_id 조회
  const { data: indRow, error: indErr } = await supabase
    .from('indicators')
    .select('id')
    .eq('code', indicatorCode)
    .single();

  if (indErr || !indRow) {
    console.error(`[ERROR] 지표 ${indicatorCode} 조회 실패:`, indErr?.message);
    return [];
  }

  const indicatorId = indRow.id;
  console.log(`  [INFO] ${indicatorCode} -> indicator_id: ${indicatorId}`);

  // 2단계: countries 테이블에서 파일럿 국가 id 매핑
  const { data: countries, error: cErr } = await supabase
    .from('countries')
    .select('id, iso3')
    .in('iso3', PILOT_ISO3);

  if (cErr || !countries) {
    console.error('[ERROR] 국가 목록 조회 실패:', cErr?.message);
    return [];
  }

  const countryIdToIso3 = new Map<number, string>();
  const countryIds: number[] = [];
  for (const c of countries) {
    countryIdToIso3.set(c.id, c.iso3.trim());
    countryIds.push(c.id);
  }

  // 3단계: indicator_values에서 해당 지표 + 파일럿 국가 데이터 조회
  const { data: values, error: vErr } = await supabase
    .from('indicator_values')
    .select('country_id, year, value')
    .eq('indicator_id', indicatorId)
    .in('country_id', countryIds)
    .order('year', { ascending: true });

  if (vErr || !values) {
    console.error(`[ERROR] ${indicatorCode} 데이터 조회 실패:`, vErr?.message);
    return [];
  }

  // iso3 코드로 변환
  const results: IndicatorValue[] = [];
  for (const v of values) {
    const iso3 = countryIdToIso3.get(v.country_id);
    if (!iso3 || v.value === null || v.value === undefined) continue;
    results.push({ iso3, year: v.year, value: Number(v.value) });
  }

  console.log(`  [INFO] ${indicatorCode}: ${results.length}개 데이터 포인트 로드됨`);
  return results;
}

/**
 * indicators 테이블에 파생 지표 등록 (이미 존재하면 skip)
 */
async function registerDerivedIndicator(): Promise<boolean> {
  // 기존 존재 확인
  const { data: existing } = await supabase
    .from('indicators')
    .select('id')
    .eq('source', DERIVED_INDICATOR.source)
    .eq('code', DERIVED_INDICATOR.code)
    .single();

  if (existing) {
    console.log(`[INFO] 파생 지표 이미 존재: ID ${existing.id}`);
    return true;
  }

  // 신규 등록
  const { data: inserted, error } = await supabase
    .from('indicators')
    .insert({
      source: DERIVED_INDICATOR.source,
      code: DERIVED_INDICATOR.code,
      name: DERIVED_INDICATOR.name,
      unit: DERIVED_INDICATOR.unit,
      category: DERIVED_INDICATOR.category,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[ERROR] 파생 지표 등록 실패:', error.message);
    return false;
  }

  console.log(`[INFO] 파생 지표 등록 완료: ${DERIVED_INDICATOR.code} -> ID ${inserted.id}`);
  return true;
}

/**
 * 배출 집약도 계산 및 country_data 테이블에 결과 삽입
 */
async function calculateAndInsert(
  ghgData: IndicatorValue[],
  gdpData: IndicatorValue[],
): Promise<number> {
  // GHG 데이터를 (iso3, year) -> value 맵으로 변환
  const ghgMap = new Map<string, number>();
  for (const d of ghgData) {
    ghgMap.set(`${d.iso3}_${d.year}`, d.value);
  }

  // GDP 데이터를 (iso3, year) -> value 맵으로 변환
  const gdpMap = new Map<string, number>();
  for (const d of gdpData) {
    gdpMap.set(`${d.iso3}_${d.year}`, d.value);
  }

  // 양쪽 모두 존재하는 (iso3, year) 조합에 대해 비율 계산
  const derivedRows: Array<{
    country_iso3: string;
    indicator_code: string;
    year: number;
    value: number;
    source: string;
  }> = [];

  for (const [key, ghgVal] of ghgMap) {
    const gdpVal = gdpMap.get(key);
    if (!gdpVal || gdpVal <= 0) continue; // GDP가 0이거나 없으면 skip

    const [iso3, yearStr] = key.split('_');
    const year = parseInt(yearStr, 10);
    const intensity = ghgVal / gdpVal;

    derivedRows.push({
      country_iso3: iso3,
      indicator_code: DERIVED_INDICATOR.code,
      year,
      value: intensity,
      source: 'derived',
    });
  }

  // 국가별 정렬 후 출력
  derivedRows.sort((a, b) => a.country_iso3.localeCompare(b.country_iso3) || a.year - b.year);

  console.log(`\n[계산 결과] ${derivedRows.length}개 데이터 포인트 생성됨`);
  console.log('──────────────────────────────────────────');

  // 국가별 요약
  const byCountry = new Map<string, number>();
  for (const r of derivedRows) {
    byCountry.set(r.country_iso3, (byCountry.get(r.country_iso3) ?? 0) + 1);
  }
  for (const [iso3, count] of byCountry) {
    console.log(`  ${iso3}: ${count}개 연도`);
  }

  // 샘플 데이터 출력 (각 국가 최신 연도)
  console.log('\n[샘플] 각 국가 최신 연도 배출 집약도:');
  for (const iso3 of PILOT_ISO3) {
    const latest = derivedRows
      .filter(r => r.country_iso3 === iso3)
      .sort((a, b) => b.year - a.year)[0];
    if (latest) {
      console.log(`  ${iso3} (${latest.year}): ${latest.value.toExponential(4)} kt CO2e / USD`);
    }
  }

  // country_data 테이블에 upsert
  // country_data에는 unique 제약이 있을 수 있으므로 배치로 삽입
  console.log(`\n[DB] country_data 테이블에 ${derivedRows.length}행 삽입 중...`);

  // 기존 데이터 삭제 (같은 indicator_code로 된 이전 결과 제거)
  const { error: delErr } = await supabase
    .from('country_data')
    .delete()
    .eq('indicator_code', DERIVED_INDICATOR.code);

  if (delErr) {
    console.error('[WARN] 기존 데이터 삭제 실패 (무시):', delErr.message);
  }

  // 배치 삽입 (100행씩)
  const BATCH_SIZE = 100;
  let insertedTotal = 0;

  for (let i = 0; i < derivedRows.length; i += BATCH_SIZE) {
    const batch = derivedRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('country_data').insert(batch);

    if (error) {
      console.error(`[ERROR] 배치 삽입 실패 (offset ${i}):`, error.message);
    } else {
      insertedTotal += batch.length;
    }
  }

  console.log(`[DB] 삽입 완료: ${insertedTotal}/${derivedRows.length}행`);
  return insertedTotal;
}

/**
 * 삽입 결과 검증
 */
async function verifyResults(): Promise<number> {
  const { data, error, count } = await supabase
    .from('country_data')
    .select('*', { count: 'exact' })
    .eq('indicator_code', DERIVED_INDICATOR.code);

  if (error) {
    console.error('[ERROR] 검증 조회 실패:', error.message);
    return 0;
  }

  const totalCount = count ?? data?.length ?? 0;
  console.log(`\n[검증] country_data 내 ${DERIVED_INDICATOR.code}: ${totalCount}행`);

  // 국가별 카운트
  if (data) {
    const byCountry = new Map<string, number>();
    for (const row of data as Array<{ country_iso3: string }>) {
      byCountry.set(row.country_iso3, (byCountry.get(row.country_iso3) ?? 0) + 1);
    }
    for (const [iso3, cnt] of byCountry) {
      console.log(`  ${iso3}: ${cnt}행`);
    }
  }

  return totalCount;
}

// ── 메인 실행 ──
async function main() {
  console.log('='.repeat(60));
  console.log('Phase 2: 파생 지표 계산 — 배출 집약도 (Emissions Intensity)');
  console.log(`시각: ${new Date().toISOString()}`);
  console.log(`공식: emissions_intensity = ${GHG_CODE} / ${GDP_CODE}`);
  console.log(`대상: ${PILOT_ISO3.join(', ')}`);
  console.log('='.repeat(60));

  // 1. 파생 지표 등록
  console.log('\n[Step 1] 파생 지표 등록...');
  const registered = await registerDerivedIndicator();
  if (!registered) {
    console.error('[FATAL] 파생 지표 등록 실패. 종료.');
    process.exit(1);
  }

  // 2. GHG 데이터 조회
  console.log(`\n[Step 2] ${GHG_CODE} 데이터 조회...`);
  const ghgData = await fetchIndicatorData(GHG_CODE);
  if (ghgData.length === 0) {
    console.error('[FATAL] GHG 데이터 없음. 종료.');
    process.exit(1);
  }

  // 3. GDP 데이터 조회
  console.log(`\n[Step 3] ${GDP_CODE} 데이터 조회...`);
  const gdpData = await fetchIndicatorData(GDP_CODE);
  if (gdpData.length === 0) {
    console.error('[FATAL] GDP 데이터 없음. 종료.');
    process.exit(1);
  }

  // 4. 비율 계산 및 삽입
  console.log('\n[Step 4] 배출 집약도 계산 및 DB 삽입...');
  const insertedCount = await calculateAndInsert(ghgData, gdpData);

  // 5. 검증
  console.log('\n[Step 5] 결과 검증...');
  const verifiedCount = await verifyResults();

  // 6. 최종 요약
  console.log('\n' + '='.repeat(60));
  console.log('파생 지표 계산 완료');
  console.log(`  지표: ${DERIVED_INDICATOR.code}`);
  console.log(`  단위: ${DERIVED_INDICATOR.unit}`);
  console.log(`  삽입 행 수: ${insertedCount}`);
  console.log(`  검증 행 수: ${verifiedCount}`);
  console.log(`  신뢰도: ${insertedCount > 100 ? 'HIGH' : insertedCount > 50 ? 'MEDIUM' : 'LOW'} (GHG + GDP 2개 소스 교차)`);
  console.log(`  완료 시각: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
