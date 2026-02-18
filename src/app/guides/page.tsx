import Link from 'next/link';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
    title: 'Climate Guides',
    description: 'Expert guides on climate data, sustainability reporting, and ESG frameworks for professionals.',
    path: '/guides',
});

const GUIDES = [
    {
        slug: 'climate-data-sources',
        title: 'The Complete Guide to Free Climate Data Sources (2026)',
        description: 'Comprehensive overview of World Bank, Climate Watch, NASA POWER, NOAA, and IMF climate data APIs with practical examples.',
        readTime: '12 min read',
        category: 'Data',
    },
    {
        slug: 'issb-s2-beginners',
        title: 'ISSB S2 Climate Disclosure: A Practical Guide for Beginners',
        description: 'Understand IFRS S2 requirements, physical vs transition risks, and how to prepare your first climate disclosure.',
        readTime: '15 min read',
        category: 'Reporting',
    },
];

export default function GuidesPage() {
    return (
        <div className="px-4 py-12">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">Climate Guides</h1>
                <p className="mt-4 text-lg text-[--text-secondary]">
                    Expert guides on climate data, sustainability reporting, and ESG frameworks for professionals.
                </p>

                <div className="mt-12 space-y-6">
                    {GUIDES.map((guide) => (
                        <Link
                            key={guide.slug}
                            href={`/guides/${guide.slug}`}
                            className="group block rounded-xl border border-[--border-card] bg-white p-6 transition-all hover:border-[--accent-primary] hover:shadow-md"
                            style={{ boxShadow: 'var(--shadow-card)' }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[--accent-primary]">
                                    {guide.category}
                                </span>
                                <span className="text-sm text-[--text-muted]">{guide.readTime}</span>
                            </div>
                            <h2 className="mt-3 text-xl font-semibold text-[--text-primary] group-hover:text-[--accent-primary]">{guide.title}</h2>
                            <p className="mt-2 text-[--text-secondary]">{guide.description}</p>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[--accent-primary]">
                                Read guide
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
