import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Climate Intelligence for Sustainability Professionals',
  description: 'Open climate data platform. 200 countries. Real-time indicators for ESG analysts, consultants, and sustainability managers.',
};

const VALUE_CARDS = [
  {
    title: '200 Country Profiles',
    description: 'Comprehensive climate indicators, emissions data, and policy analysis for every nation.',
  },
  {
    title: 'Report Library',
    description: 'Browse authoritative climate reports from IPCC, UNEP, WMO, and more.',
  },
  {
    title: 'Live Dashboard',
    description: 'Interactive visualizations of CO2 emissions, renewable energy, and climate risks.',
  },
];

const PERSONAS = [
  {
    role: 'ESG Analysts',
    description: 'Track climate metrics across your portfolio companies. Compare country-level risks for investment decisions.',
  },
  {
    role: 'Sustainability Consultants',
    description: 'Access reliable data sources for client reports. ISSB S2 compliance made easier.',
  },
  {
    role: 'Corporate Sustainability Teams',
    description: 'Monitor climate risks in your supply chain. Generate data-backed sustainability reports.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-36">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00d4ff]/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Climate Intelligence for{' '}
            <span className="bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">
              Sustainability Professionals
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[--text-secondary] sm:text-xl">
            Open climate data platform. 200 countries. Real-time data.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[--accent-primary] px-8 py-4 text-lg font-semibold text-[--bg-primary] transition-all hover:brightness-110 hover:shadow-lg hover:shadow-[#00d4ff]/25"
            >
              Explore Dashboard
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-full border border-[--border-card] px-8 py-4 text-lg font-semibold transition-colors hover:border-[--accent-primary]/50 hover:bg-white/5"
            >
              Compare Countries
            </Link>
          </div>
        </div>
      </section>

      {/* Value Cards */}
      <section className="border-t border-[--border-card] px-4 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-6 md:grid-cols-3">
            {VALUE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-[--border-card] bg-[--bg-card] p-6 backdrop-blur transition-all hover:border-[--accent-primary]/30"
              >
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="mt-2 text-[--text-secondary]">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is this for? */}
      <section className="border-t border-[--border-card] px-4 py-20">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Who is this for?
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PERSONAS.map((persona) => (
              <div
                key={persona.role}
                className="rounded-xl border border-[--border-card] bg-[--bg-card] p-6 backdrop-blur"
              >
                <h3 className="text-xl font-semibold text-[--accent-primary]">{persona.role}</h3>
                <p className="mt-2 text-[--text-secondary]">{persona.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
