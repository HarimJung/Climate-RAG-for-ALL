import { Metadata } from 'next';
export const metadata: Metadata = {
    title: 'Climate Report Library',
    description: 'Browse authoritative climate reports from IPCC, UNEP, WMO, and more.',
};

const REPORTS = [
    {
        title: 'IPCC AR6 Synthesis Report',
        org: 'IPCC',
        year: 2023,
        description: 'Comprehensive assessment of climate change science, impacts, and mitigation strategies.',
        tags: ['Assessment', 'Global'],
    },
    {
        title: 'Emissions Gap Report 2023',
        org: 'UNEP',
        year: 2023,
        description: 'Analysis of the gap between current commitments and Paris Agreement targets.',
        tags: ['Emissions', 'Policy'],
    },
    {
        title: 'State of the Global Climate 2023',
        org: 'WMO',
        year: 2023,
        description: 'Annual overview of global climate indicators, extreme events, and socioeconomic impacts.',
        tags: ['Annual', 'Indicators'],
    },
    {
        title: 'Global Stocktake Report',
        org: 'UNFCCC',
        year: 2023,
        description: 'First global assessment of progress under the Paris Agreement.',
        tags: ['Paris Agreement', 'Progress'],
    },
    {
        title: 'Adaptation Gap Report 2023',
        org: 'UNEP',
        year: 2023,
        description: 'Assessment of global progress on adaptation planning, finance, and implementation.',
        tags: ['Adaptation', 'Finance'],
    },
    {
        title: 'Net Zero Roadmap 2023',
        org: 'IEA',
        year: 2023,
        description: 'Updated pathway for the global energy sector to reach net zero by 2050.',
        tags: ['Energy', 'Net Zero'],
    },
    {
        title: 'Global Carbon Budget 2023',
        org: 'GCP',
        year: 2023,
        description: 'Annual update of global CO2 emissions from fossil fuels, land use, and cement.',
        tags: ['Carbon', 'Data'],
    },
    {
        title: 'Climate Change and Land',
        org: 'IPCC',
        year: 2022,
        description: 'Special report on climate change, desertification, food security, and land management.',
        tags: ['Land', 'Food Security'],
    },
];

const STATS = [
    { number: '8+', label: 'Reports Indexed' },
    { number: '1000+', label: 'Pages Searchable' },
    { number: '6', label: 'Organizations' },
];

export default function LibraryPage() {
    return (
        <div className="bg-slate-950 px-4 py-20">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">
                        Climate Report Library
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg text-slate-400">
                        Browse authoritative climate reports from the world&apos;s leading institutions.
                    </p>
                </div>

                {/* Stats */}
                <div className="mb-12 grid grid-cols-3 gap-6">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center">
                            <div className="text-3xl font-bold text-emerald-400 sm:text-4xl">
                                {stat.number}
                            </div>
                            <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Reports Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {REPORTS.map((report) => (
                        <div
                            key={report.title}
                            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-emerald-500/50 hover:bg-slate-900"
                        >
                            <div className="flex items-center justify-between">
                                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                                    {report.org}
                                </span>
                                <span className="text-sm text-slate-500">{report.year}</span>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-white">{report.title}</h3>
                            <p className="mt-2 text-sm text-slate-400">{report.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {report.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-emerald-900/50 px-2.5 py-0.5 text-xs text-emerald-400"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
