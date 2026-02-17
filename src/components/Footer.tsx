import Link from 'next/link';

const FOOTER_LINKS = {
  Product: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/compare', label: 'Compare' },
    { href: '/insights', label: 'Insights' },
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
    <footer className="border-t border-[--border-card] bg-[--bg-section]">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold">
              <span className="text-[--text-primary]">Visual</span>
              <span className="text-[--accent-primary]">Climate</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[--text-secondary]">
              Open climate intelligence platform. 6 pilot countries, expanding to 250.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-[--text-muted]">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[--text-secondary] transition-colors hover:text-[--accent-primary]"
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[--border-card] pt-8 sm:flex-row">
          <p className="text-sm text-[--text-muted]">
            &copy; 2026 VisualClimate. Data from World Bank, Climate Watch, Ember, ND-GAIN.
          </p>
          <div className="flex gap-6 text-sm text-[--text-muted]">
            <span>Built with Next.js + Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
