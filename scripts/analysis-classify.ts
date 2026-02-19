/**
 * scripts/analysis-classify.ts
 * Classifies countries by climate action:
 *   Changer  — CO2 CAGR(2015-2023)<0 AND renewable delta(2018-2023)>2pp
 *   Starter  — only one of the above
 *   Talker   — neither
 *   NoData   — insufficient data (stored as null, not upserted)
 *
 * Result upserted to country_data: indicator_code=DERIVED.CLIMATE_CLASS, year=2023
 * Value encoding: 1=Changer, 2=Starter, 3=Talker (NoData = no row)
 *
 * Run: npx tsx --env-file=.env.local scripts/analysis-classify.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CLASS_VALUES: Record<string, number> = { Changer: 1, Starter: 2, Talker: 3 };

async function main() {
  console.log('Loading CO2 and renewable data from Supabase…');

  // Fetch all CO2 and renewable data — paginate to get past Supabase's 1000-row default
  interface DataRow { country_iso3: string; indicator_code: string; year: number; value: number }
  const allData: DataRow[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from('country_data')
      .select('country_iso3, indicator_code, year, value')
      .in('indicator_code', ['EN.GHG.CO2.PC.CE.AR5', 'EMBER.RENEWABLE.PCT'])
      .gte('year', 2015)
      .lte('year', 2023)
      .order('year', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error('Query failed:', error.message); process.exit(1); }
    if (!page || page.length === 0) break;
    allData.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  const data = allData;

  if (data.length === 0) { console.warn('No data returned'); process.exit(0); }
  console.log(`Fetched ${data.length} rows for classification`);

  // Group by country and indicator
  const byCountry = new Map<string, Map<string, Map<number, number>>>();
  for (const row of data as { country_iso3: string; indicator_code: string; year: number; value: number }[]) {
    if (!byCountry.has(row.country_iso3)) byCountry.set(row.country_iso3, new Map());
    const byInd = byCountry.get(row.country_iso3)!;
    if (!byInd.has(row.indicator_code)) byInd.set(row.indicator_code, new Map());
    byInd.get(row.indicator_code)!.set(row.year, Number(row.value));
  }

  const results: { country_iso3: string; cls: string; cagr?: number; delta?: number }[] = [];

  for (const [iso3, byInd] of byCountry) {
    const co2 = byInd.get('EN.GHG.CO2.PC.CE.AR5') ?? new Map<number, number>();
    const ren = byInd.get('EMBER.RENEWABLE.PCT')   ?? new Map<number, number>();

    // CO2 CAGR 2015→2023
    const co2_2015 = co2.get(2015);
    const co2_2023 = co2.get(2023) ?? co2.get(2022) ?? co2.get(2021); // fallback to recent year
    let cagr: number | undefined;
    if (co2_2015 != null && co2_2023 != null && co2_2015 > 0) {
      const years = co2_2023 === co2.get(2023) ? 8 : co2_2023 === co2.get(2022) ? 7 : 6;
      cagr = Math.pow(co2_2023 / co2_2015, 1 / years) - 1;
    }

    // Renewable delta 2018→2023
    const ren_2018 = ren.get(2018) ?? ren.get(2019);
    const ren_2023 = ren.get(2023) ?? ren.get(2022) ?? ren.get(2021);
    let delta: number | undefined;
    if (ren_2018 != null && ren_2023 != null) {
      delta = ren_2023 - ren_2018;
    }

    // Classify
    if (cagr == null && delta == null) continue; // NoData — skip

    const isDecarbonizing = cagr != null && cagr < 0;
    const isTransitioning = delta != null && delta > 2;

    let cls: string;
    if (isDecarbonizing && isTransitioning) cls = 'Changer';
    else if (isDecarbonizing || isTransitioning) cls = 'Starter';
    else cls = 'Talker';

    results.push({ country_iso3: iso3, cls, cagr, delta });
  }

  console.log(`Classified ${results.length} countries:`);
  const counts: Record<string, number> = { Changer: 0, Starter: 0, Talker: 0 };
  for (const r of results) counts[r.cls] = (counts[r.cls] ?? 0) + 1;
  for (const [cls, n] of Object.entries(counts)) console.log(`  ${cls}: ${n}`);

  // Top Changers
  const changers = results.filter(r => r.cls === 'Changer').sort((a, b) => (a.cagr ?? 0) - (b.cagr ?? 0));
  console.log(`\nTop 10 Changers: ${changers.slice(0, 10).map(r => r.country_iso3).join(', ')}`);

  // Upsert DERIVED.CLIMATE_CLASS
  const rows = results.map(r => ({
    country_iso3:   r.country_iso3,
    indicator_code: 'DERIVED.CLIMATE_CLASS',
    year:           2023,
    value:          CLASS_VALUES[r.cls] ?? 3,
    source:         'VisualClimate derived',
  }));

  const BATCH = 500;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('country_data')
      .upsert(batch, { onConflict: 'country_iso3,indicator_code,year' });
    if (error) console.warn(`Batch error: ${error.message}`);
    else upserted += batch.length;
  }

  console.log(`\n✅ Upserted ${upserted} classification rows.`);
}

main().catch(err => { console.error(err); process.exit(1); });
