import { createMetaTags } from '@/components/seo/MetaTags';
import Link from 'next/link';

export const metadata = createMetaTags({
    title: 'Climate Report Library',
    description: 'Browse authoritative climate reports from IPCC, UNEP, WMO, and more.',
    path: '/library',
});

const REPORTS = [
    {
        title: 'IPCC AR6 Synthesis Report',
        org: 'IPCC',
        year: 2023,
        description: 'Comprehensive assessment of climate change science, impacts, and mitigation strategies.',
        tags: ['Assessment', 'Global'],
        url: 'https://www.ipcc.ch/report/ar6/syr/',
    },
    {
        title: 'Emissions Gap Report 2024',
        org: 'UNEP',
        year: 2024,
        description: 'Analysis of the gap between current commitments and Paris Agreement targets.',
        tags: ['Emissions', 'Policy'],
        url: 'https://www.unep.org/resources/emissions-gap-report-2024',
    },
    {
        title: 'State of the Global Climate',
        org: 'WMO',
        year: 2024,
        description: 'Annual overview of global climate indicators, extreme events, and socioeconomic impacts.',
        tags: ['Annual', 'Indicators'],
        url: 'https://wmo.int/publication-series/state-of-global-climate',
    },
    {
        title: 'Global Stocktake Report',
        org: 'UNFCCC',
        year: 2023,
        description: 'First global assessment of progress under the Paris Agreement.',
        tags: ['Paris Agreement', 'Progress'],
        url: 'https://unfccc.int/topics/global-stocktake',
    },
    {
        title: 'Adaptation Gap Report 2023',
        org: 'UNEP',
        year: 2023,
        description: 'Assessment of global progress on adaptation planning, finance, and implementation.',
        tags: ['Adaptation', 'Finance'],
        url: 'https://www.unep.org/resources/adaptation-gap-report-2023',
    },
    {
        title: 'Net Zero Roadmap 2023',
        org: 'IEA',
        year: 2023,
        description: 'Updated pathway for the global energy sector to reach net zero by 2050.',
        tags: ['Energy', 'Net Zero'],
        url: 'https://www.iea.org/reports/net-zero-roadmap-a-global-pathway-to-keep-the-15-0c-goal-in-reach',
    },
    {
        title: 'Global Carbon Budget 2023',
        org: 'GCP',
        year: 2023,
        description: 'Annual update of global CO2 emissions from fossil fuels, land use, and cement.',
        tags: ['Carbon', 'Data'],
        url: 'https://globalcarbonbudget.org/',
    },
    {
        title: 'Climate Change and Land',
        org: 'IPCC',
        year: 2022,
        description: 'Special report on climate change, desertification, food security, and land management.',
        tags: ['Land', 'Food Security'],
        url: 'https://www.ipcc.ch/srccl/',
    },
];

export default function LibraryPage() {
    return (
        <div className="px-6 py-20">
            <div className="mx-auto max-w-[1100px]">

                {/* Header */}
                <div className="mb-14">
                    <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[--border-card] bg-white px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-secondary]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[--accent-primary]" />
                        Library
                    </p>
                    <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-[--text-primary] sm:text-4xl">
                        Climate Report Library
                    </h1>
                    <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[--text-secondary]">
                        Authoritative climate reports from the world&apos;s leading institutions.
                    </p>
                </div>

                {/* Stats */}
                <div className="mb-14 grid grid-cols-3 gap-4">
                    {[
                        { value: '8+', label: 'Reports indexed' },
                        { value: '250', label: 'Countries tracked' },
                        { value: '6+', label: 'Organizations' },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-[--border-card] bg-white p-5 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
                            <p className="font-mono text-2xl font-bold text-[--accent-primary] sm:text-3xl">
                                {stat.value}
                            </p>
                            <p className="mt-1 text-[12px] text-[--text-muted]">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Report grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {REPORTS.map((report) => (
                        <a
                            key={report.title}
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-hover group flex flex-col rounded-2xl border border-[--border-card] bg-white p-5"
                            style={{ boxShadow: 'var(--shadow-card)' }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="rounded-full bg-[--bg-section] px-2.5 py-0.5 text-[11px] font-semibold text-[--text-secondary]">
                                    {report.org}
                                </span>
                                <span className="text-[12px] text-[--text-muted]">{report.year}</span>
                            </div>
                            <h3 className="mt-3.5 text-[15px] font-bold leading-snug text-[--text-primary] transition-colors group-hover:text-[--accent-primary]">
                                {report.title}
                            </h3>
                            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[--text-secondary]">{report.description}</p>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {report.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[--accent-primary]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </a>
                    ))}
                </div>

                {/* Bottom CTA */}
                <section className="mt-14 rounded-2xl border border-[--border-card] bg-[--bg-section] p-8 text-center">
                    <p className="text-lg font-bold text-[--text-primary]">Use the data these reports provide</p>
                    <p className="mt-1.5 text-[14px] text-[--text-secondary]">Search any country to see how it performs across 67 climate indicators.</p>
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
