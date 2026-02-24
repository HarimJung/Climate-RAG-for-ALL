/**
 * scripts/analysis/calculate-equity.ts
 * Climate Equity Scatter — plots cumulative CO2 per capita vs vulnerability
 *
 * Indicators used:
 *   - OWID.CUMULATIVE_CO2 (Mt CO2, most recent year per country)
 *   - SP.POP.TOTL (population, most recent year per country)
 *   - NDGAIN.VULNERABILITY (0-1 scale, most recent year per country)
 *   - EN.GHG.CO2.PC.CE.AR5 (current CO2 per capita, most recent year per country)
 *
 * Derived metric:
 *   cumulative_co2_per_capita = OWID.CUMULATIVE_CO2 * 1_000_000 / SP.POP.TOTL
 *   (converts Mt to tonnes, then divides by population)
 *
 * Exclusions:
 *   - Countries with population < 100,000
 *   - Countries missing any of the 4 required indicators
 *
 * Quadrant classification (based on median split):
 *   - high cumulative + low vulnerability = "Historical Polluter"
 *   - low cumulative + high vulnerability = "Climate Victim"
 *   - high cumulative + high vulnerability = "Double Burden"
 *   - low cumulative + low vulnerability = "Low Impact"
 *
 * Output: public/data/equity-scatter.json
 * Run: npx tsx --env-file=.env.local scripts/analysis/calculate-equity.ts
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const REQUIRED_INDICATORS = [
  'OWID.CUMULATIVE_CO2',
  'SP.POP.TOTL',
  'NDGAIN.VULNERABILITY',
  'EN.GHG.CO2.PC.CE.AR5',
] as const;

const MIN_POPULATION = 100_000;

interface DataRow {
  country_iso3: string;
  indicator_code: string;
  year: number;
  value: number;
}

interface CountryRow {
  iso3: string;
  name: string;
}

interface CountryResult {
  iso3: string;
  name: string;
  cumulative_co2_per_capita: number;
  vulnerability: number;
  current_co2_pc: number;
  quadrant: string;
  data_year: {
    cumulative: number;
    vulnerability: number;
    co2_pc: number;
  };
}

/**
 * Paginated fetch from country_data — Supabase default limit is 1000 rows
 */
async function fetchAllIndicatorData(): Promise<DataRow[]> {
  const allData: DataRow[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;

  while (true) {
    const { data: page, error } = await supabase
      .from('country_data')
      .select('country_iso3, indicator_code, year, value')
      .in('indicator_code', [...REQUIRED_INDICATORS])
      .order('year', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Query failed:', error.message);
      process.exit(1);
    }
    if (!page || page.length === 0) break;
    allData.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allData;
}

/**
 * Fetch all countries from the countries table
 */
async function fetchCountries(): Promise<Map<string, string>> {
  const countryMap = new Map<string, string>();
  const PAGE_SIZE = 1000;
  let from = 0;

  while (true) {
    const { data: page, error } = await supabase
      .from('countries')
      .select('iso3, name')
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Countries query failed:', error.message);
      process.exit(1);
    }
    if (!page || page.length === 0) break;
    for (const row of page as CountryRow[]) {
      countryMap.set(row.iso3.trim().toUpperCase(), row.name);
    }
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return countryMap;
}

/**
 * For each country and indicator, extract the most recent year's value
 */
function getLatestValues(
  data: DataRow[]
): Map<string, Map<string, { value: number; year: number }>> {
  const result = new Map<string, Map<string, { value: number; year: number }>>();

  for (const row of data) {
    const iso3 = row.country_iso3.trim().toUpperCase();
    if (!result.has(iso3)) result.set(iso3, new Map());
    const byIndicator = result.get(iso3)!;

    const existing = byIndicator.get(row.indicator_code);
    // Data is ordered descending by year, so first occurrence is the latest
    if (!existing || row.year > existing.year) {
      byIndicator.set(row.indicator_code, { value: Number(row.value), year: row.year });
    }
  }

  return result;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function classifyQuadrant(
  cumulativeCo2Pc: number,
  vulnerability: number,
  medianCumulativeCo2Pc: number,
  medianVulnerability: number
): string {
  const highCumulative = cumulativeCo2Pc >= medianCumulativeCo2Pc;
  const highVulnerability = vulnerability >= medianVulnerability;

  if (highCumulative && !highVulnerability) return 'Historical Polluter';
  if (!highCumulative && highVulnerability) return 'Climate Victim';
  if (highCumulative && highVulnerability) return 'Double Burden';
  return 'Low Impact';
}

async function main() {
  console.log('=== Climate Equity Scatter Data ===\n');

  // 1. Fetch countries table
  console.log('Fetching countries...');
  const countryNames = await fetchCountries();
  console.log(`  Loaded ${countryNames.size} countries from countries table`);

  // 2. Fetch all indicator data
  console.log('Fetching indicator data...');
  const rawData = await fetchAllIndicatorData();
  console.log(`  Fetched ${rawData.length} total rows`);

  // 3. Get latest values per country per indicator
  const latestByCountry = getLatestValues(rawData);
  console.log(`  Found data for ${latestByCountry.size} unique country codes\n`);

  // 4. Build country results, tracking exclusions
  const exclusionReasons: Record<string, number> = {
    missing_cumulative_co2: 0,
    missing_population: 0,
    missing_vulnerability: 0,
    missing_co2_pc: 0,
    small_population: 0,
  };

  const validCountries: CountryResult[] = [];
  const allIso3Codes = new Set<string>([
    ...latestByCountry.keys(),
    ...countryNames.keys(),
  ]);

  for (const iso3 of allIso3Codes) {
    const indicators = latestByCountry.get(iso3);
    const name = countryNames.get(iso3);

    // Skip countries not in our countries table
    if (!name) continue;

    const cumulativeCo2 = indicators?.get('OWID.CUMULATIVE_CO2');
    const population = indicators?.get('SP.POP.TOTL');
    const vulnerability = indicators?.get('NDGAIN.VULNERABILITY');
    const co2Pc = indicators?.get('EN.GHG.CO2.PC.CE.AR5');

    // Track exclusion reasons (a country can be excluded for multiple reasons)
    let excluded = false;

    if (!cumulativeCo2) {
      exclusionReasons.missing_cumulative_co2++;
      excluded = true;
    }
    if (!population) {
      exclusionReasons.missing_population++;
      excluded = true;
    }
    if (!vulnerability) {
      exclusionReasons.missing_vulnerability++;
      excluded = true;
    }
    if (!co2Pc) {
      exclusionReasons.missing_co2_pc++;
      excluded = true;
    }

    if (excluded) continue;

    // Population filter
    if (population!.value < MIN_POPULATION) {
      exclusionReasons.small_population++;
      continue;
    }

    // Calculate cumulative CO2 per capita (Mt -> tonnes: multiply by 1,000,000)
    const cumulativeCo2PerCapita =
      (cumulativeCo2!.value * 1_000_000) / population!.value;

    validCountries.push({
      iso3,
      name,
      cumulative_co2_per_capita: Math.round(cumulativeCo2PerCapita * 100) / 100,
      vulnerability: Math.round(vulnerability!.value * 1000) / 1000,
      current_co2_pc: Math.round(co2Pc!.value * 100) / 100,
      quadrant: '', // filled after median calculation
      data_year: {
        cumulative: cumulativeCo2!.year,
        vulnerability: vulnerability!.year,
        co2_pc: co2Pc!.year,
      },
    });
  }

  // 5. Calculate medians
  const medianCumulativeCo2Pc = median(
    validCountries.map((c) => c.cumulative_co2_per_capita)
  );
  const medianVulnerability = median(
    validCountries.map((c) => c.vulnerability)
  );

  console.log(`Median cumulative CO2 per capita: ${medianCumulativeCo2Pc.toFixed(2)} tonnes`);
  console.log(`Median vulnerability: ${medianVulnerability.toFixed(4)}\n`);

  // 6. Assign quadrants
  for (const country of validCountries) {
    country.quadrant = classifyQuadrant(
      country.cumulative_co2_per_capita,
      country.vulnerability,
      medianCumulativeCo2Pc,
      medianVulnerability
    );
  }

  // Sort by cumulative CO2 per capita descending
  validCountries.sort((a, b) => b.cumulative_co2_per_capita - a.cumulative_co2_per_capita);

  // 7. Count quadrants
  const quadrantCounts: Record<string, number> = {};
  for (const c of validCountries) {
    quadrantCounts[c.quadrant] = (quadrantCounts[c.quadrant] || 0) + 1;
  }

  // 8. Total excluded
  const totalCountriesInTable = countryNames.size;
  const excludedCount = totalCountriesInTable - validCountries.length;

  // 9. Build output
  const output = {
    metadata: {
      generated_at: new Date().toISOString(),
      country_count: validCountries.length,
      excluded_count: excludedCount,
      exclusion_reasons: exclusionReasons,
      median_cumulative_co2_pc: Math.round(medianCumulativeCo2Pc * 100) / 100,
      median_vulnerability: Math.round(medianVulnerability * 1000) / 1000,
      source_indicators: [...REQUIRED_INDICATORS],
      methodology: 'cumulative_co2_per_capita = OWID.CUMULATIVE_CO2 * 1000000 / SP.POP.TOTL; quadrants split at median values',
      methodology_version: '1.0',
    },
    quadrant_summary: quadrantCounts,
    countries: validCountries,
  };

  // 10. Write to public/data/equity-scatter.json
  const outDir = join(process.cwd(), 'public', 'data');
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  const outPath = join(outDir, 'equity-scatter.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

  // 11. Print summary
  console.log('=== RESULTS ===');
  console.log(`Total countries (in countries table): ${totalCountriesInTable}`);
  console.log(`Countries with complete data: ${validCountries.length}`);
  console.log(`Excluded count: ${excludedCount}`);
  console.log('\nExclusion reasons:');
  for (const [reason, count] of Object.entries(exclusionReasons)) {
    console.log(`  ${reason}: ${count}`);
  }
  console.log('\nMedian values:');
  console.log(`  Cumulative CO2 per capita: ${medianCumulativeCo2Pc.toFixed(2)} tonnes`);
  console.log(`  Vulnerability: ${medianVulnerability.toFixed(4)}`);
  console.log('\nQuadrant distribution:');
  for (const [quadrant, count] of Object.entries(quadrantCounts)) {
    console.log(`  ${quadrant}: ${count}`);
  }

  // Check target
  if (validCountries.length < 120) {
    console.warn(
      `\n[WARNING] Only ${validCountries.length} countries with complete data (target: 120+)`
    );
  } else {
    console.log(`\n[OK] ${validCountries.length} countries meet the 120+ target`);
  }

  // Show pilot countries
  const pilotIso3 = ['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD'];
  console.log('\nPilot countries:');
  for (const iso of pilotIso3) {
    const c = validCountries.find((v) => v.iso3 === iso);
    if (c) {
      console.log(
        `  ${c.iso3} ${c.name}: cumCO2pc=${c.cumulative_co2_per_capita.toFixed(1)}, ` +
          `vuln=${c.vulnerability.toFixed(3)}, co2pc=${c.current_co2_pc.toFixed(1)}, ` +
          `quadrant="${c.quadrant}"`
      );
    } else {
      console.log(`  ${iso}: MISSING from results`);
    }
  }

  console.log(`\nOutput written to: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
