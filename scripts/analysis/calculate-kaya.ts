/**
 * scripts/analysis/calculate-kaya.ts
 * Kaya Identity LMDI Additive Decomposition (2015-2023)
 *
 * Kaya Identity:
 *   CO2 = Population x (GDP/Pop) x (Energy/GDP) x (CO2/Energy)
 *
 * LMDI (Log Mean Divisia Index) Additive Method:
 *   For each consecutive year pair t-1 -> t:
 *     L(a,b) = (a - b) / (ln(a) - ln(b))           // logarithmic mean
 *     dCO2_pop    = L(CO2_t, CO2_t-1) x ln(Pop_t / Pop_t-1)
 *     dCO2_gdp    = L(CO2_t, CO2_t-1) x ln(GDPpc_t / GDPpc_t-1)
 *     dCO2_energy = L(CO2_t, CO2_t-1) x ln(EnergyIntensity_t / EnergyIntensity_t-1)
 *     dCO2_carbon = L(CO2_t, CO2_t-1) x ln(CarbonIntensity_t / CarbonIntensity_t-1)
 *
 * Data Sources:
 *   - SP.POP.TOTL            -> Population
 *   - NY.GDP.PCAP.CD         -> GDP per capita
 *   - EG.USE.PCAP.KG.OE      -> Energy use per capita (divide by GDP/Pop -> Energy/GDP)
 *   - EMBER.CARBON.INTENSITY  -> gCO2/kWh (carbon intensity of electricity)
 *   - EN.GHG.CO2.PC.CE.AR5   -> CO2 per capita (x Pop -> total CO2)
 *
 * Output:
 *   - public/data/kaya/{ISO3}.json  (per-country decomposition)
 *   - public/data/kaya/summary.json (cross-country summary)
 *
 * Run: npx tsx --env-file=.env.local scripts/analysis/calculate-kaya.ts
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// ── Environment ──
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Constants ──
const START_YEAR = 2015;
const END_YEAR = 2023;
const MIN_POPULATION = 100_000;
const RESIDUAL_THRESHOLD = 0.02; // 2%

const REQUIRED_INDICATORS = [
  'SP.POP.TOTL',
  'NY.GDP.PCAP.CD',
  'EG.USE.PCAP.KG.OE',
  'EMBER.CARBON.INTENSITY',
  'EN.GHG.CO2.PC.CE.AR5',
] as const;

const OUTPUT_DIR = join(process.cwd(), 'public', 'data', 'kaya');

// ── Types ──
interface DataPoint {
  country_iso3: string;
  year: number;
  value: number;
}

interface CountryYearData {
  population: number;
  gdp_per_capita: number;
  energy_per_capita: number;
  carbon_intensity: number;
  co2_per_capita: number;
  // Derived Kaya factors
  total_co2: number;
  energy_intensity: number; // Energy/GDP = (Energy/Pop) / (GDP/Pop)
}

interface KayaFactor {
  contribution: number;
  pct: number;
}

interface WaterfallItem {
  label: string;
  value: number;
  type: 'start' | 'increase' | 'decrease' | 'end';
}

interface CountryResult {
  iso3: string;
  country_name: string;
  period: { start: number; end: number };
  co2_start: number;
  co2_end: number;
  co2_change: number;
  factors: {
    population: KayaFactor;
    gdp_per_capita: KayaFactor;
    energy_intensity: KayaFactor;
    carbon_intensity: KayaFactor;
  };
  biggest_driver: string;
  biggest_driver_label: string;
  residual: number;
  residual_pct: number;
  confidence: 'HIGH' | 'LOW';
  waterfall: WaterfallItem[];
  metadata: {
    generated_at: string;
    source_indicators: string[];
    methodology_version: string;
  };
}

interface SummaryEntry {
  iso3: string;
  country_name: string;
  biggest_driver: string;
  co2_change_pct: number;
  confidence: 'HIGH' | 'LOW';
}

interface Summary {
  total_countries: number;
  high_confidence: number;
  low_confidence: number;
  countries: SummaryEntry[];
  metadata: {
    generated_at: string;
    period: { start: number; end: number };
    methodology: string;
    source_indicators: string[];
  };
}

// ── Utility Functions ──

/**
 * Logarithmic mean: L(a, b) = (a - b) / (ln(a) - ln(b))
 * When a == b, L(a, b) = a (limit case)
 */
function logMean(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0;
  if (Math.abs(a - b) < 1e-10) return a;
  return (a - b) / (Math.log(a) - Math.log(b));
}

/**
 * Linear interpolation for missing intermediate years.
 * Given a sparse map of year -> value, fills in missing years between
 * the min and max year present.
 */
function interpolateTimeSeries(
  data: Map<number, number>,
  startYear: number,
  endYear: number,
): Map<number, number> {
  const result = new Map<number, number>();
  const years = Array.from(data.keys()).filter(y => y >= startYear && y <= endYear).sort((a, b) => a - b);

  if (years.length === 0) return result;

  // Copy existing data points
  for (const y of years) {
    result.set(y, data.get(y)!);
  }

  // Interpolate gaps
  for (let i = 0; i < years.length - 1; i++) {
    const y1 = years[i];
    const y2 = years[i + 1];
    const v1 = data.get(y1)!;
    const v2 = data.get(y2)!;

    for (let y = y1 + 1; y < y2; y++) {
      const ratio = (y - y1) / (y2 - y1);
      result.set(y, v1 + ratio * (v2 - v1));
    }
  }

  return result;
}

// ── Data Fetching ──

/**
 * Fetch all data for a given indicator from country_data table.
 * Uses pagination to handle potentially large result sets (>1000 rows).
 */
async function fetchIndicator(code: string): Promise<DataPoint[]> {
  const allData: DataPoint[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('country_data')
      .select('country_iso3, year, value')
      .eq('indicator_code', code)
      .gte('year', START_YEAR)
      .lte('year', END_YEAR)
      .order('country_iso3')
      .order('year')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error(`[ERROR] Failed to fetch ${code}:`, error.message);
      return allData;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      for (const row of data) {
        if (row.value !== null && row.value !== undefined) {
          allData.push({
            country_iso3: row.country_iso3.trim(),
            year: row.year,
            value: Number(row.value),
          });
        }
      }
      offset += PAGE_SIZE;
      if (data.length < PAGE_SIZE) hasMore = false;
    }
  }

  return allData;
}

/**
 * Fetch country names from the countries table.
 */
async function fetchCountryNames(): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  const { data, error } = await supabase
    .from('countries')
    .select('iso3, name');

  if (error || !data) {
    console.error('[ERROR] Failed to fetch country names:', error?.message);
    return nameMap;
  }

  for (const row of data) {
    nameMap.set(row.iso3.trim(), row.name);
  }

  return nameMap;
}

// ── LMDI Calculation ──

/**
 * Perform LMDI additive decomposition for a single country across all year pairs.
 *
 * Kaya factors per year:
 *   Pop           = SP.POP.TOTL
 *   GDPpc         = NY.GDP.PCAP.CD
 *   EnergyInt     = EG.USE.PCAP.KG.OE / NY.GDP.PCAP.CD   (Energy/GDP)
 *   CarbonInt     = EMBER.CARBON.INTENSITY
 *   TotalCO2      = EN.GHG.CO2.PC.CE.AR5 * SP.POP.TOTL
 *
 * For each year pair (t-1, t), LMDI additive contributions:
 *   L = logMean(CO2_t, CO2_{t-1})
 *   dPop    = L * ln(Pop_t / Pop_{t-1})
 *   dGDPpc  = L * ln(GDPpc_t / GDPpc_{t-1})
 *   dEnergy = L * ln(EnergyInt_t / EnergyInt_{t-1})
 *   dCarbon = L * ln(CarbonInt_t / CarbonInt_{t-1})
 *
 * Cumulative = sum over all year pairs.
 */
function computeLMDI(
  yearData: Map<number, CountryYearData>,
): {
  dPop: number;
  dGDP: number;
  dEnergy: number;
  dCarbon: number;
  co2Start: number;
  co2End: number;
} | null {
  const years = Array.from(yearData.keys()).sort((a, b) => a - b);
  if (years.length < 2) return null;

  let dPop = 0;
  let dGDP = 0;
  let dEnergy = 0;
  let dCarbon = 0;

  for (let i = 1; i < years.length; i++) {
    const prev = yearData.get(years[i - 1])!;
    const curr = yearData.get(years[i])!;

    // Skip if any factor is zero or negative (can't take log)
    if (
      prev.total_co2 <= 0 || curr.total_co2 <= 0 ||
      prev.population <= 0 || curr.population <= 0 ||
      prev.gdp_per_capita <= 0 || curr.gdp_per_capita <= 0 ||
      prev.energy_intensity <= 0 || curr.energy_intensity <= 0 ||
      prev.carbon_intensity <= 0 || curr.carbon_intensity <= 0
    ) {
      continue;
    }

    const L = logMean(curr.total_co2, prev.total_co2);

    dPop += L * Math.log(curr.population / prev.population);
    dGDP += L * Math.log(curr.gdp_per_capita / prev.gdp_per_capita);
    dEnergy += L * Math.log(curr.energy_intensity / prev.energy_intensity);
    dCarbon += L * Math.log(curr.carbon_intensity / prev.carbon_intensity);
  }

  const firstYear = years[0];
  const lastYear = years[years.length - 1];

  return {
    dPop,
    dGDP,
    dEnergy,
    dCarbon,
    co2Start: yearData.get(firstYear)!.total_co2,
    co2End: yearData.get(lastYear)!.total_co2,
  };
}

// ── Main ──

async function main() {
  console.log('='.repeat(70));
  console.log('Kaya Identity LMDI Additive Decomposition (2015-2023)');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Period: ${START_YEAR}-${END_YEAR}`);
  console.log(`Residual threshold: ${RESIDUAL_THRESHOLD * 100}%`);
  console.log('='.repeat(70));

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Step 1: Fetch all required indicators
  console.log('\n[Step 1] Fetching indicator data from Supabase...');
  const rawData: Record<string, DataPoint[]> = {};

  for (const code of REQUIRED_INDICATORS) {
    rawData[code] = await fetchIndicator(code);
    console.log(`  ${code}: ${rawData[code].length} data points`);
  }

  // Step 2: Fetch country names
  console.log('\n[Step 2] Fetching country names...');
  const countryNames = await fetchCountryNames();
  console.log(`  ${countryNames.size} countries in countries table`);

  // Step 3: Build per-country data maps
  console.log('\n[Step 3] Building per-country indicator maps...');

  // index: indicator -> iso3 -> year -> value
  const indicatorMaps = new Map<string, Map<string, Map<number, number>>>();

  for (const code of REQUIRED_INDICATORS) {
    const byCountry = new Map<string, Map<number, number>>();
    for (const dp of rawData[code]) {
      if (!byCountry.has(dp.country_iso3)) {
        byCountry.set(dp.country_iso3, new Map());
      }
      byCountry.get(dp.country_iso3)!.set(dp.year, dp.value);
    }
    indicatorMaps.set(code, byCountry);
  }

  // Step 4: Identify eligible countries
  // Requirements: all 5 indicators present, data for both START_YEAR and END_YEAR, population >= MIN_POPULATION
  console.log('\n[Step 4] Filtering eligible countries...');

  const allIso3 = new Set<string>();
  for (const code of REQUIRED_INDICATORS) {
    const byCountry = indicatorMaps.get(code)!;
    for (const iso3 of byCountry.keys()) {
      allIso3.add(iso3);
    }
  }

  const eligibleCountries: string[] = [];
  const rejectionReasons = new Map<string, string>();

  for (const iso3 of allIso3) {
    // Check population threshold
    const popMap = indicatorMaps.get('SP.POP.TOTL')?.get(iso3);
    if (!popMap) {
      rejectionReasons.set(iso3, 'missing SP.POP.TOTL');
      continue;
    }

    // Check population >= MIN_POPULATION at either boundary year
    const popStart = popMap.get(START_YEAR);
    const popEnd = popMap.get(END_YEAR);
    if (popStart !== undefined && popStart < MIN_POPULATION) {
      rejectionReasons.set(iso3, `population too small: ${popStart.toLocaleString()}`);
      continue;
    }
    if (popEnd !== undefined && popEnd < MIN_POPULATION) {
      rejectionReasons.set(iso3, `population too small: ${popEnd.toLocaleString()}`);
      continue;
    }

    // Check all indicators have data for START_YEAR and END_YEAR
    let missingIndicator: string | null = null;
    for (const code of REQUIRED_INDICATORS) {
      const countryMap = indicatorMaps.get(code)?.get(iso3);
      if (!countryMap) {
        missingIndicator = `${code} (no data)`;
        break;
      }
      if (!countryMap.has(START_YEAR) && !countryMap.has(END_YEAR)) {
        missingIndicator = `${code} (no data for ${START_YEAR} or ${END_YEAR})`;
        break;
      }
      // We need at least one boundary year for interpolation to work
      // but require both boundary years for strict validation
      if (!countryMap.has(START_YEAR)) {
        // Check if there's an earlier year we can use for interpolation to START_YEAR
        const years = Array.from(countryMap.keys()).sort((a, b) => a - b);
        const hasBeforeStart = years.some(y => y < START_YEAR);
        const hasAfterStart = years.some(y => y > START_YEAR);
        if (!hasBeforeStart || !hasAfterStart) {
          missingIndicator = `${code} (no data for ${START_YEAR}, cannot interpolate)`;
          break;
        }
      }
      if (!countryMap.has(END_YEAR)) {
        const years = Array.from(countryMap.keys()).sort((a, b) => a - b);
        const hasBeforeEnd = years.some(y => y < END_YEAR);
        const hasAfterEnd = years.some(y => y > END_YEAR);
        if (!hasBeforeEnd && !hasAfterEnd) {
          // Allow if the latest year is close to END_YEAR
          const maxYear = Math.max(...years);
          if (maxYear < END_YEAR - 2) {
            missingIndicator = `${code} (latest year ${maxYear}, too far from ${END_YEAR})`;
            break;
          }
        }
      }
    }

    if (missingIndicator) {
      rejectionReasons.set(iso3, `missing ${missingIndicator}`);
      continue;
    }

    eligibleCountries.push(iso3);
  }

  eligibleCountries.sort();
  console.log(`  Total unique ISO3 codes found: ${allIso3.size}`);
  console.log(`  Eligible countries: ${eligibleCountries.length}`);
  console.log(`  Rejected: ${rejectionReasons.size}`);

  if (eligibleCountries.length === 0) {
    console.error('[FATAL] No eligible countries found. Exiting.');
    process.exit(1);
  }

  // Step 5: LMDI calculation for each country
  console.log('\n[Step 5] Computing LMDI decomposition...');

  const results: CountryResult[] = [];
  const skipped: string[] = [];

  for (const iso3 of eligibleCountries) {
    // Build interpolated time series for each indicator
    const pop = interpolateTimeSeries(
      indicatorMaps.get('SP.POP.TOTL')!.get(iso3)!,
      START_YEAR, END_YEAR,
    );
    const gdppc = interpolateTimeSeries(
      indicatorMaps.get('NY.GDP.PCAP.CD')!.get(iso3)!,
      START_YEAR, END_YEAR,
    );
    const energypc = interpolateTimeSeries(
      indicatorMaps.get('EG.USE.PCAP.KG.OE')!.get(iso3)!,
      START_YEAR, END_YEAR,
    );
    const carbonInt = interpolateTimeSeries(
      indicatorMaps.get('EMBER.CARBON.INTENSITY')!.get(iso3)!,
      START_YEAR, END_YEAR,
    );
    const co2pc = interpolateTimeSeries(
      indicatorMaps.get('EN.GHG.CO2.PC.CE.AR5')!.get(iso3)!,
      START_YEAR, END_YEAR,
    );

    // Check that we have START_YEAR and END_YEAR after interpolation
    if (!pop.has(START_YEAR) || !pop.has(END_YEAR) ||
        !gdppc.has(START_YEAR) || !gdppc.has(END_YEAR) ||
        !energypc.has(START_YEAR) || !energypc.has(END_YEAR) ||
        !carbonInt.has(START_YEAR) || !carbonInt.has(END_YEAR) ||
        !co2pc.has(START_YEAR) || !co2pc.has(END_YEAR)) {
      skipped.push(iso3);
      continue;
    }

    // Build year -> CountryYearData
    const yearData = new Map<number, CountryYearData>();

    for (let y = START_YEAR; y <= END_YEAR; y++) {
      const p = pop.get(y);
      const g = gdppc.get(y);
      const e = energypc.get(y);
      const c = carbonInt.get(y);
      const co2 = co2pc.get(y);

      if (p === undefined || g === undefined || e === undefined ||
          c === undefined || co2 === undefined) {
        continue;
      }

      if (p <= 0 || g <= 0 || e <= 0 || c <= 0) continue;

      const energyIntensity = e / g; // (Energy/Pop) / (GDP/Pop) = Energy/GDP

      yearData.set(y, {
        population: p,
        gdp_per_capita: g,
        energy_per_capita: e,
        carbon_intensity: c,
        co2_per_capita: co2,
        total_co2: co2 * p,           // Total CO2 = CO2/capita * population
        energy_intensity: energyIntensity,
      });
    }

    if (!yearData.has(START_YEAR) || !yearData.has(END_YEAR)) {
      skipped.push(iso3);
      continue;
    }

    // Run LMDI
    const lmdi = computeLMDI(yearData);
    if (!lmdi) {
      skipped.push(iso3);
      continue;
    }

    const { dPop, dGDP, dEnergy, dCarbon, co2Start, co2End } = lmdi;
    const actualChange = co2End - co2Start;
    const factorSum = dPop + dGDP + dEnergy + dCarbon;
    const residual = factorSum - actualChange;
    const residualPct = actualChange !== 0
      ? Math.abs(residual) / Math.abs(actualChange)
      : (Math.abs(residual) < 1e-6 ? 0 : 1);

    const confidence: 'HIGH' | 'LOW' = residualPct <= RESIDUAL_THRESHOLD ? 'HIGH' : 'LOW';

    if (confidence === 'LOW') {
      console.log(`  [WARN] ${iso3}: residual ${(residualPct * 100).toFixed(2)}% > ${RESIDUAL_THRESHOLD * 100}% threshold`);
    }

    // Determine biggest driver by absolute contribution
    const factors: Record<string, { contribution: number; label: string }> = {
      population: { contribution: dPop, label: 'Population' },
      gdp_per_capita: { contribution: dGDP, label: 'GDP per Capita' },
      energy_intensity: { contribution: dEnergy, label: 'Energy Intensity' },
      carbon_intensity: { contribution: dCarbon, label: 'Carbon Intensity' },
    };

    let biggestDriver = 'population';
    let biggestAbs = 0;
    for (const [key, val] of Object.entries(factors)) {
      if (Math.abs(val.contribution) > biggestAbs) {
        biggestAbs = Math.abs(val.contribution);
        biggestDriver = key;
      }
    }

    // Calculate percentage contributions (relative to actual change)
    // pct = (factor_contribution / actual_change) * 100
    // When actual_change is near zero, use factor_sum as denominator
    const denominator = actualChange !== 0 ? actualChange : (factorSum !== 0 ? factorSum : 1);
    const pctPop = (dPop / denominator) * 100;
    const pctGDP = (dGDP / denominator) * 100;
    const pctEnergy = (dEnergy / denominator) * 100;
    const pctCarbon = (dCarbon / denominator) * 100;

    // Scale CO2 values for readability: convert from "per-capita * people" units
    // CO2_per_capita is in metric tons, population is count
    // Total CO2 = metric tons. Convert to Mt (million tonnes) for readability.
    const co2StartMt = co2Start / 1e6;
    const co2EndMt = co2End / 1e6;
    const co2ChangeMt = actualChange / 1e6;
    const dPopMt = dPop / 1e6;
    const dGDPMt = dGDP / 1e6;
    const dEnergyMt = dEnergy / 1e6;
    const dCarbonMt = dCarbon / 1e6;
    const residualMt = residual / 1e6;

    // Build waterfall
    const waterfall: WaterfallItem[] = [
      { label: `CO2 ${START_YEAR}`, value: round(co2StartMt, 2), type: 'start' },
      { label: 'Population', value: round(dPopMt, 2), type: dPop >= 0 ? 'increase' : 'decrease' },
      { label: 'GDP/capita', value: round(dGDPMt, 2), type: dGDP >= 0 ? 'increase' : 'decrease' },
      { label: 'Energy/GDP', value: round(dEnergyMt, 2), type: dEnergy >= 0 ? 'increase' : 'decrease' },
      { label: 'CO2/Energy', value: round(dCarbonMt, 2), type: dCarbon >= 0 ? 'increase' : 'decrease' },
      { label: `CO2 ${END_YEAR}`, value: round(co2EndMt, 2), type: 'end' },
    ];

    const countryResult: CountryResult = {
      iso3,
      country_name: countryNames.get(iso3) || iso3,
      period: { start: START_YEAR, end: END_YEAR },
      co2_start: round(co2StartMt, 2),
      co2_end: round(co2EndMt, 2),
      co2_change: round(co2ChangeMt, 2),
      factors: {
        population: { contribution: round(dPopMt, 2), pct: round(pctPop, 1) },
        gdp_per_capita: { contribution: round(dGDPMt, 2), pct: round(pctGDP, 1) },
        energy_intensity: { contribution: round(dEnergyMt, 2), pct: round(pctEnergy, 1) },
        carbon_intensity: { contribution: round(dCarbonMt, 2), pct: round(pctCarbon, 1) },
      },
      biggest_driver: biggestDriver,
      biggest_driver_label: factors[biggestDriver].label,
      residual: round(residualMt, 2),
      residual_pct: round(residualPct * 100, 2),
      confidence,
      waterfall,
      metadata: {
        generated_at: new Date().toISOString(),
        source_indicators: [...REQUIRED_INDICATORS],
        methodology_version: '1.0',
      },
    };

    results.push(countryResult);
  }

  console.log(`\n  Computed: ${results.length} countries`);
  console.log(`  Skipped (insufficient data after interpolation): ${skipped.length}`);
  if (skipped.length > 0) {
    console.log(`  Skipped ISO3: ${skipped.join(', ')}`);
  }

  // Step 6: Write per-country JSON files
  console.log('\n[Step 6] Writing per-country JSON files...');

  for (const result of results) {
    const filePath = join(OUTPUT_DIR, `${result.iso3}.json`);
    writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
  }
  console.log(`  Written ${results.length} files to ${OUTPUT_DIR}/`);

  // Step 7: Write summary JSON
  console.log('\n[Step 7] Writing summary.json...');

  const highConfidence = results.filter(r => r.confidence === 'HIGH');
  const lowConfidence = results.filter(r => r.confidence === 'LOW');

  const summaryCountries: SummaryEntry[] = results
    .map(r => ({
      iso3: r.iso3,
      country_name: r.country_name,
      biggest_driver: r.biggest_driver,
      co2_change_pct: r.co2_start !== 0
        ? round((r.co2_change / r.co2_start) * 100, 1)
        : 0,
      confidence: r.confidence,
    }))
    .sort((a, b) => a.co2_change_pct - b.co2_change_pct);

  const summary: Summary = {
    total_countries: results.length,
    high_confidence: highConfidence.length,
    low_confidence: lowConfidence.length,
    countries: summaryCountries,
    metadata: {
      generated_at: new Date().toISOString(),
      period: { start: START_YEAR, end: END_YEAR },
      methodology: 'LMDI Additive Decomposition of Kaya Identity',
      source_indicators: [...REQUIRED_INDICATORS],
    },
  };

  const summaryPath = join(OUTPUT_DIR, 'summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`  Written ${summaryPath}`);

  // Step 8: Print summary stats
  console.log('\n' + '='.repeat(70));
  console.log('KAYA LMDI DECOMPOSITION COMPLETE');
  console.log('='.repeat(70));
  console.log(`  Total countries processed: ${results.length}`);
  console.log(`  HIGH confidence: ${highConfidence.length}`);
  console.log(`  LOW confidence: ${lowConfidence.length}`);
  console.log(`  Output directory: ${OUTPUT_DIR}`);
  console.log('');

  // Print top-level stats for each country
  console.log('Country Results (CO2 in Mt, sorted by CO2 change %):');
  console.log('-'.repeat(110));
  console.log(
    'ISO3'.padEnd(6) +
    'Country'.padEnd(22) +
    'CO2 2015'.padStart(10) +
    'CO2 2023'.padStart(10) +
    'Change%'.padStart(9) +
    'Pop'.padStart(10) +
    'GDP/cap'.padStart(10) +
    'Enrg/GDP'.padStart(10) +
    'CO2/Enrg'.padStart(10) +
    'Biggest'.padStart(18) +
    'Conf'.padStart(6),
  );
  console.log('-'.repeat(110));

  for (const entry of summaryCountries) {
    const r = results.find(x => x.iso3 === entry.iso3)!;
    console.log(
      r.iso3.padEnd(6) +
      r.country_name.substring(0, 20).padEnd(22) +
      r.co2_start.toFixed(1).padStart(10) +
      r.co2_end.toFixed(1).padStart(10) +
      (entry.co2_change_pct >= 0 ? '+' : '') + entry.co2_change_pct.toFixed(1).padStart(8) + '%' +
      r.factors.population.contribution.toFixed(1).padStart(10) +
      r.factors.gdp_per_capita.contribution.toFixed(1).padStart(10) +
      r.factors.energy_intensity.contribution.toFixed(1).padStart(10) +
      r.factors.carbon_intensity.contribution.toFixed(1).padStart(10) +
      r.biggest_driver_label.padStart(18) +
      r.confidence.padStart(6),
    );
  }
  console.log('-'.repeat(110));

  // Biggest driver distribution
  const driverCounts = new Map<string, number>();
  for (const r of results) {
    driverCounts.set(r.biggest_driver_label, (driverCounts.get(r.biggest_driver_label) ?? 0) + 1);
  }
  console.log('\nBiggest Driver Distribution:');
  for (const [label, count] of [...driverCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${label}: ${count} countries (${((count / results.length) * 100).toFixed(0)}%)`);
  }

  // LOW confidence countries
  if (lowConfidence.length > 0) {
    console.log(`\nLOW Confidence Countries (residual > ${RESIDUAL_THRESHOLD * 100}%):`);
    for (const r of lowConfidence) {
      console.log(`  ${r.iso3} (${r.country_name}): residual ${r.residual_pct}%`);
    }
  }

  console.log('\n' + '='.repeat(70));
}

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
