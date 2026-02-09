/**
 * scripts/fetch-climatewatch.ts
 * Fetches GHG emissions data from Climate Watch API and upserts into Supabase
 * Run: npx tsx --env-file=.env.local scripts/fetch-climatewatch.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const INDICATOR_CODE = 'TOTAL_GHG';
const INDICATOR_NAME = 'Total GHG Emissions';
const INDICATOR_UNIT = 'MtCO2e';

interface ClimateWatchData {
    data: Array<{
        id: number;
        iso_code3: string;
        country: string;
        data_source: string;
        sector: string;
        gas: string;
        unit: string;
        emissions: Array<{
            year: number;
            value: number | null;
        }>;
    }>;
}

async function fetchClimateWatchData(): Promise<ClimateWatchData> {
    const url = 'https://www.climatewatchdata.org/api/v1/data/historical_emissions?gas=All%20GHG&sector=Total%20including%20LUCF&source=PIK';
    console.log('Fetching GHG emissions from Climate Watch API...');

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch Climate Watch data: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

async function getOrCreateIndicator(): Promise<number | null> {
    const { data: existing } = await supabase
        .from('indicators')
        .select('id')
        .eq('source', 'climatewatch')
        .eq('code', INDICATOR_CODE)
        .single();

    if (existing) return existing.id;

    const { data: inserted, error } = await supabase
        .from('indicators')
        .insert({ source: 'climatewatch', code: INDICATOR_CODE, name: INDICATOR_NAME, unit: INDICATOR_UNIT, category: 'emissions' })
        .select('id')
        .single();

    if (error) {
        console.error('Error inserting indicator:', error.message);
        return null;
    }
    return inserted.id;
}

async function getCountryMap(): Promise<Map<string, number>> {
    const { data, error } = await supabase.from('countries').select('id, iso3');
    if (error || !data) {
        console.error('Failed to fetch countries:', error?.message);
        return new Map();
    }
    return new Map(data.map((c: { id: number; iso3: string }) => [c.iso3.trim(), c.id]));
}

async function main() {
    try {
        const indicatorId = await getOrCreateIndicator();
        if (!indicatorId) return;
        console.log(`Indicator ID: ${indicatorId}`);

        const countryMap = await getCountryMap();
        console.log(`Loaded ${countryMap.size} countries from DB`);

        const data = await fetchClimateWatchData();
        console.log(`Fetched ${data.data.length} country records`);

        const rows: { indicator_id: number; country_id: number; year: number; value: number }[] = [];

        for (const record of data.data) {
            if (!record.iso_code3 || record.sector !== 'Total including LULUCF') continue;
            const countryId = countryMap.get(record.iso_code3);
            if (!countryId) continue;

            for (const emission of record.emissions) {
                if (emission.value === null || emission.year < 2000 || emission.year > 2023) continue;
                rows.push({
                    indicator_id: indicatorId,
                    country_id: countryId,
                    year: emission.year,
                    value: emission.value,
                });
            }
        }

        console.log(`Transformed ${rows.length} data points`);

        const batchSize = 500;
        let inserted = 0;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);

            const { error } = await supabase
                .from('indicator_values')
                .upsert(batch, { onConflict: 'indicator_id,country_id,year' });

            if (error) {
                console.error(`Error upserting batch ${i / batchSize + 1}:`, error.message);
            } else {
                inserted += batch.length;
                console.log(`Progress: ${inserted}/${rows.length} values upserted`);
            }
        }

        console.log(`\n✅ Complete! Upserted ${inserted} GHG emission values.`);
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
