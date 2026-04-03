import Link from 'next/link';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
  title: 'Learn — Climate Data, Guides & Methodology',
  description: 'Climate insights, authoritative reports, expert guides, and the methodology behind the VisualClimate Climate Report Card.',
  path: '/learn',
});

const SECTIONS = [
  {
    href: '/insights',
    title: 'Insights',
    description: 'Data-driven analysis of emissions trends, vulnerability, and climate action across countries.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
  },
  {
    href: '/guides',
    title: 'Guides',
    description: 'Expert guides on climate data sources, ISSB S2 disclosure, and sustainability reporting.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    href: '/methodology',
    title: 'Methodology',
    description: 'How we score countries: 9 indicators across 5 domains, normalization, and grade thresholds.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    href: '/library',
    title: 'Library',
    description: 'Authoritative climate reports from IPCC, UNEP, WMO, IEA, and other leading institutions.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
  },
];

export default function LearnPage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">Learn</h1>
          <p className="mt-2 text-lg text-[--text-secondary]">
            Climate insights, key reports, expert guides, and our scoring methodology
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-xl border border-[--border-card] bg-white p-6 transition-all hover:border-[--accent-primary] hover:shadow-md"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[--accent-primary]">
                {section.icon}
              </div>
              <h2 className="text-xl font-semibold text-[--text-primary] group-hover:text-[--accent-primary] transition-colors">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[--text-secondary]">
                {section.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[--accent-primary]">
                Explore
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-[--border-card] bg-[--bg-section] p-8 text-center">
          <p className="text-lg font-semibold text-[--text-primary]">Put your knowledge into action</p>
          <p className="mt-1 text-sm text-[--text-secondary]">Search any country to see its climate report card, or download a poster to share.</p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/explore" className="rounded-lg bg-[--accent-primary] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0052CC]">
              Explore all countries
            </Link>
            <Link href="/posters" className="rounded-lg border border-[--border-card] bg-white px-6 py-3 text-sm font-semibold text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]">
              Download posters
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
