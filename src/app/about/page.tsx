import { createMetaTags } from '@/components/seo/MetaTags';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = createMetaTags({
  title: 'About — VisualClimate',
  description: 'VisualClimate is a civilian-run, real-time climate accountability platform tracking 200+ countries across 60+ climate indicators.',
  path: '/about',
});

const DATA_SOURCES = [
  { name: 'World Bank WDI', url: 'https://data.worldbank.org', desc: 'GDP, CO₂ per capita, energy use, forest area, population' },
  { name: 'Climate Watch', url: 'https://www.climatewatchdata.org', desc: 'GHG emissions, NDC tracking, Paris Agreement targets' },
  { name: 'Ember Climate', url: 'https://ember-climate.org', desc: 'Electricity mix, renewable %, fossil %, carbon intensity' },
  { name: 'Our World in Data', url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions', desc: 'Cumulative CO₂, temperature attribution, methane, N₂O' },
  { name: 'ND-GAIN Index', url: 'https://gain.nd.edu/our-work/country-index/', desc: 'Country vulnerability and readiness to climate change' },
  { name: 'Climate TRACE', url: 'https://climatetrace.org', desc: 'Satellite-based sector-level GHG emissions (9 sectors)' },
  { name: 'IPCC AR6', url: 'https://www.ipcc.ch/report/ar6/', desc: 'Science basis for climate projections and risk assessment' },
  { name: 'UNEP Emissions Gap', url: 'https://www.unep.org/resources/emissions-gap-report-2024', desc: 'Annual gap between current pledges and 1.5°C pathway' },
  { name: 'Global Carbon Project', url: 'https://globalcarbonbudget.org/', desc: 'Global carbon budget, land-use emissions, ocean sinks' },
  { name: 'IEA Net Zero Roadmap', url: 'https://www.iea.org/reports/net-zero-roadmap-a-global-pathway-to-keep-the-15-0c-goal-in-reach', desc: 'Energy sector pathway to net zero by 2050' },
];

export default function AboutPage() {
  return (
    <div className="bg-[--bg-primary] px-4 py-16">
      <div className="mx-auto max-w-3xl">

        {/* Mission */}
        <div className="mb-14">
          <span className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[--accent-primary]">
            About
          </span>
          <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">
            One Question. 200+ Countries.
          </h1>
          <blockquote className="mt-8 border-l-4 border-[--accent-primary] pl-6">
            <p className="text-xl font-semibold leading-relaxed text-[--text-primary]">
              VisualClimate is a civilian-run, real-time climate accountability platform.
              We track 200+ countries across 60+ indicators to answer one question:{' '}
              <em className="text-[--accent-primary]">Is your country keeping its climate promise?</em>
            </p>
          </blockquote>
          <div className="mt-8 space-y-4 text-[--text-secondary]">
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
        <section className="mb-14">
          <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">10 Primary Data Sources</h2>
          <div className="divide-y divide-[--border-card] rounded-xl border border-[--border-card] bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
            {DATA_SOURCES.map((src) => (
              <div key={src.name} className="flex items-start gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[--accent-primary] hover:underline"
                  >
                    {src.name} ↗
                  </a>
                  <p className="mt-0.5 text-sm text-[--text-secondary]">{src.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open source */}
        <section className="mb-14 rounded-2xl border border-[--border-card] bg-white p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-4 text-xl font-semibold text-[--text-primary]">Open Source</h2>
          <p className="text-[--text-secondary]">
            VisualClimate is built with Next.js, Supabase, and D3.js. The ETL pipelines, scoring
            algorithms, and indicator definitions are publicly documented in{' '}
            <Link href="/learn?tab=methodology" className="text-[--accent-primary] hover:underline">
              the methodology page
            </Link>.
            Data is refreshed annually from primary sources. All derived indicators (DERIVED.*) are
            computed from scratch on each update cycle.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {[
              ['Tech Stack', 'Next.js 16 · Supabase · TypeScript · Tailwind'],
              ['Charts', 'D3.js (geo) · React SVG (all other charts)'],
              ['Hosting', 'Vercel · Supabase Cloud'],
            ].map(([label, val]) => (
              <div key={label} className="rounded-lg bg-[--bg-section] px-4 py-2">
                <span className="font-medium text-[--text-primary]">{label}: </span>
                <span className="text-[--text-secondary]">{val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-[--text-muted]">
          VisualClimate is an independent project and is not affiliated with the World Bank, UNEP,
          WMO, IPCC, Ember, ND-GAIN, Climate TRACE, Our World in Data, or any other cited organization.
          All data is used under their respective open data licenses. Grades and classifications are our
          own derived metrics and do not represent official positions of any government or institution.
        </p>

      </div>
    </div>
  );
}
