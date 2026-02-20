import { createMetaTags } from '@/components/seo/MetaTags';

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

const STATS = [
    { number: '8+', label: 'Reports Indexed' },
    { number: '200+', label: 'Countries Tracked' },
    { number: '6+', label: 'Organizations' },
];

export default function LibraryPage() {
    return (
        <div className="px-4 py-20">
            <div className="mx-auto max-w-6xl">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">
                        Climate Report Library
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg text-[--text-secondary]">
                        Browse authoritative climate reports from the world&apos;s leading institutions.
                    </p>
                </div>

                <div className="mb-12 grid grid-cols-3 gap-6">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-[--border-card] bg-white p-6 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
                            <div className="text-3xl font-bold text-[--accent-primary] sm:text-4xl">
                                {stat.number}
                            </div>
                            <div className="mt-1 text-sm text-[--text-secondary]">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {REPORTS.map((report) => (
                        <a
                            key={report.title}
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block rounded-xl border border-[--border-card] bg-white p-6 transition-all hover:border-[--accent-primary] hover:shadow-md"
                            style={{ boxShadow: 'var(--shadow-card)' }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="rounded-full bg-[--bg-section] px-3 py-1 text-xs font-medium text-[--text-secondary]">
                                    {report.org}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-[--text-muted]">{report.year}</span>
                                    {/* External link icon */}
                                    <svg className="h-3.5 w-3.5 text-[--text-muted] opacity-0 transition-opacity group-hover:opacity-100"
                                        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-[--text-primary] group-hover:text-[--accent-primary] transition-colors">
                                {report.title}
                            </h3>
                            <p className="mt-2 text-sm text-[--text-secondary]">{report.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {report.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-[--accent-primary]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
