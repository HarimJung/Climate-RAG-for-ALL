/**
 * scripts/etl-additional-indicators.ts
 * 추가 WDI 지표 5개를 6개 파일럿 국가에 대해 수집하여 Supabase에 적재
 * 실행: npx tsx --env-file=.env.local scripts/etl-additional-indicators.ts
 *
 * 데이터 수집 전략:
 *   1차: World Bank WDI API (api.worldbank.org)
 *   2차 (WDI API 장애 시): GitHub 오픈 데이터 소스 (datasets org, OWID)
 *
 * 대상 지표:
 *   SP.POP.TOTL       — 총 인구 (people)                     | 폴백: datasets/population
 *   SP.URB.TOTL.IN.ZS — 도시 인구 비율 (%)                   | 폴백: OWID API (indicator 1145573)
 *   EG.FEC.RNEW.ZS    — 재생에너지 소비 비율 (%)             | 폴백: OWID Energy (renewables_share_energy)
 *   EN.ATM.GHGT.KT.CE — 총 온실가스 배출량 (kt CO2e)         | 폴백: OWID CO2 (total_ghg * 1000)
 *   NY.GDP.MKTP.CD    — GDP (current US$)                     | 폴백: datasets/gdp
 *
 * 파일럿 국가: KOR, USA, DEU, BRA, NGA, BGD
 * 연도 범위: 2000-2023
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

// ── 파일럿 국가 정의 ──
const PILOT_COUNTRIES = [
  { iso3: 'KOR', iso2: 'KR', name: 'South Korea' },
  { iso3: 'USA', iso2: 'US', name: 'United States' },
  { iso3: 'DEU', iso2: 'DE', name: 'Germany' },
  { iso3: 'BRA', iso2: 'BR', name: 'Brazil' },
  { iso3: 'NGA', iso2: 'NG', name: 'Nigeria' },
  { iso3: 'BGD', iso2: 'BD', name: 'Bangladesh' },
] as const;

const ISO3_SET = new Set<string>(PILOT_COUNTRIES.map(c => c.iso3));

// ── 수집 대상 지표 정의 ──
const INDICATORS = [
  { code: 'SP.POP.TOTL', name: 'Total population', unit: 'people', category: 'socioeconomic' },
  { code: 'SP.URB.TOTL.IN.ZS', name: 'Urban population (% of total population)', unit: '%', category: 'socioeconomic' },
  { code: 'EG.FEC.RNEW.ZS', name: 'Renewable energy consumption (% of total final energy consumption)', unit: '%', category: 'energy' },
  { code: 'EN.ATM.GHGT.KT.CE', name: 'Total greenhouse gas emissions (kt of CO2 equivalent)', unit: 'kt CO2e', category: 'emissions' },
  { code: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)', unit: 'current US$', category: 'economy' },
] as const;

// ── 폴백 데이터 소스 URL ──
const FALLBACK_URLS: Record<string, string | null> = {
  // datasets org: CSV (Country Name, Country Code, Year, Value)
  'SP.POP.TOTL': 'https://raw.githubusercontent.com/datasets/population/main/data/population.csv',
  'NY.GDP.MKTP.CD': 'https://raw.githubusercontent.com/datasets/gdp/main/data/gdp.csv',
  // OWID: CSV (country,year,iso_code,...columns...)
  'EN.ATM.GHGT.KT.CE': 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv',
  'EG.FEC.RNEW.ZS': 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv',
  // OWID API: 도시 인구 비율 (UN World Urbanization Prospects via OWID)
  'SP.URB.TOTL.IN.ZS': 'OWID_API_URBAN',
};

// OWID 컬럼 매핑 (indicator code -> {source, column, multiplier})
const OWID_COLUMN_MAP: Record<string, { column: string; multiplier: number }> = {
  'EN.ATM.GHGT.KT.CE': { column: 'total_ghg', multiplier: 1000 }, // OWID: MtCO2e -> WDI: kt CO2e
  'EG.FEC.RNEW.ZS': { column: 'renewables_share_energy', multiplier: 1 }, // 이미 % 단위
};

// ── 데이터 포인트 타입 ──
interface DataPoint {
  iso3: string;
  year: number;
  value: number;
}

// ── 요약 통계 ──
interface Summary {
  indicator: string;
  country: string;
  inserted: number;
  nullYears: number;
  source: string;
}

const allSummaries: Summary[] = [];
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ────────────────────────────────────────────────────
// WDI API 호출 (1차 시도)
// ────────────────────────────────────────────────────

interface WBDataPoint {
  countryiso3code: string;
  date: string;
  value: number | null;
}

/**
 * WDI API 전체 상태 확인 (한 번만 호출)
 * 502라면 모든 지표에 대해 폴백 사용
 */
async function checkWDIAvailability(): Promise<boolean> {
  const testUrl = 'https://api.worldbank.org/v2/country/US/indicator/SP.POP.TOTL?format=json&date=2023:2023&per_page=1';
  try {
    const response = await fetch(testUrl);
    console.log(`[WDI 상태 확인] HTTP ${response.status}`);
    if (response.ok) return true;
    // 재시도 1회
    console.log('[WDI] 3초 대기 후 재시도...');
    await delay(3000);
    const retry = await fetch(testUrl);
    console.log(`[WDI 재시도] HTTP ${retry.status}`);
    return retry.ok;
  } catch (e) {
    console.log(`[WDI 상태 확인] 네트워크 오류: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

/**
 * WDI API에서 특정 지표의 6개국 데이터 가져오기
 */
async function fetchFromWDI(indicatorCode: string): Promise<DataPoint[]> {
  const iso2Str = PILOT_COUNTRIES.map(c => c.iso2).join(';');
  const url = `https://api.worldbank.org/v2/country/${iso2Str}/indicator/${indicatorCode}?format=json&date=2000:2023&per_page=500`;

  const response = await fetch(url);
  console.log(`  [WDI HTTP ${response.status}] ${indicatorCode}`);

  if (!response.ok) throw new Error(`WDI HTTP ${response.status}`);

  const json = await response.json();
  if (!json || !Array.isArray(json) || json.length < 2 || !json[1]) {
    return [];
  }

  const rawData: WBDataPoint[] = json[1];
  console.log(`  [WDI] 반환된 행 수: ${rawData.length}`);

  const results: DataPoint[] = [];
  for (const dp of rawData) {
    const year = parseInt(dp.date, 10);
    if (isNaN(year) || year < 2000 || year > 2023) continue;
    if (!dp.countryiso3code || !ISO3_SET.has(dp.countryiso3code)) continue;
    if (dp.value !== null && dp.value !== undefined) {
      results.push({ iso3: dp.countryiso3code, year, value: dp.value });
    }
  }

  return results;
}

// ────────────────────────────────────────────────────
// 폴백: GitHub CSV 소스 (datasets org)
// ────────────────────────────────────────────────────

/**
 * GitHub datasets org CSV 파싱 (Country Name, Country Code, Year, Value)
 * Population, GDP 등에 사용
 */
async function fetchFromDatasetsCSV(url: string): Promise<DataPoint[]> {
  console.log(`  [FALLBACK] GitHub CSV: ${url.split('/').slice(-3).join('/')}`);

  const response = await fetch(url);
  console.log(`  [HTTP ${response.status}]`);

  if (!response.ok) throw new Error(`Fallback HTTP ${response.status}`);

  const text = await response.text();
  const lines = text.split('\n');
  const results: DataPoint[] = [];

  // 첫 행은 헤더: Country Name, Country Code, Year, Value
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV 파싱 (쉼표가 이름에 포함될 수 있음)
    const parts = parseCSVLine(line);
    if (parts.length < 4) continue;

    const countryCode = parts[1].trim();
    const year = parseInt(parts[2].trim(), 10);
    const value = parseFloat(parts[3].trim());

    if (!ISO3_SET.has(countryCode)) continue;
    if (isNaN(year) || year < 2000 || year > 2023) continue;
    if (isNaN(value)) continue;

    results.push({ iso3: countryCode, year, value });
  }

  console.log(`  [FALLBACK] ${results.length}행 파싱 완료`);
  return results;
}

/**
 * OWID CSV에서 특정 컬럼 추출 (co2-data, energy-data)
 * 컬럼: country, year, iso_code, ...
 */
async function fetchFromOWIDCSV(url: string, columnName: string, multiplier: number): Promise<DataPoint[]> {
  console.log(`  [FALLBACK] OWID CSV: ${url.split('/').slice(-2).join('/')} (컬럼: ${columnName})`);

  const response = await fetch(url);
  console.log(`  [HTTP ${response.status}]`);

  if (!response.ok) throw new Error(`OWID Fallback HTTP ${response.status}`);

  const text = await response.text();
  const lines = text.split('\n');

  // 헤더에서 컬럼 인덱스 찾기
  const headerParts = parseCSVLine(lines[0]);
  const isoIdx = headerParts.indexOf('iso_code');
  const yearIdx = headerParts.indexOf('year');
  const colIdx = headerParts.indexOf(columnName);

  if (isoIdx === -1 || yearIdx === -1 || colIdx === -1) {
    throw new Error(`OWID CSV에서 필요한 컬럼을 찾을 수 없음: iso_code(${isoIdx}), year(${yearIdx}), ${columnName}(${colIdx})`);
  }

  const results: DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCSVLine(line);
    if (parts.length <= Math.max(isoIdx, yearIdx, colIdx)) continue;

    const iso3 = parts[isoIdx].trim();
    const year = parseInt(parts[yearIdx].trim(), 10);
    const rawValue = parts[colIdx].trim();

    if (!ISO3_SET.has(iso3)) continue;
    if (isNaN(year) || year < 2000 || year > 2023) continue;
    if (!rawValue || rawValue === '') continue;

    const value = parseFloat(rawValue);
    if (isNaN(value)) continue;

    results.push({ iso3, year, value: value * multiplier });
  }

  console.log(`  [FALLBACK] ${results.length}행 파싱 완료`);
  return results;
}

// ────────────────────────────────────────────────────
// 폴백: OWID JSON API (도시 인구 비율)
// ────────────────────────────────────────────────────

// OWID entity ID -> ISO3 매핑 (도시 인구 비율 indicator 1145573)
const OWID_ENTITY_MAP: Record<number, string> = {
  28: 'BGD',
  37: 'BRA',
  6: 'DEU',
  103: 'NGA',
  127: 'KOR',
  13: 'USA',
};

/**
 * OWID JSON API에서 도시 인구 비율 데이터 가져오기
 * indicator ID 1145573 = "Share of population living in urban areas"
 */
async function fetchFromOWIDAPI(): Promise<DataPoint[]> {
  const dataUrl = 'https://api.ourworldindata.org/v1/indicators/1145573.data.json';
  console.log(`  [FALLBACK] OWID API: indicator 1145573 (urban pop %)`);

  const response = await fetch(dataUrl);
  console.log(`  [HTTP ${response.status}]`);

  if (!response.ok) throw new Error(`OWID API HTTP ${response.status}`);

  const data = await response.json() as {
    values: number[];
    years: number[];
    entities: number[];
  };

  const results: DataPoint[] = [];

  for (let i = 0; i < data.values.length; i++) {
    const entityId = data.entities[i];
    const year = data.years[i];
    const value = data.values[i];

    const iso3 = OWID_ENTITY_MAP[entityId];
    if (!iso3) continue;
    if (year < 2000 || year > 2023) continue;
    if (value === null || value === undefined) continue;

    results.push({ iso3, year, value });
  }

  console.log(`  [FALLBACK] ${results.length}행 파싱 완료`);
  return results;
}

/**
 * 간단한 CSV 라인 파서 (따옴표 처리 포함)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ────────────────────────────────────────────────────
// Supabase 헬퍼
// ────────────────────────────────────────────────────

/**
 * indicators 테이블에서 지표 ID 조회 또는 신규 삽입
 * 기존 지표의 경우 category가 null이면 업데이트
 */
async function ensureIndicator(ind: typeof INDICATORS[number]): Promise<number | null> {
  // 기존 지표 조회
  const { data: existing } = await supabase
    .from('indicators')
    .select('id, category')
    .eq('source', 'worldbank')
    .eq('code', ind.code)
    .single();

  if (existing) {
    // category가 null이면 업데이트
    if (!existing.category && ind.category) {
      const { error: updateErr } = await supabase
        .from('indicators')
        .update({ category: ind.category, name: ind.name, unit: ind.unit })
        .eq('id', existing.id);
      if (updateErr) {
        console.error(`  [WARN] category 업데이트 실패 (${ind.code}):`, updateErr.message);
      } else {
        console.log(`  [UPDATE] ${ind.code} category -> '${ind.category}'`);
      }
    }
    console.log(`  [기존] 지표 ${ind.code} -> ID ${existing.id}`);
    return existing.id;
  }

  // 신규 삽입
  const { data: inserted, error } = await supabase
    .from('indicators')
    .insert({
      source: 'worldbank',
      code: ind.code,
      name: ind.name,
      unit: ind.unit,
      category: ind.category,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`  [ERROR] 지표 삽입 실패 (${ind.code}):`, error.message);
    return null;
  }

  console.log(`  [신규] 지표 ${ind.code} -> ID ${inserted.id}`);
  return inserted.id;
}

/**
 * countries 테이블에서 iso3 -> id 매핑 구축
 */
async function getCountryMap(): Promise<Map<string, number>> {
  const iso3List = PILOT_COUNTRIES.map(c => c.iso3);
  const { data, error } = await supabase
    .from('countries')
    .select('id, iso3')
    .in('iso3', iso3List);

  if (error || !data) {
    console.error('[ERROR] 국가 목록 조회 실패:', error?.message);
    return new Map();
  }

  return new Map(data.map((c: { id: number; iso3: string }) => [c.iso3.trim(), c.id]));
}

/**
 * 데이터 포인트를 indicator_values 테이블에 upsert
 */
async function upsertData(
  indicatorId: number,
  countryMap: Map<string, number>,
  dataPoints: DataPoint[],
): Promise<Map<string, number>> {
  // 국가별로 그룹화
  const byCountry = new Map<string, DataPoint[]>();
  for (const dp of dataPoints) {
    const arr = byCountry.get(dp.iso3) || [];
    arr.push(dp);
    byCountry.set(dp.iso3, arr);
  }

  const insertedPerCountry = new Map<string, number>();

  for (const [iso3, points] of byCountry) {
    const countryId = countryMap.get(iso3);
    if (!countryId) continue;

    const rows = points.map(p => ({
      indicator_id: indicatorId,
      country_id: countryId,
      year: p.year,
      value: p.value,
    }));

    const { error } = await supabase
      .from('indicator_values')
      .upsert(rows, { onConflict: 'indicator_id,country_id,year' });

    if (error) {
      console.error(`  [ERROR] upsert 실패 (${iso3}):`, error.message);
      insertedPerCountry.set(iso3, 0);
    } else {
      insertedPerCountry.set(iso3, rows.length);
    }
  }

  return insertedPerCountry;
}

// ────────────────────────────────────────────────────
// 메인 ETL 로직
// ────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('추가 WDI 지표 ETL 파이프라인 시작');
  console.log(`시각: ${new Date().toISOString()}`);
  console.log(`지표: ${INDICATORS.length}개 | 국가: ${PILOT_COUNTRIES.length}개`);
  console.log('='.repeat(60));

  // 국가 매핑 조회
  const countryMap = await getCountryMap();
  console.log(`[INFO] 파일럿 국가 ${countryMap.size}개 로드됨`);
  if (countryMap.size === 0) {
    console.error('[FATAL] 파일럿 국가가 DB에 없음. seed-countries 먼저 실행 필요.');
    process.exit(1);
  }

  // WDI API 상태 확인
  const wdiAvailable = await checkWDIAvailability();
  if (!wdiAvailable) {
    console.log('[WARN] WDI API 접속 불가 (502). 대체 데이터 소스(GitHub/OWID)를 사용합니다.\n');
  }

  let grandTotalInserted = 0;

  for (let i = 0; i < INDICATORS.length; i++) {
    const ind = INDICATORS[i];
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`[${i + 1}/${INDICATORS.length}] ${ind.code} (${ind.name})`);
    console.log(`${'─'.repeat(55)}`);

    // 지표 등록/조회
    const indicatorId = await ensureIndicator(ind);
    if (!indicatorId) {
      console.error(`  [SKIP] 지표 등록 실패: ${ind.code}`);
      continue;
    }

    let dataPoints: DataPoint[] = [];
    let sourceUsed = 'WDI';

    // ── 데이터 수집 ──
    if (wdiAvailable) {
      // 1차: WDI API
      try {
        dataPoints = await fetchFromWDI(ind.code);
        sourceUsed = 'WDI';
      } catch (err) {
        console.log(`  [WDI 실패] ${err instanceof Error ? err.message : err}`);
        dataPoints = [];
      }
    }

    // WDI 실패 시 또는 데이터 없는 경우 폴백 시도
    if (dataPoints.length === 0) {
      const fallbackUrl = FALLBACK_URLS[ind.code];

      if (fallbackUrl === null || fallbackUrl === undefined) {
        // 폴백 소스 없음
        console.log(`  [INFO] 대체 소스 없음 -> DATA_NOT_AVAILABLE_WDI 처리`);
        sourceUsed = 'NONE';
      } else if (fallbackUrl === 'OWID_API_URBAN') {
        // OWID JSON API로 도시 인구 비율 가져오기
        try {
          dataPoints = await fetchFromOWIDAPI();
          sourceUsed = 'OWID_API';
        } catch (err) {
          console.error(`  [FALLBACK 실패] ${err instanceof Error ? err.message : err}`);
          sourceUsed = 'NONE';
        }
      } else {
        try {
          const owidMap = OWID_COLUMN_MAP[ind.code];
          if (owidMap) {
            // OWID CSV 소스
            dataPoints = await fetchFromOWIDCSV(fallbackUrl, owidMap.column, owidMap.multiplier);
            sourceUsed = 'OWID';
          } else {
            // datasets org CSV 소스
            dataPoints = await fetchFromDatasetsCSV(fallbackUrl);
            sourceUsed = 'GitHub/datasets';
          }
        } catch (err) {
          console.error(`  [FALLBACK 실패] ${err instanceof Error ? err.message : err}`);
          sourceUsed = 'NONE';
        }
      }
    }

    console.log(`  [소스] ${sourceUsed} | 데이터 포인트: ${dataPoints.length}`);

    // ── Supabase에 적재 ──
    if (dataPoints.length > 0) {
      const insertedMap = await upsertData(indicatorId, countryMap, dataPoints);

      for (const country of PILOT_COUNTRIES) {
        const inserted = insertedMap.get(country.iso3) || 0;
        const countryPoints = dataPoints.filter(d => d.iso3 === country.iso3);
        const nullYears = 24 - countryPoints.length; // 2000-2023 = 24년

        console.log(`  ${country.iso3}: ${inserted}행 upsert (${nullYears}년 누락)`);

        allSummaries.push({
          indicator: ind.code,
          country: country.iso3,
          inserted,
          nullYears,
          source: sourceUsed,
        });

        grandTotalInserted += inserted;
      }
    } else {
      // 데이터 없는 경우 모든 국가에 대해 기록
      for (const country of PILOT_COUNTRIES) {
        allSummaries.push({
          indicator: ind.code,
          country: country.iso3,
          inserted: 0,
          nullYears: 24,
          source: sourceUsed,
        });
      }
    }

    // ── 지표별 DB 행 수 검증 ──
    const { count } = await supabase
      .from('indicator_values')
      .select('*', { count: 'exact', head: true })
      .eq('indicator_id', indicatorId);

    console.log(`  [검증] DB 전체 행 수: ${count ?? 'N/A'}`);

    // 다음 지표 전 대기
    if (i < INDICATORS.length - 1) await delay(500);
  }

  // ── 최종 요약 출력 ──
  console.log('\n' + '='.repeat(65));
  console.log('ETL 파이프라인 완료 - 최종 요약');
  console.log('='.repeat(65));

  // 국가 x 지표 매트릭스
  const colWidth = 12;
  let header = 'Country '.padEnd(10);
  for (const ind of INDICATORS) {
    const short = ind.code.split('.').pop() || ind.code;
    header += short.padStart(colWidth);
  }
  header += '  Source'.padStart(colWidth);
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const country of PILOT_COUNTRIES) {
    let row = country.iso3.padEnd(10);
    for (const ind of INDICATORS) {
      const entry = allSummaries.find(s => s.indicator === ind.code && s.country === country.iso3);
      row += String(entry?.inserted ?? 0).padStart(colWidth);
    }
    // 소스 (첫 번째 지표 기준)
    const src = allSummaries.find(s => s.country === country.iso3)?.source ?? '?';
    row += src.padStart(colWidth);
    console.log(row);
  }

  console.log('-'.repeat(header.length));

  // 지표별 합계
  let totalsRow = 'TOTAL'.padEnd(10);
  for (const ind of INDICATORS) {
    const total = allSummaries
      .filter(s => s.indicator === ind.code)
      .reduce((sum, s) => sum + s.inserted, 0);
    totalsRow += String(total).padStart(colWidth);
  }
  console.log(totalsRow);

  console.log(`\n총 삽입/갱신 행 수: ${grandTotalInserted}`);
  console.log(`완료 시각: ${new Date().toISOString()}`);

  // ── DB 최종 검증 ──
  console.log('\n[최종 검증] indicator_values 지표별 통계:');
  for (const ind of INDICATORS) {
    const { data: indRow } = await supabase
      .from('indicators')
      .select('id')
      .eq('source', 'worldbank')
      .eq('code', ind.code)
      .single();

    if (indRow) {
      const { count } = await supabase
        .from('indicator_values')
        .select('*', { count: 'exact', head: true })
        .eq('indicator_id', indRow.id);

      const { data: countryRows } = await supabase
        .from('indicator_values')
        .select('country_id')
        .eq('indicator_id', indRow.id);

      const uniqueCountries = new Set(countryRows?.map(c => c.country_id)).size;
      console.log(`  ${ind.code}: ${count ?? 0}행, ${uniqueCountries}개 국가`);
    }
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
