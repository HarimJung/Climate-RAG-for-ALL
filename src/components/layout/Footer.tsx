import Link from 'next/link';

const FOOTER_LINKS = {
    Product: [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/library', label: 'Report Library' },
        { href: '/chat', label: 'AI Search' },
        { href: '/pricing', label: 'Pricing' },
    ],
    Resources: [
        { href: '/guides', label: 'Guides' },
        { href: '/guides/climate-data-sources', label: 'Data Sources' },
        { href: '/guides/issb-s2-beginners', label: 'ISSB S2 Guide' },
    ],
    Data: [
        { href: 'https://data.worldbank.org', label: 'World Bank', external: true },
        { href: 'https://www.climatewatchdata.org', label: 'Climate Watch', external: true },
        { href: 'https://www.ipcc.ch', label: 'IPCC', external: true },
    ],
};

export function Footer() {
    return (
        <footer className="border-t border-slate-800 bg-slate-900">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="text-xl font-bold">
                            <span className="text-white">Visual</span>
                            <span className="text-emerald-500">Climate</span>
                        </Link>
                        <p className="mt-3 text-sm leading-relaxed text-slate-400">
                            Open climate intelligence platform. Explore data, read reports, ask AI.
                        </p>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
                            <ul className="mt-4 space-y-3">
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-slate-500 transition-colors hover:text-white"
                                            {...('external' in link ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
                    <p className="text-sm text-slate-500">
                        © 2026 VisualClimate. Data from World Bank, Climate Watch, IPCC.
                    </p>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <span>Built with Next.js + Supabase</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
