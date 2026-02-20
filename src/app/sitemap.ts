import { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://visualclimate.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = [
        '',
        '/report',
        '/dashboard',
        '/compare',
        '/posters',
        '/library',
        '/guides',
        '/guides/climate-data-sources',
        '/guides/issb-s2-beginners',
        '/methodology',
    ];

    const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: (route === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
        priority: route === '' ? 1.0 : route === '/dashboard' ? 0.9 : 0.7,
    }));

    // Dynamic country + report card pages from DB
    try {
        const supabase = createServiceClient();
        const { data } = await supabase
            .from('country_data')
            .select('country_iso3')
            .limit(5000);
        const isoSet = new Set((data ?? []).map((r: { country_iso3: string }) => r.country_iso3));
        for (const iso3 of isoSet) {
            entries.push({
                url: `${BASE_URL}/country/${iso3}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
            });
        }

        // Report card pages for scored countries
        const { data: scored } = await supabase
            .from('country_data')
            .select('country_iso3')
            .eq('indicator_code', 'REPORT.TOTAL_SCORE')
            .eq('year', 2024);
        for (const row of (scored ?? []) as { country_iso3: string }[]) {
            entries.push({
                url: `${BASE_URL}/report/${row.country_iso3}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.85,
            });
        }
    } catch {
        // Fallback: skip dynamic routes on error
    }

    return entries;
}
