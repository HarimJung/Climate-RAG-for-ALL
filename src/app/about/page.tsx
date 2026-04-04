import { createMetaTags } from '@/components/seo/MetaTags';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = createMetaTags({
  title: 'About — VisualClimate',
  description: 'VisualClimate is a civilian-run, real-time climate accountability platform tracking 200+ countries across 60+ climate indicators.',
  path: '/about',
});

const DATA_SOURCES = [
  { name: 'World Bank WDI', url: 'https://data.worldbank.org', desc: 'GDP, CO2 per capita, energy use, forest area, population' },
  { name: 'Climate Watch', url: 'https://www.climatewatchdata.org', desc: 'GHG emissions, NDC tracking, Paris Agreement targets' },
  { name: 'Ember Climate', url: 'https://ember-climate.org', desc: 'Electricity mix, renewable %, fossil %, carbon intensity' },
  { name: 'Our World in Data', url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions', desc: 'Cumulative CO2, temperature attribution, methane, N2O' },
  { name: 'ND-GAIN Index', url: 'https://gain.nd.edu/our-work/country-index/', desc: 'Country vulnerability and readiness to climate change' },
  { name: 'Climate TRACE', url: 'https://climatetrace.org', desc: 'Satellite-based sector-level GHG emissions (9 sectors)' },
  { name: 'IPCC AR6', url: 'https://www.ipcc.ch/report/ar6/', desc: 'Science basis for climate projections and risk assessment' },
  { name: 'UNEP Emissions Gap', url: 'https://www.unep.org/resources/emissions-gap-report-2024', desc: 'Annual gap between current pledges and 1.5C pathway' },
  { name: 'Global Carbon Project', url: 'https://globalcarbonbudget.org/', desc: 'Global carbon budget, land-use emissions, ocean sinks' },
  { name: 'IEA Net Zero Roadmap', url: 'https://www.iea.org/reports/net-zero-roadmap-a-global-pathway-to-keep-the-15-0c-goal-in-reach', desc: 'Energy sector pathway to net zero by 2050' },
];

export default function AboutPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-3xl">

        {/* Mission */}
        <div className="mb-16">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[--border-card] bg-white px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-secondary]">
            <span className="h-1.5 w-1.5 rounded-full bg-[--accent-primary]" />
            About
          </p>
          <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-[--text-primary] sm:text-4xl">
            One question. 250 countries.
          </h1>
          <blockquote className="mt-8 border-l-[3px] border-[--accent-primary] pl-5">
            <p className="text-lg font-medium leading-relaxed text-[--text-primary]">
              VisualClimate is a civilian-run, real-time climate accountability platform.
              We track 250 countries across 67 indicators to answer one question:{' '}
              <em className="text-[--accent-primary]">Is your country keeping its climate promise?</em>
            </p>
          </blockquote>
          <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-[--text-secondary]">
            <p>
              Every chart on this platform is built from publicly available data — from the World Bank,
              Ember Climate, Our World in Data, ND-GAIN, and Climate TRACE. We aggregate, normalize,
              and visualize this data to make climate accountability accessible to anyone.
            </p>
            <p>
              The Climate Report Card grades countries on five dimensions: emissions efficiency, energy
              transition, economic decoupling, historical responsibility, and climate resilience. Grades
              are relative — they measure each country against the full global distribution, not against
              a fixed climate-safe threshold.
            </p>
            <p>
              Charts are designed to be downloaded and shared directly on LinkedIn. No subscription
              required. No paywall. Every poster is free.
            </p>
          </div>
        </div>

        {/* Data sources */}
        <section className="mb-16">
          <h2 className="mb-5 text-lg font-bold text-[--text-primary]">10 Primary Data Sources</h2>
          <div className="divide-y divide-[--border-card] rounded-2xl border border-[--border-card] bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
            {DATA_SOURCES.map((src) => (
              <div key={src.name} className="px-5 py-3.5">
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-semibold text-[--accent-primary] hover:underline"
                >
                  {src.name}&thinsp;&#8599;
                </a>
                <p className="mt-0.5 text-[13px] text-[--text-secondary]">{src.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open source */}
        <section className="mb-16 rounded-2xl border border-[--border-card] bg-white p-7" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-3 text-lg font-bold text-[--text-primary]">Open Source</h2>
          <p className="text-[15px] leading-relaxed text-[--text-secondary]">
            VisualClimate is built with Next.js, Supabase, and D3.js. The ETL pipelines, scoring
            algorithms, and indicator definitions are publicly documented in{' '}
            <Link href="/methodology" className="text-[--accent-primary] hover:underline">
              the methodology page
            </Link>.
            Data is refreshed annually from primary sources.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              'Next.js 16', 'Supabase', 'TypeScript', 'Tailwind CSS', 'D3.js', 'Vercel',
            ].map((tech) => (
              <span key={tech} className="rounded-full bg-[--bg-section] px-3 py-1 text-[12px] font-medium text-[--text-secondary]">
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <p className="text-[12px] leading-relaxed text-[--text-muted]">
          VisualClimate is an independent project and is not affiliated with the World Bank, UNEP,
          WMO, IPCC, Ember, ND-GAIN, Climate TRACE, Our World in Data, or any other cited organization.
          All data is used under their respective open data licenses. Grades and classifications are our
          own derived metrics and do not represent official positions of any government or institution.
        </p>

        {/* Bottom CTA */}
        <section className="mt-14 rounded-2xl border border-[--border-card] bg-[--bg-section] p-8 text-center">
          <p className="text-lg font-bold text-[--text-primary]">Ready to explore the data?</p>
          <p className="mt-1.5 text-[14px] text-[--text-secondary]">Search any country to see its climate report card.</p>
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
