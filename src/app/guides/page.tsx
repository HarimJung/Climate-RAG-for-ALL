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
        <div className="px-6 py-20">
            <div className="mx-auto max-w-[1100px]">

                {/* Header */}
                <div className="mb-14">
                    <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[--border-card] bg-white px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-secondary]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[--accent-primary]" />
                        Guides
                    </p>
                    <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-[--text-primary] sm:text-4xl">
                        Climate Guides
                    </h1>
                    <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[--text-secondary]">
                        Expert guides on climate data, sustainability reporting, and ESG frameworks for professionals.
                    </p>
                </div>

                {/* Guide cards */}
                <div className="space-y-4">
                    {GUIDES.map((guide) => (
                        <Link
                            key={guide.slug}
                            href={`/guides/${guide.slug}`}
                            className="card-hover group block rounded-2xl border border-[--border-card] bg-white p-6"
                            style={{ boxShadow: 'var(--shadow-card)' }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[--accent-primary]">
                                    {guide.category}
                                </span>
                                <span className="text-[12px] text-[--text-muted]">{guide.readTime}</span>
                            </div>
                            <h2 className="mt-3 text-[17px] font-bold text-[--text-primary] transition-colors group-hover:text-[--accent-primary]">
                                {guide.title}
                            </h2>
                            <p className="mt-2 text-[14px] leading-relaxed text-[--text-secondary]">{guide.description}</p>
                            <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[--accent-primary]">
                                Read guide
                                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Bottom CTA */}
                <section className="mt-14 rounded-2xl border border-[--border-card] bg-[--bg-section] p-8 text-center">
                    <p className="text-lg font-bold text-[--text-primary]">See the data in action</p>
                    <p className="mt-1.5 text-[14px] text-[--text-secondary]">Explore country report cards powered by the data sources described in these guides.</p>
                    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link href="/explore" className="rounded-lg bg-[--accent-primary] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0052CC]">
                            Explore all countries
                        </Link>
                        <Link href="/methodology" className="rounded-lg border border-[--border-card] bg-white px-5 py-2.5 text-[13px] font-semibold text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]">
                            Read methodology
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
