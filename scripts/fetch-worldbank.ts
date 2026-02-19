/**
 * scripts/fetch-worldbank.ts
 * Fetches 6 WB indicators for ALL countries → country_data table
 * Run: npx tsx --env-file=.env.local scripts/fetch-worldbank.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const INDICATORS = [
  { code: 'EN.GHG.CO2.PC.CE.AR5', source: 'World Bank WDI' },
  { code: 'NY.GDP.PCAP.CD',        source: 'World Bank WDI' },
  { code: 'EN.ATM.PM25.MC.M3',     source: 'World Bank WDI' },
  { code: 'AG.LND.FRST.ZS',        source: 'World Bank WDI' },
  { code: 'EG.USE.PCAP.KG.OE',     source: 'World Bank WDI' },
  { code: 'SP.POP.TOTL',           source: 'World Bank WDI' },
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

interface WBPoint {
  countryiso3code: string;
  date: string;
  value: number | null;
}

async function fetchPage(url: string, retries = 4): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res;
    const backoff = 2000 * Math.pow(2, attempt);
    console.warn(`  HTTP ${res.status} — retry ${attempt + 1}/${retries} in ${backoff}ms`);
    await delay(backoff);
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

async function fetchYearRange(code: string, dateFrom: number, dateTo: number): Promise<WBPoint[]> {
  const base = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=500&date=${dateFrom}:${dateTo}`;
  const all: WBPoint[] = [];
  let page = 1, totalPages = 1;
  do {
    try {
      const res = await fetchPage(`${base}&page=${page}`);
      const json = await res.json();
      if (!Array.isArray(json) || json.length < 2) break;
      totalPages = json[0].pages;
      all.push(...(json[1] ?? []));
      console.log(`  ${code} ${dateFrom}-${dateTo}: page ${page}/${totalPages} — ${json[1]?.length ?? 0} rows`);
      page++;
      if (page <= totalPages) await delay(800);
    } catch (e) {
      console.warn(`  Failed ${code} ${dateFrom}-${dateTo} page ${page}: ${(e as Error).message}`);
      break;
    }
  } while (page <= totalPages);
  return all;
}

// Split full range into 3 chunks to stay under rate-limit (≤4 pages each)
async function fetchAllPages(code: string): Promise<WBPoint[]> {
  const ranges = [[2000, 2007], [2008, 2015], [2016, 2023]] as const;
  const all: WBPoint[] = [];
  for (const [from, to] of ranges) {
    const rows = await fetchYearRange(code, from, to);
    all.push(...rows);
    await delay(2500); // cool-down between ranges
  }
  return all;
}

async function main() {
  // Load valid iso3 set from countries table
  const { data: countries, error: cErr } = await supabase.from('countries').select('iso3');
  if (cErr || !countries) { console.error('Cannot load countries:', cErr?.message); process.exit(1); }
  const validIso3 = new Set(countries.map((c: { iso3: string }) => c.iso3.trim().toUpperCase()));
  console.log(`Loaded ${validIso3.size} valid iso3 codes\n`);

  let grandTotal = 0;

  for (let i = 0; i < INDICATORS.length; i++) {
    const ind = INDICATORS[i];
    console.log(`[${i+1}/${INDICATORS.length}] ${ind.code}`);

    const points = await fetchAllPages(ind.code);

    const rows = points
      .filter(p => p.value !== null && p.countryiso3code && validIso3.has(p.countryiso3code.toUpperCase()))
      .map(p => ({
        country_iso3:   p.countryiso3code.toUpperCase(),
        indicator_code: ind.code,
        year:           parseInt(p.date, 10),
        value:          p.value,
        source:         ind.source,
      }));

    console.log(`  → ${rows.length} valid rows`);

    // Upsert in batches of 500
    const BATCH = 500;
    let inserted = 0;
    for (let j = 0; j < rows.length; j += BATCH) {
      const batch = rows.slice(j, j + BATCH);
      const { error } = await supabase
        .from('country_data')
        .upsert(batch, { onConflict: 'country_iso3,indicator_code,year' });
      if (error) console.warn(`  Batch error: ${error.message}`);
      else inserted += batch.length;
    }
    console.log(`  ✓ Upserted ${inserted} rows\n`);
    grandTotal += inserted;

    if (i < INDICATORS.length - 1) await delay(3000);
  }

  console.log(`\n✅ Done. Total upserted: ${grandTotal}`);
}

main().catch(err => { console.error(err); process.exit(1); });
