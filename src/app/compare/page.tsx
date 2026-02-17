import { createServiceClient } from '@/lib/supabase/server';
import { CLIMATE_INDICATORS } from '@/lib/constants';
import { CompareClient } from './CompareClient';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
    title: 'Compare Countries',
    description: 'Side-by-side climate risk comparison across countries with citable data and AI-generated briefs.',
    path: '/compare',
});

export const dynamic = 'force-dynamic';

export interface CountryCompareData {
    iso3: string;
    name: string;
    region: string;
    sub_region: string | null;
    population: number;
    flag_url: string;
    indicators: Record<string, { value: number; year: number } | null>;
    trend: { year: number; value: number }[];
}

async function getCompareData(iso3List: string[]): Promise<CountryCompareData[]> {
  try {
    const supabase = createServiceClient();

    // Get countries
    const { data: countries } = await supabase
        .from('countries')
        .select('id, iso3, name, region, sub_region, population, flag_url')
        .in('iso3', iso3List);

    if (!countries || countries.length === 0) return [];

    // Get indicators
    const allCodes = [...CLIMATE_INDICATORS.map(i => i.code), 'TOTAL_GHG'];
    const { data: indicators } = await supabase
        .from('indicators')
        .select('id, code')
        .in('code', allCodes);

    if (!indicators) return countries.map((c: { iso3: string; name: string; region: string; sub_region: string | null; population: number; flag_url: string }) => ({
        ...c, iso3: c.iso3.trim(), indicators: {}, trend: [],
    }));

    const countryIds = countries.map((c: { id: number }) => c.id);
    const indicatorIds = indicators.map((i: { id: number }) => i.id);

    // Get all values for these countries and indicators
    const { data: values } = await supabase
        .from('indicator_values')
        .select('indicator_id, country_id, year, value')
        .in('country_id', countryIds)
        .in('indicator_id', indicatorIds)
        .order('year', { ascending: false });

    // Build per-country data
    const result: CountryCompareData[] = countries.map((c: { id: number; iso3: string; name: string; region: string; sub_region: string | null; population: number; flag_url: string }) => {
        const countryValues = (values || []).filter((v: { country_id: number }) => v.country_id === c.id);

        // Latest per indicator
        const indData: Record<string, { value: number; year: number } | null> = {};
        for (const code of allCodes) {
            const indId = indicators.find((i: { code: string }) => i.code === code)?.id;
            if (!indId) { indData[code] = null; continue; }
            const latest = countryValues.find((v: { indicator_id: number }) => v.indicator_id === indId);
            indData[code] = latest ? { value: latest.value, year: latest.year } : null;
        }

        // GHG/CO2 trend
        const ghgCodes = new Set(['TOTAL_GHG', 'EN.ATM.CO2E.PC']);
        const ghgIds = indicators.filter((i: { code: string }) => ghgCodes.has(i.code)).map((i: { id: number }) => i.id);
        const trendMap = new Map<number, number>();
        for (const v of countryValues.filter((v: { indicator_id: number }) => ghgIds.includes(v.indicator_id))) {
            if (!trendMap.has(v.year)) trendMap.set(v.year, v.value);
        }
        const trend = Array.from(trendMap.entries())
            .map(([year, value]) => ({ year, value }))
            .sort((a, b) => a.year - b.year);

        return {
            iso3: c.iso3.trim(),
            name: c.name,
            region: c.region,
            sub_region: c.sub_region,
            population: c.population,
            flag_url: c.flag_url,
            indicators: indData,
            trend,
        };
    });

    return result;
  } catch {
    return [];
  }
}

// Get all countries for the selector
async function getAllCountries() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
        .from('countries')
        .select('iso3, name, region')
        .order('name');
    return (data || []).map((c: { iso3: string; name: string; region: string }) => ({
        iso3: c.iso3.trim(), name: c.name, region: c.region,
    }));
  } catch {
    return [];
  }
}

interface ComparePageProps {
    searchParams: Promise<{ countries?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
    const params = await searchParams;
    const countriesParam = params.countries || '';
    const iso3List = countriesParam
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 5); // max 5

    const [compareData, allCountries] = await Promise.all([
        iso3List.length > 0 ? getCompareData(iso3List) : Promise.resolve([]),
        getAllCountries(),
    ]);

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">
                        Climate Risk Comparison
                    </h1>
                    <p className="mt-2 text-lg text-slate-400">
                        Compare climate indicators across countries. Generate a citable brief in seconds.
                    </p>
                </div>
                <CompareClient
                    initialData={compareData}
                    allCountries={allCountries}
                    selectedIso3={iso3List}
                />
            </div>
        </div>
    );
}
