import { MetadataRoute } from 'next';
import { ALL_ISO3 } from '@/lib/constants';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://visualclimate.com';

export default function sitemap(): MetadataRoute.Sitemap {
    const staticRoutes = [
        '',
        '/dashboard',
        '/compare',
        '/library',
        '/guides',
        '/guides/climate-data-sources',
        '/guides/issb-s2-beginners',
    ];

    const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : route === '/dashboard' ? 0.9 : 0.7,
    }));

    for (const iso3 of ALL_ISO3) {
        entries.push({
            url: `${BASE_URL}/country/${iso3}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        });
    }

    return entries;
}
