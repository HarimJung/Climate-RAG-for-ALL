/**
 * scripts/analysis-report-card.ts
 * Computes Climate Report Card scores for all countries with sufficient data.
 *
 * 5 Domains:
 *   Emissions     (30%) — EN.GHG.CO2.PC.CE.AR5 (50%), DERIVED.CO2_PER_GDP (30%), DERIVED.DECOUPLING (20%)
 *   Energy        (25%) — EMBER.RENEWABLE.PCT (60%), EMBER.CARBON.INTENSITY (40%)
 *   Economy       (15%) — NY.GDP.PCAP.CD (50%), DERIVED.CO2_PER_GDP (50%)
 *   Responsibility(15%) — OWID.SHARE_GLOBAL_CUMULATIVE_CO2 (100%)
 *   Resilience    (15%) — NDGAIN.READINESS (60%), NDGAIN.VULNERABILITY (40%)
 *
 * Normalization: min-max → 0-100 per indicator across all countries.
 *   "inverse" indicators are flipped: score = 100 - normalized
 *
 * Grades: A+(90-100) A(80-89) B+(70-79) B(60-69) C+(50-59) C(40-49) D(25-39) F(0-24)
 * REPORT.GRADE stored as: A+=7, A=6, B+=5, B=4, C+=3, C=2, D=1, F=0
 *
 * Upserts: REPORT.EMISSIONS_SCORE, REPORT.ENERGY_SCORE, REPORT.ECONOMY_SCORE,
 *          REPORT.RESPONSIBILITY_SCORE, REPORT.RESILIENCE_SCORE, REPORT.TOTAL_SCORE, REPORT.GRADE
 *
 * Run: npx tsx --env-file=.env.local scripts/analysis-report-card.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Domain configuration ─────────────────────────────────────────────────────

interface IndicatorCfg {
  code: string;
  direction: 'forward' | 'inverse'; // forward = higher is better
  weight: number;                   // relative weight within domain (must sum to 1)
}

interface DomainCfg {
  key: string;
  scoreCode: string;
  weight: number; // domain weight in total score
  indicators: IndicatorCfg[];
}

const DOMAINS: DomainCfg[] = [
  {
    key: 'EMISSIONS',
    scoreCode: 'REPORT.EMISSIONS_SCORE',
    weight: 0.30,
    indicators: [
      { code: 'EN.GHG.CO2.PC.CE.AR5',  direction: 'inverse',  weight: 0.50 },
      { code: 'DERIVED.CO2_PER_GDP',    direction: 'inverse',  weight: 0.30 },
      { code: 'DERIVED.DECOUPLING',     direction: 'forward',  weight: 0.20 },
    ],
  },
  {
    key: 'ENERGY',
    scoreCode: 'REPORT.ENERGY_SCORE',
    weight: 0.25,
    indicators: [
      { code: 'EMBER.RENEWABLE.PCT',      direction: 'forward',  weight: 0.60 },
      { code: 'EMBER.CARBON.INTENSITY',   direction: 'inverse',  weight: 0.40 },
    ],
  },
  {
    key: 'ECONOMY',
    scoreCode: 'REPORT.ECONOMY_SCORE',
    weight: 0.15,
    indicators: [
      { code: 'NY.GDP.PCAP.CD',         direction: 'forward',  weight: 0.50 },
      { code: 'DERIVED.CO2_PER_GDP',    direction: 'inverse',  weight: 0.50 },
    ],
  },
  {
    key: 'RESPONSIBILITY',
    scoreCode: 'REPORT.RESPONSIBILITY_SCORE',
    weight: 0.15,
    indicators: [
      { code: 'OWID.SHARE_GLOBAL_CUMULATIVE_CO2', direction: 'inverse', weight: 1.00 },
    ],
  },
  {
    key: 'RESILIENCE',
    scoreCode: 'REPORT.RESILIENCE_SCORE',
    weight: 0.15,
    indicators: [
      { code: 'NDGAIN.READINESS',     direction: 'forward',  weight: 0.60 },
      { code: 'NDGAIN.VULNERABILITY', direction: 'inverse',  weight: 0.40 },
    ],
  },
];

const GRADE_MAP: { min: number; grade: string; numeric: number }[] = [
  { min: 90, grade: 'A+', numeric: 7 },
  { min: 80, grade: 'A',  numeric: 6 },
  { min: 70, grade: 'B+', numeric: 5 },
  { min: 60, grade: 'B',  numeric: 4 },
  { min: 50, grade: 'C+', numeric: 3 },
  { min: 40, grade: 'C',  numeric: 2 },
  { min: 25, grade: 'D',  numeric: 1 },
  { min:  0, grade: 'F',  numeric: 0 },
];

function toGrade(score: number): { grade: string; numeric: number } {
  for (const g of GRADE_MAP) {
    if (score >= g.min) return { grade: g.grade, numeric: g.numeric };
  }
  return { grade: 'F', numeric: 0 };
}

// ── Fetch all indicator data with pagination ──────────────────────────────────

interface DataRow { country_iso3: string; indicator_code: string; year: number; value: number }

async function fetchAll(codes: string[]): Promise<DataRow[]> {
  const all: DataRow[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from('country_data')
      .select('country_iso3, indicator_code, year, value')
      .in('indicator_code', codes)
      .not('value', 'is', null)
      .order('year', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error('Query error:', error.message); process.exit(1); }
    if (!page || page.length === 0) break;
    all.push(...(page as DataRow[]));
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const SCORE_YEAR = 2024;
  const allCodes = [...new Set(DOMAINS.flatMap(d => d.indicators.map(i => i.code)))];

  console.log('Fetching indicator data…');
  const rows = await fetchAll(allCodes);
  console.log(`Loaded ${rows.length} rows for ${allCodes.length} indicator codes`);

  // Latest value per country per indicator (rows are ordered desc year, so first wins)
  const latest: Record<string, Record<string, number>> = {}; // iso3 → code → value
  for (const row of rows) {
    if (!latest[row.country_iso3]) latest[row.country_iso3] = {};
    if (!(row.indicator_code in latest[row.country_iso3])) {
      latest[row.country_iso3][row.indicator_code] = row.value;
    }
  }

  const countries = Object.keys(latest);
  console.log(`Countries with at least one indicator: ${countries.length}`);

  // Per-indicator arrays for min-max normalization
  const indicatorEntries: Record<string, { iso3: string; value: number }[]> = {};
  for (const iso3 of countries) {
    for (const code of allCodes) {
      const val = latest[iso3][code];
      if (val === undefined || val === null) continue;
      if (!indicatorEntries[code]) indicatorEntries[code] = [];
      indicatorEntries[code].push({ iso3, value: val });
    }
  }

  // Min-max normalize each indicator → 0-100
  const normalized: Record<string, Record<string, number>> = {}; // iso3 → code → 0-100
  for (const [code, entries] of Object.entries(indicatorEntries)) {
    const vals = entries.map(e => e.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min;
    for (const { iso3, value } of entries) {
      if (!normalized[iso3]) normalized[iso3] = {};
      normalized[iso3][code] = range === 0 ? 50 : ((value - min) / range) * 100;
    }
  }

  // Compute domain scores and total
  interface CountryScore {
    emissions:      number | null;
    energy:         number | null;
    economy:        number | null;
    responsibility: number | null;
    resilience:     number | null;
    total:          number;
    grade:          string;
    gradeNumeric:   number;
  }

  const scores: Record<string, CountryScore> = {};
  let skipped = 0;

  for (const iso3 of countries) {
    const norm = normalized[iso3] ?? {};
    const domainResults: Record<string, number | null> = {};

    for (const domain of DOMAINS) {
      let weightedSum = 0;
      let totalWeight = 0;
      for (const ind of domain.indicators) {
        if (!(ind.code in norm)) continue;
        let s = norm[ind.code];
        if (ind.direction === 'inverse') s = 100 - s;
        weightedSum += s * ind.weight;
        totalWeight += ind.weight;
      }
      domainResults[domain.key] = totalWeight >= 0.5 ? weightedSum / totalWeight : null;
    }

    // Require at least 3 of 5 domains to compute total
    const validDomains = DOMAINS.filter(d => domainResults[d.key] !== null);
    if (validDomains.length < 3) { skipped++; continue; }

    let totalW = 0;
    let totalDW = 0;
    for (const domain of validDomains) {
      const ds = domainResults[domain.key]!;
      totalW += ds * domain.weight;
      totalDW += domain.weight;
    }
    const total = totalDW > 0 ? Math.round((totalW / totalDW) * 10) / 10 : 0;
    const { grade, numeric: gradeNumeric } = toGrade(total);

    scores[iso3] = {
      emissions:      domainResults['EMISSIONS']      !== null ? Math.round(domainResults['EMISSIONS']!      * 10) / 10 : null,
      energy:         domainResults['ENERGY']         !== null ? Math.round(domainResults['ENERGY']!         * 10) / 10 : null,
      economy:        domainResults['ECONOMY']        !== null ? Math.round(domainResults['ECONOMY']!        * 10) / 10 : null,
      responsibility: domainResults['RESPONSIBILITY'] !== null ? Math.round(domainResults['RESPONSIBILITY']! * 10) / 10 : null,
      resilience:     domainResults['RESILIENCE']     !== null ? Math.round(domainResults['RESILIENCE']!     * 10) / 10 : null,
      total,
      grade,
      gradeNumeric,
    };
  }

  const scored = Object.keys(scores).length;
  console.log(`Scored: ${scored} countries  |  Skipped (insufficient data): ${skipped}`);

  // Build upsert rows
  const upsertRows: { country_iso3: string; indicator_code: string; year: number; value: number }[] = [];
  for (const [iso3, s] of Object.entries(scores)) {
    const push = (code: string, val: number | null) => {
      if (val === null) return;
      upsertRows.push({ country_iso3: iso3, indicator_code: code, year: SCORE_YEAR, value: val });
    };
    push('REPORT.EMISSIONS_SCORE',      s.emissions);
    push('REPORT.ENERGY_SCORE',         s.energy);
    push('REPORT.ECONOMY_SCORE',        s.economy);
    push('REPORT.RESPONSIBILITY_SCORE', s.responsibility);
    push('REPORT.RESILIENCE_SCORE',     s.resilience);
    push('REPORT.TOTAL_SCORE',          s.total);
    push('REPORT.GRADE',                s.gradeNumeric);
  }

  console.log(`Upserting ${upsertRows.length} score rows to Supabase…`);
  const CHUNK = 500;
  for (let i = 0; i < upsertRows.length; i += CHUNK) {
    const chunk = upsertRows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('country_data')
      .upsert(chunk, { onConflict: 'country_iso3,indicator_code,year' });
    if (error) { console.error('Upsert error:', error.message); process.exit(1); }
    process.stdout.write(`  ${Math.min(i + CHUNK, upsertRows.length)}/${upsertRows.length}\r`);
  }

  // Summary report
  const gradeDist: Record<string, number> = {};
  for (const s of Object.values(scores)) {
    gradeDist[s.grade] = (gradeDist[s.grade] ?? 0) + 1;
  }

  const sortedByTotal = Object.entries(scores).sort((a, b) => b[1].total - a[1].total);

  console.log('\n\n═══════════════════════════════════════');
  console.log('  Climate Report Card — Score Summary');
  console.log('═══════════════════════════════════════');
  console.log(`  Countries scored : ${scored}`);
  console.log(`  Skipped (no data): ${skipped}`);
  console.log('\n  Grade Distribution:');
  for (const { grade } of GRADE_MAP) {
    const count = gradeDist[grade] ?? 0;
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`    ${grade.padEnd(3)}  ${String(count).padStart(3)}  ${bar}`);
  }
  console.log('\n  Top 10:');
  for (const [iso3, s] of sortedByTotal.slice(0, 10)) {
    console.log(`    ${iso3}  ${String(s.total).padStart(5)}  ${s.grade}`);
  }
  console.log('\n  Bottom 10:');
  for (const [iso3, s] of sortedByTotal.slice(-10).reverse()) {
    console.log(`    ${iso3}  ${String(s.total).padStart(5)}  ${s.grade}`);
  }
  console.log('\n  Done. ✓');
}

main().catch(e => { console.error(e); process.exit(1); });
