/**
 * scripts/etl-expand-countries.ts
 * 20개국 확장 ETL: 14개 신규 국가의 기후 데이터를 country_data 테이블에 적재
 * 실행: npx tsx --env-file=.env.local scripts/etl-expand-countries.ts
 *
 * 데이터 소스:
 *   World Bank API → EN.GHG.CO2.PC.CE.AR5, NY.GDP.PCAP.CD, EN.ATM.PM25.MC.M3,
 *                     AG.LND.FRST.ZS, EG.USE.PCAP.KG.OE
 *   OWID Energy CSV → EMBER.RENEWABLE.PCT, EMBER.FOSSIL.PCT, EMBER.CARBON.INTENSITY
 *   ND-GAIN CSV     → NDGAIN.VULNERABILITY, NDGAIN.READINESS (로컬 /tmp/ndgain/ 필요)
 *   Derived         → DERIVED.CO2_PER_GDP, DERIVED.DECOUPLING (계산)
 */

import { createClient } from '@supabase/supabase-js';

// ── 환경변수 검증 ──────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 누락');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── 신규 14개국 정의 ──────────────────────────────────
const NEW_COUNTRIES = [
  { iso3: 'CHN', iso2: 'CN', name: 'China' },
  { iso3: 'IND', iso2: 'IN', name: 'India' },
  { iso3: 'JPN', iso2: 'JP', name: 'Japan' },
  { iso3: 'GBR', iso2: 'GB', name: 'United Kingdom' },
  { iso3: 'FRA', iso2: 'FR', name: 'France' },
  { iso3: 'CAN', iso2: 'CA', name: 'Canada' },
  { iso3: 'AUS', iso2: 'AU', name: 'Australia' },
  { iso3: 'IDN', iso2: 'ID', name: 'Indonesia' },
  { iso3: 'SAU', iso2: 'SA', name: 'Saudi Arabia' },
  { iso3: 'ZAF', iso2: 'ZA', name: 'South Africa' },
  { iso3: 'MEX', iso2: 'MX', name: 'Mexico' },
  { iso3: 'RUS', iso2: 'RU', name: 'Russia' },
  { iso3: 'TUR', iso2: 'TR', name: 'Turkey' },
  { iso3: 'EGY', iso2: 'EG', name: 'Egypt' },
] as const;

const ISO3_SET = new Set(NEW_COUNTRIES.map(c => c.iso3));
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── 타입 정의 ─────────────────────────────────────────
interface Row {
  country_iso3: string;
  indicator_code: string;
  year: number;
  value: number;
  source: string;
}

interface DataPoint {
  iso3: string;
  year: number;
  value: number;
}

// ── CSV 파서 ──────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

// ── 1. World Bank WDI API ─────────────────────────────

const WB_INDICATORS = [
  { code: 'EN.GHG.CO2.PC.CE.AR5', source: 'World Bank WDI' },
  { code: 'NY.GDP.PCAP.CD',        source: 'World Bank WDI' },
  { code: 'EN.ATM.PM25.MC.M3',     source: 'World Bank WDI' },
  { code: 'AG.LND.FRST.ZS',        source: 'World Bank WDI' },
  { code: 'EG.USE.PCAP.KG.OE',     source: 'World Bank WDI' },
];

async function fetchWorldBank(indicatorCode: string): Promise<DataPoint[]> {
  // World Bank accepts semicolon-separated ISO2 codes, max ~50
  const iso2Str = NEW_COUNTRIES.map(c => c.iso2).join(';');
  const url = `https://api.worldbank.org/v2/country/${iso2Str}/indicator/${indicatorCode}?format=json&date=2000:2023&per_page=1000`;

  console.log(`  [WB] ${indicatorCode}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WB API ${res.status}`);

  const json = await res.json() as [unknown, Array<{ countryiso3code: string; date: string; value: number | null }>];
  if (!Array.isArray(json) || !json[1]) return [];

  const results: DataPoint[] = [];
  for (const dp of json[1]) {
    const year = parseInt(dp.date, 10);
    const iso3 = dp.countryiso3code;
    if (!ISO3_SET.has(iso3 as typeof NEW_COUNTRIES[number]['iso3'])) continue;
    if (isNaN(year) || year < 2000 || year > 2023) continue;
    if (dp.value == null) continue;
    results.push({ iso3, year, value: dp.value });
  }
  return results;
}

// ── 2. OWID Energy CSV → EMBER indicators ─────────────

const OWID_ENERGY_URL = 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv';

async function fetchOWIDEnergy(): Promise<Map<string, DataPoint[]>> {
  console.log('  [OWID] Fetching energy CSV...');
  const res = await fetch(OWID_ENERGY_URL);
  if (!res.ok) throw new Error(`OWID energy CSV ${res.status}`);
  const text = await res.text();
  const lines = text.split('\n');

  const header = parseCSVLine(lines[0]);
  const isoIdx  = header.indexOf('iso_code');
  const yearIdx = header.indexOf('year');
  const renIdx  = header.indexOf('renewables_share_elec');
  const fosIdx  = header.indexOf('fossil_share_elec');
  const ciIdx   = header.indexOf('carbon_intensity_elec');

  const results: Map<string, DataPoint[]> = new Map([
    ['EMBER.RENEWABLE.PCT', []],
    ['EMBER.FOSSIL.PCT', []],
    ['EMBER.CARBON.INTENSITY', []],
  ]);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = parseCSVLine(line);
    const iso3 = parts[isoIdx]?.trim();
    if (!ISO3_SET.has(iso3 as typeof NEW_COUNTRIES[number]['iso3'])) continue;
    const year = parseInt(parts[yearIdx]?.trim(), 10);
    if (isNaN(year) || year < 2000 || year > 2023) continue;

    const addPoint = (key: string, idx: number) => {
      if (idx === -1) return;
      const raw = parts[idx]?.trim();
      if (!raw || raw === '') return;
      const v = parseFloat(raw);
      if (isNaN(v)) return;
      results.get(key)!.push({ iso3, year, value: v });
    };

    addPoint('EMBER.RENEWABLE.PCT', renIdx);
    addPoint('EMBER.FOSSIL.PCT', fosIdx);
    addPoint('EMBER.CARBON.INTENSITY', ciIdx);
  }

  for (const [key, arr] of results) {
    console.log(`  [OWID] ${key}: ${arr.length} data points`);
  }
  return results;
}

// ── 3. ND-GAIN local CSV ──────────────────────────────

async function readNDGain(): Promise<Map<string, DataPoint[]>> {
  const { existsSync, readFileSync } = await import('fs');

  const results: Map<string, DataPoint[]> = new Map([
    ['NDGAIN.VULNERABILITY', []],
    ['NDGAIN.READINESS', []],
  ]);

  const FILES: { path: string; indicator: string }[] = [
    { path: '/tmp/ndgain/vulnerability.csv', indicator: 'NDGAIN.VULNERABILITY' },
    { path: '/tmp/ndgain/readiness.csv',     indicator: 'NDGAIN.READINESS' },
  ];

  for (const { path, indicator } of FILES) {
    if (!existsSync(path)) {
      console.log(`  [NDGAIN] ${path} 없음 — 건너뜀`);
      continue;
    }
    const text = readFileSync(path, 'utf-8');
    const lines = text.split('\n');
    // CSV format: ISO3,Name,2000,2001,...,2022
    const header = parseCSVLine(lines[0]);
    const yearCols: { year: number; idx: number }[] = [];
    for (let i = 2; i < header.length; i++) {
      const yr = parseInt(header[i].trim(), 10);
      if (!isNaN(yr) && yr >= 2000 && yr <= 2023) {
        yearCols.push({ year: yr, idx: i });
      }
    }

    for (let r = 1; r < lines.length; r++) {
      const line = lines[r].trim();
      if (!line) continue;
      const parts = parseCSVLine(line);
      const iso3 = parts[0]?.trim();
      if (!ISO3_SET.has(iso3 as typeof NEW_COUNTRIES[number]['iso3'])) continue;
      for (const { year, idx } of yearCols) {
        const raw = parts[idx]?.trim();
        if (!raw || raw === '') continue;
        const v = parseFloat(raw);
        if (isNaN(v)) continue;
        results.get(indicator)!.push({ iso3, year, value: v });
      }
    }
    console.log(`  [NDGAIN] ${indicator}: ${results.get(indicator)!.length} data points`);
  }

  return results;
}

// ── 4. Derived indicators ─────────────────────────────

function calcDerived(
  co2Map: Map<string, Map<number, number>>,
  gdpMap: Map<string, Map<number, number>>,
): { co2PerGdp: DataPoint[]; decoupling: DataPoint[] } {
  const co2PerGdp: DataPoint[] = [];
  const decoupling: DataPoint[] = [];

  for (const iso3 of ISO3_SET) {
    const co2Years = co2Map.get(iso3);
    const gdpYears = gdpMap.get(iso3);
    if (!co2Years || !gdpYears) continue;

    // CO2_PER_GDP: co2 / (gdp / 1000) = t CO2e per 1000 USD
    for (const [year, co2] of co2Years) {
      const gdp = gdpYears.get(year);
      if (gdp == null || gdp === 0) continue;
      co2PerGdp.push({ iso3, year, value: parseFloat((co2 / (gdp / 1000)).toFixed(4)) });
    }

    // DECOUPLING: ratio of GDP growth rate to CO2 growth rate (2010 base)
    // Positive = GDP growing faster than CO2 (good)
    const baseYear = 2010;
    const co2Base = co2Years.get(baseYear);
    const gdpBase = gdpYears.get(baseYear);
    if (co2Base == null || gdpBase == null || co2Base === 0 || gdpBase === 0) continue;

    for (const [year, co2] of co2Years) {
      const gdp = gdpYears.get(year);
      if (gdp == null) continue;
      const co2Change = (co2 - co2Base) / co2Base * 100;
      const gdpChange = (gdp - gdpBase) / gdpBase * 100;
      const val = gdpChange - co2Change; // positive = decoupled
      decoupling.push({ iso3, year, value: parseFloat(val.toFixed(2)) });
    }
  }

  return { co2PerGdp, decoupling };
}

// ── 5. Supabase upsert ────────────────────────────────

async function upsertRows(rows: Row[]): Promise<number> {
  if (rows.length === 0) return 0;
  const BATCH = 500;
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('country_data')
      .upsert(batch, { onConflict: 'country_iso3,indicator_code,year' });
    if (error) {
      console.error(`  [ERROR] upsert batch ${i}-${i + BATCH}:`, error.message);
    } else {
      total += batch.length;
    }
  }
  return total;
}

function toRowMap(points: DataPoint[], indicatorCode: string, source: string): Row[] {
  return points.map(p => ({
    country_iso3: p.iso3,
    indicator_code: indicatorCode,
    year: p.year,
    value: p.value,
    source,
  }));
}

function buildYearMap(points: DataPoint[]): Map<string, Map<number, number>> {
  const m = new Map<string, Map<number, number>>();
  for (const p of points) {
    if (!m.has(p.iso3)) m.set(p.iso3, new Map());
    m.get(p.iso3)!.set(p.year, p.value);
  }
  return m;
}

// ── Main ──────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('VisualClimate — 20개국 확장 ETL');
  console.log(`신규 14개국: ${NEW_COUNTRIES.map(c => c.iso3).join(', ')}`);
  console.log(`시각: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  let grandTotal = 0;

  // ── STEP 1: World Bank ──────────────────────────────
  console.log('\n[STEP 1] World Bank WDI 지표 수집');
  const wbDataMap = new Map<string, DataPoint[]>();

  for (const ind of WB_INDICATORS) {
    try {
      const data = await fetchWorldBank(ind.code);
      wbDataMap.set(ind.code, data);
      console.log(`  ✓ ${ind.code}: ${data.length} points`);
      const rows = toRowMap(data, ind.code, ind.source);
      const n = await upsertRows(rows);
      grandTotal += n;
      console.log(`    → upsert ${n}행`);
      await delay(300);
    } catch (err) {
      console.error(`  ✗ ${ind.code}:`, err instanceof Error ? err.message : err);
    }
  }

  // ── STEP 2: OWID Energy (EMBER) ─────────────────────
  console.log('\n[STEP 2] OWID Energy CSV → EMBER 지표');
  try {
    const emberData = await fetchOWIDEnergy();
    for (const [code, points] of emberData) {
      const rows = toRowMap(points, code, 'OWID/Ember');
      const n = await upsertRows(rows);
      grandTotal += n;
      console.log(`  ✓ ${code}: upsert ${n}행`);
    }
  } catch (err) {
    console.error('  ✗ OWID energy:', err instanceof Error ? err.message : err);
  }

  // ── STEP 3: ND-GAIN (local CSV) ─────────────────────
  console.log('\n[STEP 3] ND-GAIN CSV (로컬 /tmp/ndgain/)');
  try {
    const ndgainData = await readNDGain();
    for (const [code, points] of ndgainData) {
      if (points.length === 0) continue;
      const rows = toRowMap(points, code, 'ND-GAIN');
      const n = await upsertRows(rows);
      grandTotal += n;
      console.log(`  ✓ ${code}: upsert ${n}행`);
    }
  } catch (err) {
    console.error('  ✗ ND-GAIN:', err instanceof Error ? err.message : err);
  }

  // ── STEP 4: Derived indicators ───────────────────────
  console.log('\n[STEP 4] Derived 지표 계산 (CO2_PER_GDP, DECOUPLING)');
  const co2Data = wbDataMap.get('EN.GHG.CO2.PC.CE.AR5') ?? [];
  const gdpData = wbDataMap.get('NY.GDP.PCAP.CD') ?? [];

  if (co2Data.length > 0 && gdpData.length > 0) {
    const co2Map = buildYearMap(co2Data);
    const gdpMap = buildYearMap(gdpData);
    const { co2PerGdp, decoupling } = calcDerived(co2Map, gdpMap);

    const n1 = await upsertRows(toRowMap(co2PerGdp, 'DERIVED.CO2_PER_GDP', 'Derived'));
    const n2 = await upsertRows(toRowMap(decoupling, 'DERIVED.DECOUPLING', 'Derived'));
    grandTotal += n1 + n2;
    console.log(`  ✓ DERIVED.CO2_PER_GDP: upsert ${n1}행`);
    console.log(`  ✓ DERIVED.DECOUPLING: upsert ${n2}행`);
  } else {
    console.log('  ⚠ CO2/GDP 데이터 부족 — derived 건너뜀');
  }

  // ── 검증 ────────────────────────────────────────────
  console.log('\n[검증] country_data 신규 14개국 행 수:');
  const { data: countCheck } = await supabase
    .from('country_data')
    .select('country_iso3, indicator_code')
    .in('country_iso3', NEW_COUNTRIES.map(c => c.iso3));

  const byCountry = new Map<string, number>();
  for (const row of (countCheck ?? [])) {
    const k = row.country_iso3;
    byCountry.set(k, (byCountry.get(k) ?? 0) + 1);
  }

  for (const c of NEW_COUNTRIES) {
    console.log(`  ${c.iso3} (${c.name}): ${byCountry.get(c.iso3) ?? 0}행`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`총 upsert 행 수: ${grandTotal}`);
  console.log(`완료: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
