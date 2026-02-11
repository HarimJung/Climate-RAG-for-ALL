import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://visualclimate.io';

export default function sitemap(): MetadataRoute.Sitemap {
    const staticRoutes = [
        '',
        '/dashboard',
        '/library',
        '/guides',
        '/guides/climate-data-sources',
        '/guides/issb-s2-beginners',
        '/compare',
    ];

    const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : route === '/dashboard' ? 0.9 : 0.7,
    }));

    return entries;
}
