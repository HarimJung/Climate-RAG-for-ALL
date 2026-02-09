/**
 * scripts/seed-countries.ts
 * Fetches country data from REST Countries API and upserts into Supabase
 * Run: npx tsx scripts/seed-countries.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface RestCountry {
  name: { common: string };
  cca3: string;
  region: string;
  subregion?: string;
  latlng: [number, number];
  population: number;
  flags: { svg: string };
}

interface CountryRow {
  iso3: string;
  name: string;
  region: string;
  sub_region: string | null;
  population: number;
  lat: number;
  lng: number;
  flag_url: string;
}

async function fetchCountries(): Promise<RestCountry[]> {
  const url = 'https://restcountries.com/v3.1/all?fields=name,cca3,region,subregion,latlng,population,flags';
  console.log('Fetching countries from REST Countries API...');
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

function transformCountry(country: RestCountry): CountryRow {
  return {
    iso3: country.cca3,
    name: country.name.common,
    region: country.region,
    sub_region: country.subregion || null,
    population: country.population,
    lat: country.latlng?.[0] ?? 0,
    lng: country.latlng?.[1] ?? 0,
    flag_url: country.flags.svg,
  };
}

async function main() {
  try {
    const countries = await fetchCountries();
    console.log(`Fetched ${countries.length} countries`);

    const rows = countries.map(transformCountry);
    let inserted = 0;
    const batchSize = 50;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('countries')
        .upsert(batch, { onConflict: 'iso3' });

      if (error) {
        console.error(`Error upserting batch ${i / batchSize + 1}:`, error.message);
      } else {
        inserted += batch.length;
        console.log(`Progress: ${inserted}/${rows.length} countries upserted`);
      }
    }

    console.log(`\n✅ Complete! Upserted ${inserted} countries.`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
