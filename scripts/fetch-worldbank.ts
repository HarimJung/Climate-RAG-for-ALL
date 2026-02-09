/**
 * scripts/fetch-worldbank.ts
 * Fetches climate indicators from World Bank API and inserts into Supabase
 * Run: npx tsx --env-file=.env.local scripts/fetch-worldbank.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const INDICATORS = [
    { code: 'EN.ATM.CO2E.PC', name: 'CO2 emissions (metric tons per capita)', unit: 'metric tons', category: 'emissions' },
    { code: 'EG.FEC.RNEW.ZS', name: 'Renewable energy consumption (% of total)', unit: '%', category: 'energy' },
    { code: 'EN.CLC.MDAT.ZS', name: 'Population affected by droughts/floods/extreme temps (%)', unit: '%', category: 'risk' },
    { code: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)', unit: 'US$', category: 'economy' },
    { code: 'AG.LND.FRST.ZS', name: 'Forest area (% of land area)', unit: '%', category: 'land' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface WBDataPoint {
    indicator: { id: string; value: string };
    country: { id: string; value: string };
    countryiso3code: string;
    date: string;
    value: number | null;
}

async function fetchIndicatorData(code: string): Promise<WBDataPoint[]> {
    const baseUrl = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=1000&date=2000:2023`;
    const allData: WBDataPoint[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const url = `${baseUrl}&page=${page}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch ${code} page ${page}: ${response.status}`);
        }

        const json = await response.json();

        if (!json || !Array.isArray(json) || json.length < 2) {
            console.warn(`No data returned for ${code} page ${page}`);
            break;
        }

        const meta = json[0];
        const data: WBDataPoint[] = json[1] || [];

        totalPages = meta.pages;
        allData.push(...data);

        console.log(`  ${code}: Page ${page}/${totalPages} - ${data.length} records`);
        page++;

        if (page <= totalPages) await delay(300);
    } while (page <= totalPages);

    return allData;
}

async function getOrCreateIndicator(ind: typeof INDICATORS[0]): Promise<number | null> {
    // Try to find existing
    const { data: existing } = await supabase
        .from('indicators')
        .select('id')
        .eq('source', 'worldbank')
        .eq('code', ind.code)
        .single();

    if (existing) return existing.id;

    // Insert new
    const { data: inserted, error } = await supabase
        .from('indicators')
        .insert({ source: 'worldbank', code: ind.code, name: ind.name, unit: ind.unit, category: ind.category })
        .select('id')
        .single();

    if (error) {
        console.error(`Error inserting indicator ${ind.code}:`, error.message);
        return null;
    }
    return inserted.id;
}

// Build iso3 -> country id lookup
async function getCountryMap(): Promise<Map<string, number>> {
    const { data, error } = await supabase.from('countries').select('id, iso3');
    if (error || !data) {
        console.error('Failed to fetch countries:', error?.message);
        return new Map();
    }
    return new Map(data.map((c: { id: number; iso3: string }) => [c.iso3.trim(), c.id]));
}

async function processIndicator(ind: typeof INDICATORS[0], countryMap: Map<string, number>): Promise<number> {
    const indicatorId = await getOrCreateIndicator(ind);
    if (!indicatorId) return 0;

    const data = await fetchIndicatorData(ind.code);

    const rows = data
        .filter(d => d.value !== null && d.countryiso3code && countryMap.has(d.countryiso3code))
        .map(d => ({
            indicator_id: indicatorId,
            country_id: countryMap.get(d.countryiso3code)!,
            year: parseInt(d.date, 10),
            value: d.value,
        }));

    if (rows.length === 0) {
        console.log(`  No valid data for ${ind.code}`);
        return 0;
    }

    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        const { error } = await supabase
            .from('indicator_values')
            .upsert(batch, { onConflict: 'indicator_id,country_id,year' });

        if (error) {
            console.error(`  Error upserting batch:`, error.message);
        } else {
            inserted += batch.length;
        }
    }

    return inserted;
}

async function main() {
    try {
        console.log('Starting World Bank data fetch...\n');

        const countryMap = await getCountryMap();
        console.log(`Loaded ${countryMap.size} countries from DB\n`);

        let totalInserted = 0;

        for (let i = 0; i < INDICATORS.length; i++) {
            const ind = INDICATORS[i];
            console.log(`[${i + 1}/${INDICATORS.length}] Processing ${ind.code}...`);

            const count = await processIndicator(ind, countryMap);
            totalInserted += count;
            console.log(`  ✓ Inserted ${count} values\n`);

            if (i < INDICATORS.length - 1) await delay(300);
        }

        console.log(`\n✅ Complete! Total inserted: ${totalInserted} indicator values.`);
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
