import { createServiceClient } from '@/lib/supabase/server';
import { CLIMATE_INDICATORS } from '@/lib/constants';
import { DashboardClient } from './DashboardClient';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
    title: 'Climate Dashboard',
    description: 'Interactive global climate data dashboard with CO2 emissions, renewable energy, and climate risk indicators for 200+ countries.',
    path: '/dashboard',
});

export const dynamic = 'force-dynamic';

async function getIndicatorData() {
    const supabase = createServiceClient();
    const data: Record<string, { iso3: string; name: string; value: number; year: number }[]> = {};

    // Get all countries
    const { data: countries } = await supabase
        .from('countries')
        .select('id, iso3, name');

    if (!countries) return data;
    const countryMap = new Map(countries.map((c: { id: number; iso3: string; name: string }) => [c.id, { iso3: c.iso3.trim(), name: c.name }]));

    // Get all indicators (including TOTAL_GHG from climatewatch)
    const allCodes = [...CLIMATE_INDICATORS.map(i => i.code), 'TOTAL_GHG'];
    const { data: indicators } = await supabase
        .from('indicators')
        .select('id, code')
        .in('code', allCodes);

    if (!indicators) return data;

    for (const ind of indicators) {
        const { data: values } = await supabase
            .from('indicator_values')
            .select('country_id, year, value')
            .eq('indicator_id', ind.id)
            .order('year', { ascending: false });

        if (!values || values.length === 0) continue;

        // Group by country, take latest year
        const latestByCountry = new Map<number, { country_id: number; year: number; value: number }>();
        for (const v of values) {
            if (!latestByCountry.has(v.country_id)) {
                latestByCountry.set(v.country_id, v);
            }
        }

        data[ind.code] = Array.from(latestByCountry.values())
            .map(v => {
                const country = countryMap.get(v.country_id);
                if (!country) return null;
                return { iso3: country.iso3, name: country.name, value: v.value, year: v.year };
            })
            .filter((v): v is NonNullable<typeof v> => v !== null);
    }

    return data;
}

export default async function DashboardPage() {
    const indicatorData = await getIndicatorData();
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="bg-slate-950 px-4 py-12">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">Climate Dashboard</h1>
                    <p className="mt-2 text-lg text-slate-400">
                        Explore climate indicators across 200+ countries
                    </p>
                </div>

                <DashboardClient indicatorData={indicatorData} lastUpdated={lastUpdated} />
            </div>
        </div>
    );
}
