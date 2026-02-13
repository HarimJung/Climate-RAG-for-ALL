/**
 * Climate TRACE GHG 총배출 ETL
 * 6개 파일럿 국가의 연도별 CO2e 총배출량을 수집하여 country_data에 적재
 */

const COUNTRIES = ['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD'] as const;
const INDICATOR_CODE = 'CT.GHG.TOTAL';
const SOURCE = 'Climate TRACE';
const BASE_URL = 'https://api.climatetrace.org/v6/country/emissions';
const START_YEAR = 2015; // Climate TRACE coverage starts ~2015
const END_YEAR = 2023;

interface CTEmission {
  country: string;
  emissions: {
    co2: number;
    ch4: number;
    n2o: number;
    co2e_100yr: number;
    co2e_20yr: number;
  };
}

interface Row {
  country_iso3: string;
  indicator_code: string;
  year: number;
  value: number;
  source: string;
}

async function fetchYearData(
  countries: string,
  year: number
): Promise<CTEmission[]> {
  const url = `${BASE_URL}?countries=${countries}&since=${year}&to=${year}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error ${res.status} for year ${year}: ${res.statusText}`);
  }
  return res.json() as Promise<CTEmission[]>;
}

async function main() {
  const allRows: Row[] = [];
  const countriesParam = COUNTRIES.join(',');

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    console.log(`Fetching ${year}...`);
    try {
      const data = await fetchYearData(countriesParam, year);

      for (const entry of data) {
        const iso3 = entry.country;
        if (!COUNTRIES.includes(iso3 as typeof COUNTRIES[number])) continue;

        const value = entry.emissions?.co2e_100yr;
        if (value == null || value === 0) {
          console.warn(`  ⚠ No co2e_100yr for ${iso3} in ${year}`);
          continue;
        }

        allRows.push({
          country_iso3: iso3,
          indicator_code: INDICATOR_CODE,
          year,
          value: Math.round(value), // tonnes, integer precision
          source: SOURCE,
        });
      }

      // Rate limit: 200ms between requests
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`  ✗ Failed year ${year}:`, err);
    }
  }

  console.log(`\nCollected ${allRows.length} rows total`);

  // Output as JSON for DB insertion
  const outputPath = new URL('../data/climate-trace-ghg.json', import.meta.url);
  const { writeFileSync, mkdirSync } = await import('fs');
  const { dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const outFile = fileURLToPath(outputPath);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(allRows, null, 2));
  console.log(`Wrote ${allRows.length} rows to ${outFile}`);

  // Print summary
  for (const iso3 of COUNTRIES) {
    const countryRows = allRows.filter((r) => r.country_iso3 === iso3);
    console.log(`  ${iso3}: ${countryRows.length} years`);
  }
}

main().catch(console.error);
