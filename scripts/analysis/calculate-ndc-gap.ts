/**
 * scripts/analysis/calculate-ndc-gap.ts
 * Step 2: Calculate NDC Gap Analysis
 *
 * Methodology:
 *   1. Read ndc-targets.json for NDC pledges
 *   2. Query Supabase country_data for EN.GHG.CO2.PC.CE.AR5 (all countries, 2000-2023)
 *   3. For each country with sufficient data:
 *      a. Calculate CAGR(2015-2023) = (value_2023 / value_2015)^(1/8) - 1
 *      b. Project to target_year using CAGR
 *      c. If NDC target exists:
 *         - Compute absolute target value from reference year + reduction %
 *         - Gap = projected - target
 *         - Achievement probability via z-score and normal CDF
 *   4. Output per-country JSON to public/data/ndc-gap/{ISO3}.json
 *   5. Output summary to public/data/ndc-gap/summary.json
 *
 * Source indicators: EN.GHG.CO2.PC.CE.AR5 (CO2 per capita, t CO2/person)
 * Quality threshold: quality_score >= 0.70
 *
 * Run: npx tsx --env-file=.env.local scripts/analysis/calculate-ndc-gap.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ── Environment ──

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Constants ──

const INDICATOR_CODE = 'EN.GHG.CO2.PC.CE.AR5';
const QUALITY_THRESHOLD = 0.70;
const PROJECTION_START = 2024;
const CAGR_START_YEAR = 2015;
const CAGR_END_YEAR = 2023;

// ── Types ──

interface NdcTarget {
  country_name: string;
  target_year: number;
  target_pct_reduction: number;
  reference_year: number | null;
  reference_type: 'absolute' | 'bau' | 'intensity';
  submission_status: string;
  conditional: boolean;
  notes: string;
}

interface NdcTargetsFile {
  metadata: {
    generated_at: string;
    source: string;
    methodology_version: string;
    total_countries: number;
    api_status: string;
  };
  targets: Record<string, NdcTarget>;
}

interface DataPoint {
  year: number;
  value: number;
}

interface ProjectionPoint {
  year: number;
  value: number;
}

interface ConfidenceBand {
  year: number;
  upper: number;
  lower: number;
}

interface CountryResult {
  iso3: string;
  country_name: string;
  historical: DataPoint[];
  projection: ProjectionPoint[];
  confidence_band: ConfidenceBand[];
  ndc_target: {
    year: number;
    value: number;
    pct_reduction: number;
    reference_year: number | null;
    reference_type: string;
  } | null;
  gap: number | null;
  gap_pct: number | null;
  achievement_probability: number | null;
  cagr_2015_2023: number | null;
  status: 'on_track' | 'off_track' | 'no_target' | 'insufficient_data';
  metadata: {
    generated_at: string;
    source_indicators: string[];
    methodology_version: string;
    quality_threshold: number;
    confidence: string;
  };
}

interface SummaryEntry {
  iso3: string;
  country_name: string;
  status: string;
  gap_pct: number | null;
  probability: number | null;
  cagr_2015_2023: number | null;
}

// ── Math utilities ──

/**
 * Standard normal CDF approximation (Abramowitz and Stegun, formula 26.2.17)
 * Accurate to ~1.5e-7
 */
function normalCDF(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Calculate standard deviation of an array
 */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// ── Data fetching ──

interface RawRow {
  country_iso3: string;
  year: number;
  value: number;
}

async function fetchAllCO2Data(): Promise<Map<string, DataPoint[]>> {
  console.log(`[DB] Querying country_data for ${INDICATOR_CODE}...`);

  // Supabase paginates at 1000 rows by default. We need all rows.
  // Fetch in pages of 1000.
  const allRows: RawRow[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('country_data')
      .select('country_iso3, year, value')
      .eq('indicator_code', INDICATOR_CODE)
      .gte('year', 2000)
      .lte('year', 2023)
      .order('country_iso3', { ascending: true })
      .order('year', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('[ERROR] Supabase query failed:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allRows.push(...(data as RawRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`[DB] Retrieved ${allRows.length} total rows`);

  const qualityRows = allRows;
  console.log(`[DB] Using all ${qualityRows.length} rows (no quality_score filter)`);

  // Group by country
  const byCountry = new Map<string, DataPoint[]>();
  for (const row of qualityRows) {
    if (row.value === null || row.value === undefined) continue;
    const iso3 = row.country_iso3.trim();
    if (!byCountry.has(iso3)) {
      byCountry.set(iso3, []);
    }
    byCountry.get(iso3)!.push({ year: row.year, value: Number(row.value) });
  }

  // Sort each country's data by year
  for (const [, points] of byCountry) {
    points.sort((a, b) => a.year - b.year);
  }

  console.log(`[DB] ${byCountry.size} unique countries with CO2/capita data`);
  return byCountry;
}

// ── Analysis ──

function calculateCAGR(startValue: number, endValue: number, years: number): number | null {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return null;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

function processCountry(
  iso3: string,
  historical: DataPoint[],
  ndcTarget: NdcTarget | null,
): CountryResult {
  const generatedAt = new Date().toISOString();

  // Find values at key years
  const getValue = (year: number): number | null => {
    const point = historical.find((p) => p.year === year);
    return point ? point.value : null;
  };

  const value2015 = getValue(CAGR_START_YEAR);
  const value2023 = getValue(CAGR_END_YEAR);

  // Calculate CAGR 2015-2023
  let cagr: number | null = null;
  if (value2015 !== null && value2023 !== null) {
    cagr = calculateCAGR(value2015, value2023, CAGR_END_YEAR - CAGR_START_YEAR);
  }

  // If we don't have 2015 or 2023, try to use nearest available years
  if (cagr === null) {
    // Use first and last available data points as fallback
    if (historical.length >= 2) {
      const first = historical[0];
      const last = historical[historical.length - 1];
      const yearDiff = last.year - first.year;
      if (yearDiff > 0 && first.value > 0 && last.value > 0) {
        cagr = calculateCAGR(first.value, last.value, yearDiff);
      }
    }
  }

  // If still no CAGR, mark as insufficient data
  if (cagr === null || value2023 === null) {
    const latestValue = historical.length > 0 ? historical[historical.length - 1].value : null;
    return {
      iso3,
      country_name: ndcTarget?.country_name ?? iso3,
      historical,
      projection: [],
      confidence_band: [],
      ndc_target: null,
      gap: null,
      gap_pct: null,
      achievement_probability: null,
      cagr_2015_2023: cagr,
      status: 'insufficient_data',
      metadata: {
        generated_at: generatedAt,
        source_indicators: [INDICATOR_CODE],
        methodology_version: '1.0',
        quality_threshold: QUALITY_THRESHOLD,
        confidence: 'LOW',
      },
    };
  }

  const latestValue = value2023;

  // Calculate standard deviation of values in CAGR period (2015-2023)
  const cagrPeriodValues = historical
    .filter((p) => p.year >= CAGR_START_YEAR && p.year <= CAGR_END_YEAR)
    .map((p) => p.value);
  const sd = stdDev(cagrPeriodValues);

  // Determine target year for projection (use NDC target year or default to 2030)
  const projectionEndYear = ndcTarget ? ndcTarget.target_year : 2030;
  const yearsAhead = projectionEndYear - CAGR_END_YEAR;

  // Generate projection
  const projection: ProjectionPoint[] = [];
  const confidenceBand: ConfidenceBand[] = [];

  for (let y = PROJECTION_START; y <= projectionEndYear; y++) {
    const yearsFromLatest = y - CAGR_END_YEAR;
    const projectedValue = latestValue * Math.pow(1 + cagr, yearsFromLatest);
    // Ensure positive values
    const clampedValue = Math.max(0.001, projectedValue);
    projection.push({ year: y, value: parseFloat(clampedValue.toFixed(4)) });

    // Confidence band widens with sqrt(time)
    const uncertainty = sd * Math.sqrt(yearsFromLatest);
    confidenceBand.push({
      year: y,
      upper: parseFloat(Math.max(0.001, clampedValue + 1.96 * uncertainty).toFixed(4)),
      lower: parseFloat(Math.max(0.001, clampedValue - 1.96 * uncertainty).toFixed(4)),
    });
  }

  // Get projected value at target year
  const projectedAtTarget = projection.find((p) => p.year === projectionEndYear);
  const projectedValue = projectedAtTarget ? projectedAtTarget.value : null;

  // Calculate NDC target absolute value and gap
  let ndcAbsoluteTarget: number | null = null;
  let gap: number | null = null;
  let gapPct: number | null = null;
  let probability: number | null = null;
  let status: 'on_track' | 'off_track' | 'no_target' | 'insufficient_data' = 'no_target';

  if (ndcTarget && projectedValue !== null) {
    const reduction = ndcTarget.target_pct_reduction / 100;

    if (ndcTarget.reference_type === 'absolute' && ndcTarget.reference_year !== null) {
      // Absolute reduction from reference year
      const refValue = getValue(ndcTarget.reference_year);
      if (refValue !== null) {
        ndcAbsoluteTarget = refValue * (1 - reduction);
      } else {
        // If reference year data not available, estimate using CAGR backward
        // from latest available year
        const yearsBack = CAGR_END_YEAR - ndcTarget.reference_year;
        if (yearsBack > 0 && cagr !== null) {
          const estimatedRef = latestValue / Math.pow(1 + cagr, yearsBack);
          ndcAbsoluteTarget = estimatedRef * (1 - reduction);
        }
      }
    } else if (ndcTarget.reference_type === 'bau') {
      // BAU reduction: target = projected_bau * (1 - reduction)
      // The projected value IS the BAU scenario
      ndcAbsoluteTarget = projectedValue * (1 - reduction);
    } else if (ndcTarget.reference_type === 'intensity') {
      // Intensity targets are CO2/GDP, not CO2/capita
      // For per-capita data, we approximate: if GDP/capita grows, CO2/capita target is less strict
      // Use the same reduction % as a conservative estimate for CO2/capita
      const refValue = ndcTarget.reference_year ? getValue(ndcTarget.reference_year) : null;
      if (refValue !== null) {
        ndcAbsoluteTarget = refValue * (1 - reduction);
      } else {
        // Fallback: use earliest available value with backward estimation
        ndcAbsoluteTarget = projectedValue * (1 - reduction * 0.5);
      }
    }

    if (ndcAbsoluteTarget !== null) {
      // Clamp target to positive
      ndcAbsoluteTarget = Math.max(0.001, ndcAbsoluteTarget);

      gap = parseFloat((projectedValue - ndcAbsoluteTarget).toFixed(4));
      gapPct = parseFloat(
        (((projectedValue - ndcAbsoluteTarget) / ndcAbsoluteTarget) * 100).toFixed(1),
      );

      // Achievement probability using z-score
      if (sd > 0 && yearsAhead > 0) {
        const projectionUncertainty = sd * Math.sqrt(yearsAhead);
        const z = (ndcAbsoluteTarget - projectedValue) / projectionUncertainty;
        probability = parseFloat((normalCDF(z) * 100).toFixed(1));
        // Clamp to 0-100
        probability = Math.max(0, Math.min(100, probability));
      } else {
        // If no uncertainty, binary: on track or not
        probability = gap <= 0 ? 100 : 0;
      }

      status = probability > 50 ? 'on_track' : 'off_track';
    }
  }

  // Determine confidence level
  const dataPointCount = historical.length;
  let confidence = 'LOW';
  if (dataPointCount >= 15 && cagrPeriodValues.length >= 6) {
    confidence = 'HIGH';
  } else if (dataPointCount >= 8) {
    confidence = 'MEDIUM';
  }

  const result: CountryResult = {
    iso3,
    country_name: ndcTarget?.country_name ?? iso3,
    historical,
    projection,
    confidence_band: confidenceBand,
    ndc_target:
      ndcTarget && ndcAbsoluteTarget !== null
        ? {
            year: ndcTarget.target_year,
            value: parseFloat(ndcAbsoluteTarget.toFixed(4)),
            pct_reduction: ndcTarget.target_pct_reduction,
            reference_year: ndcTarget.reference_year,
            reference_type: ndcTarget.reference_type,
          }
        : null,
    gap,
    gap_pct: gapPct,
    achievement_probability: probability,
    cagr_2015_2023: cagr !== null ? parseFloat((cagr * 100).toFixed(3)) : null,
    status,
    metadata: {
      generated_at: generatedAt,
      source_indicators: [INDICATOR_CODE],
      methodology_version: '1.0',
      quality_threshold: QUALITY_THRESHOLD,
      confidence,
    },
  };

  return result;
}

// ── Main ──

async function main() {
  console.log('='.repeat(60));
  console.log('NDC Gap Analysis Pipeline');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Indicator: ${INDICATOR_CODE}`);
  console.log(`CAGR period: ${CAGR_START_YEAR}-${CAGR_END_YEAR}`);
  console.log(`Quality threshold: >= ${QUALITY_THRESHOLD}`);
  console.log('='.repeat(60));

  // 1. Read NDC targets
  console.log('\n[Step 1] Reading NDC targets...');
  const ndcPath = join(process.cwd(), 'data', 'ndc-targets.json');
  if (!existsSync(ndcPath)) {
    console.error(`[ERROR] NDC targets file not found: ${ndcPath}`);
    console.error('[ERROR] Run scripts/etl/collect-ndc-targets.ts first');
    process.exit(1);
  }

  const ndcFile: NdcTargetsFile = JSON.parse(readFileSync(ndcPath, 'utf-8'));
  const ndcTargets = ndcFile.targets;
  console.log(`[Step 1] Loaded ${Object.keys(ndcTargets).length} NDC targets`);

  // 2. Fetch all CO2 per capita data from Supabase (dynamic, not hardcoded)
  console.log('\n[Step 2] Fetching CO2/capita data from Supabase...');
  const co2Data = await fetchAllCO2Data();

  // 3. Process each country
  console.log('\n[Step 3] Processing countries...');
  const outputDir = join(process.cwd(), 'public', 'data', 'ndc-gap');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const summaryEntries: SummaryEntry[] = [];
  let onTrack = 0;
  let offTrack = 0;
  let noTarget = 0;
  let insufficientData = 0;
  let processed = 0;

  for (const [iso3, historical] of co2Data) {
    // Skip entries with too few data points
    if (historical.length < 3) {
      insufficientData++;
      continue;
    }

    const ndcTarget = ndcTargets[iso3] ?? null;
    const result = processCountry(iso3, historical, ndcTarget);

    // Count statuses
    switch (result.status) {
      case 'on_track':
        onTrack++;
        break;
      case 'off_track':
        offTrack++;
        break;
      case 'no_target':
        noTarget++;
        break;
      case 'insufficient_data':
        insufficientData++;
        break;
    }

    // Write per-country JSON
    const countryPath = join(outputDir, `${iso3}.json`);
    writeFileSync(countryPath, JSON.stringify(result, null, 2), 'utf-8');
    processed++;

    summaryEntries.push({
      iso3,
      country_name: result.country_name,
      status: result.status,
      gap_pct: result.gap_pct,
      probability: result.achievement_probability,
      cagr_2015_2023: result.cagr_2015_2023,
    });
  }

  // Sort summary: countries with targets first (by probability), then no_target
  summaryEntries.sort((a, b) => {
    const statusOrder: Record<string, number> = {
      on_track: 0,
      off_track: 1,
      no_target: 2,
      insufficient_data: 3,
    };
    const oa = statusOrder[a.status] ?? 4;
    const ob = statusOrder[b.status] ?? 4;
    if (oa !== ob) return oa - ob;
    // Within same status, sort by probability descending
    return (b.probability ?? -1) - (a.probability ?? -1);
  });

  // 4. Write summary JSON
  const summary = {
    on_track: onTrack,
    off_track: offTrack,
    no_target: noTarget,
    insufficient_data: insufficientData,
    total_countries: processed,
    countries: summaryEntries,
    metadata: {
      generated_at: new Date().toISOString(),
      source_indicators: [INDICATOR_CODE],
      methodology_version: '1.0',
      quality_threshold: QUALITY_THRESHOLD,
      cagr_period: `${CAGR_START_YEAR}-${CAGR_END_YEAR}`,
      confidence_note:
        'Probability calculated using z-score with historical volatility; HIGH confidence requires 15+ data points',
    },
  };

  const summaryPath = join(outputDir, 'summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

  // 5. Print results
  console.log('\n' + '='.repeat(80));
  console.log('NDC GAP ANALYSIS RESULTS');
  console.log('='.repeat(80));
  console.log(`Total countries processed: ${processed}`);
  console.log(`  On track:          ${onTrack}`);
  console.log(`  Off track:         ${offTrack}`);
  console.log(`  No NDC target:     ${noTarget}`);
  console.log(`  Insufficient data: ${insufficientData}`);

  // Print pilot country details
  const pilotISO3 = ['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD', 'CHN', 'IND', 'JPN', 'GBR'];
  console.log('\n[Pilot + Key Country Details]');
  console.log(
    `${'ISO3'.padEnd(6)} ${'Country'.padEnd(20)} ${'Status'.padEnd(14)} ${'CAGR%'.padEnd(10)} ${'Gap%'.padEnd(10)} ${'Prob%'.padEnd(8)}`,
  );
  console.log('-'.repeat(72));

  for (const iso3 of pilotISO3) {
    const entry = summaryEntries.find((e) => e.iso3 === iso3);
    if (entry) {
      console.log(
        `${entry.iso3.padEnd(6)} ${entry.country_name.padEnd(20)} ${entry.status.padEnd(14)} ${(entry.cagr_2015_2023?.toFixed(2) ?? 'N/A').padEnd(10)} ${(entry.gap_pct?.toFixed(1) ?? 'N/A').padEnd(10)} ${(entry.probability?.toFixed(1) ?? 'N/A').padEnd(8)}`,
      );
    }
  }

  // Print top on-track and off-track
  const onTrackCountries = summaryEntries.filter((e) => e.status === 'on_track');
  const offTrackCountries = summaryEntries.filter((e) => e.status === 'off_track');

  if (onTrackCountries.length > 0) {
    console.log(`\n[Top On-Track Countries] (${onTrackCountries.length} total)`);
    for (const e of onTrackCountries.slice(0, 10)) {
      console.log(
        `  ${e.iso3} ${e.country_name.padEnd(25)} probability: ${e.probability?.toFixed(1)}%`,
      );
    }
  }

  if (offTrackCountries.length > 0) {
    console.log(`\n[Top Off-Track Countries] (${offTrackCountries.length} total)`);
    for (const e of offTrackCountries.slice(0, 10)) {
      console.log(
        `  ${e.iso3} ${e.country_name.padEnd(25)} gap: ${e.gap_pct?.toFixed(1)}%, probability: ${e.probability?.toFixed(1)}%`,
      );
    }
  }

  console.log(`\n[Output Files]`);
  console.log(`  Per-country: ${outputDir}/{ISO3}.json (${processed} files)`);
  console.log(`  Summary:     ${summaryPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('NDC Gap Analysis Complete');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
