import { createServiceClient } from '@/lib/supabase/server';
import { CLIMATE_INDICATORS } from '@/lib/constants';
import { CompareClient } from './CompareClient';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
    title: 'Compare Countries',
    description: 'Side-by-side climate indicator comparison across countries with real data from World Bank, Ember, and ND-GAIN.',
    path: '/compare',
});

export const dynamic = 'force-dynamic';

export interface CountryCompareData {
    iso3: string;
    name: string;
    indicators: Record<string, { value: number; year: number } | null>;
}

async function getCompareData(iso3List: string[]): Promise<CountryCompareData[]> {
  try {
    const supabase = createServiceClient();
    const codes = CLIMATE_INDICATORS.map(i => i.code);

    const { data: rows } = await supabase
        .from('country_data')
        .select('country_iso3, indicator_code, year, value')
        .in('country_iso3', iso3List)
        .in('indicator_code', codes)
        .order('year', { ascending: false });

    const COUNTRY_NAMES: Record<string, string> = {
        KOR: 'South Korea', USA: 'United States', DEU: 'Germany',
        BRA: 'Brazil', NGA: 'Nigeria', BGD: 'Bangladesh',
    };

    return iso3List.map(iso3 => {
        const countryRows = (rows || []).filter(r => r.country_iso3 === iso3);
        const indicators: Record<string, { value: number; year: number } | null> = {};

        for (const code of codes) {
            const row = countryRows.find(r => r.indicator_code === code && r.value != null);
            indicators[code] = row ? { value: Number(row.value), year: row.year } : null;
        }

        return {
            iso3,
            name: COUNTRY_NAMES[iso3] || iso3,
            indicators,
        };
    });
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
    const countriesParam = params.countries || 'KOR,USA';
    const iso3List = countriesParam
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 5);

    const [compareData, allCountries] = await Promise.all([
        iso3List.length > 0 ? getCompareData(iso3List) : Promise.resolve([]),
        getAllCountries(),
    ]);

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">
                        Compare Countries
                    </h1>
                    <p className="mt-2 text-lg text-[--text-secondary]">
                        Side-by-side climate indicator comparison across countries
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
