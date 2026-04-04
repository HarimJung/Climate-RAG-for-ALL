import Link from 'next/link';

const FOOTER_LINKS = {
  Platform: [
    { href: '/report', label: 'Report Cards' },
    { href: '/explore', label: 'Explore' },
    { href: '/posters', label: 'Posters' },
  ],
  Learn: [
    { href: '/insights', label: 'Insights' },
    { href: '/guides', label: 'Guides' },
    { href: '/library', label: 'Library' },
    { href: '/learn', label: 'All Resources' },
  ],
  About: [
    { href: '/methodology', label: 'Methodology' },
    { href: '/about', label: 'About Us' },
  ],
  'Data Sources': [
    { href: 'https://data.worldbank.org', label: 'World Bank WDI', external: true },
    { href: 'https://ember-climate.org', label: 'Ember Climate', external: true },
    { href: 'https://gain.nd.edu', label: 'ND-GAIN', external: true },
    { href: 'https://climatetrace.org', label: 'Climate TRACE', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[--border-card] bg-[--bg-section]">
      <div className="mx-auto max-w-[1200px] px-6 py-12 sm:py-14">
        {/* Brand */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="16" r="6" fill="#0066FF" opacity="0.85" />
              <circle cx="16" cy="10" r="6" fill="#00A67E" opacity="0.85" />
              <circle cx="22" cy="16" r="6" fill="#0066FF" opacity="0.65" />
            </svg>
            <span className="text-[14px] font-semibold tracking-[-0.01em]">
              <span className="text-[--text-primary]">Visual</span>
              <span className="font-bold text-[--accent-primary]">Climate</span>
            </span>
          </Link>
          <p className="mt-2.5 max-w-xs text-[12px] leading-relaxed text-[--text-muted]">
            Open climate intelligence for 250 countries.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">{title}</h3>
              <ul className="mt-2.5 space-y-1.5">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[12px] text-[--text-secondary] transition-colors hover:text-[--accent-primary]"
                      {...('external' in link ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                      {'external' in link && (
                        <span className="ml-0.5 text-[9px] text-[--text-muted]">&#8599;</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[--border-card] pt-5 sm:flex-row">
          <p className="text-[11px] text-[--text-muted]">
            &copy; {new Date().getFullYear()} VisualClimate
          </p>
          <div className="flex gap-4 text-[11px] text-[--text-muted]">
            <Link href="/about" className="transition-colors hover:text-[--accent-primary]">About</Link>
            <Link href="/methodology" className="transition-colors hover:text-[--accent-primary]">Methodology</Link>
            <a href="https://github.com/visualclimate" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[--accent-primary]">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
