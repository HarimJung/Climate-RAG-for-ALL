import Link from 'next/link';

const FOOTER_LINKS = {
  Platform: [
    { href: '/report', label: 'Report Cards' },
    { href: '/explore', label: 'Explore' },
    { href: '/posters', label: 'Posters' },
    { href: '/compare', label: 'Compare' },
  ],
  Insights: [
    { href: '/insights', label: 'All Insights' },
    { href: '/insights/emissions-trend', label: 'Emissions Trends' },
    { href: '/insights/climate-vulnerability', label: 'Climate Vulnerability' },
  ],
  Resources: [
    { href: '/methodology', label: 'Methodology' },
    { href: '/about', label: 'About' },
    { href: '/learn', label: 'Learn' },
    { href: '/guides', label: 'Guides' },
  ],
  'Data Partners': [
    { href: 'https://data.worldbank.org', label: 'World Bank', external: true },
    { href: 'https://www.climatewatchdata.org', label: 'Climate Watch', external: true },
    { href: 'https://ember-climate.org', label: 'Ember', external: true },
    { href: 'https://gain.nd.edu', label: 'ND-GAIN', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[--border-card] bg-[--bg-section]">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        {/* Brand Section */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="16" r="6" fill="#0066FF" opacity="0.8" />
              <circle cx="16" cy="10" r="6" fill="#00A67E" opacity="0.8" />
              <circle cx="22" cy="16" r="6" fill="#0066FF" opacity="0.6" />
            </svg>
            <span className="text-xl font-bold">
              <span className="text-[--text-primary]">Visual</span>
              <span className="text-[--accent-primary]">Climate</span>
            </span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[--text-secondary]">
            Open climate intelligence platform. Transforming climate data into actionable insights for 200+ countries.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[--text-muted]">{title}</h3>
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

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[--border-card] pt-8 sm:flex-row">
          <p className="text-sm text-[--text-muted]">
            &copy; 2026 VisualClimate. Data from World Bank, Climate Watch, Ember, ND-GAIN.
          </p>
          <div className="flex gap-6 text-sm text-[--text-muted]">
            <Link href="/about" className="hover:text-[--accent-primary]">About</Link>
            <a href="https://github.com/visualclimate" target="_blank" rel="noopener noreferrer" className="hover:text-[--accent-primary]">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
