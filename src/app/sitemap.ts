import { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://visualclimate.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = [
        '',
        '/dashboard',
        '/compare',
        '/posters',
        '/library',
        '/guides',
        '/guides/climate-data-sources',
        '/guides/issb-s2-beginners',
    ];

    const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: (route === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
        priority: route === '' ? 1.0 : route === '/dashboard' ? 0.9 : 0.7,
    }));

    // Dynamic country pages from DB
    try {
        const supabase = createServiceClient();
        // Only countries that have data in country_data (have at least 1 row)
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
    } catch {
        // Fallback: skip dynamic routes on error
    }

    return entries;
}
