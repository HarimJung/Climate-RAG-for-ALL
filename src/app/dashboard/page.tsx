import { createServiceClient } from '@/lib/supabase/server';
import { CLIMATE_INDICATORS, PILOT_ISO3 } from '@/lib/constants';
import { DashboardClient } from './DashboardClient';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
    title: 'Climate Dashboard',
    description: 'Interactive climate data dashboard with CO2 emissions, renewable energy, and climate risk indicators for 6 pilot countries.',
    path: '/dashboard',
});

export const dynamic = 'force-dynamic';

async function getPilotData() {
    const data: Record<string, { iso3: string; name: string; value: number; year: number }[]> = {};
    try {
        const supabase = createServiceClient();
        const isos = [...PILOT_ISO3];

        for (const ind of CLIMATE_INDICATORS) {
            const { data: rows } = await supabase
                .from('country_data')
                .select('country_iso3, year, value')
                .eq('indicator_code', ind.code)
                .in('country_iso3', isos)
                .order('year', { ascending: false });

            if (!rows || rows.length === 0) continue;

            // Latest per country
            const seen = new Set<string>();
            const latest: { iso3: string; name: string; value: number; year: number }[] = [];
            for (const r of rows) {
                if (r.value == null || seen.has(r.country_iso3)) continue;
                seen.add(r.country_iso3);
                latest.push({ iso3: r.country_iso3, name: r.country_iso3, value: Number(r.value), year: r.year });
            }
            data[ind.code] = latest;
        }
    } catch {
        console.error('Failed to fetch pilot data');
    }
    return data;
}

export default async function DashboardPage() {
    const indicatorData = await getPilotData();
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="px-4 py-12">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">Climate Dashboard</h1>
                    <p className="mt-2 text-lg text-[--text-secondary]">
                        Explore climate indicators across 6 pilot countries
                    </p>
                </div>

                <DashboardClient indicatorData={indicatorData} lastUpdated={lastUpdated} />
            </div>
        </div>
    );
}
