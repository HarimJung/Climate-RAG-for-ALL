import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Climate Insights',
  description: 'Data-driven climate analysis across 6 pilot countries. Emissions trends, vulnerability assessments, and energy transition metrics.',
};

const insights = [
  {
    slug: 'emissions-trend',
    title: 'Emissions Trend Analysis',
    description: 'CO2 per capita trajectories for 6 countries (2000-2023). CAGR, Paris Agreement impact, decoupling scores, and energy transition speed.',
    tags: ['GHG Emissions', 'CAGR', 'Decoupling'],
    date: '2026-02-16',
  },
  {
    slug: 'climate-vulnerability',
    title: 'Climate Vulnerability Comparison',
    description: 'ND-GAIN vulnerability and readiness scores, key risk factors, and adaptation capacity across 6 pilot countries.',
    tags: ['ND-GAIN', 'Risk Profile', 'Adaptation'],
    date: '2026-02-16',
  },
];

export default function InsightsPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-[1100px]">

        {/* Header */}
        <div className="mb-14">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[--border-card] bg-white px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-secondary]">
            <span className="h-1.5 w-1.5 rounded-full bg-[--accent-primary]" />
            Insights
          </p>
          <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-[--text-primary] sm:text-4xl">
            Climate Insights
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[--text-secondary]">
            Data-driven analysis across 6 pilot countries.
          </p>
        </div>

        {/* Insight cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((item) => (
            <Link
              key={item.slug}
              href={`/insights/${item.slug}`}
              className="card-hover group flex flex-col rounded-2xl border border-[--border-card] bg-white p-6"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <time className="text-[11px] font-medium text-[--text-muted]">{item.date}</time>
              <h2 className="mt-2.5 text-[17px] font-bold text-[--text-primary] transition-colors group-hover:text-[--accent-primary]">
                {item.title}
              </h2>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[--text-secondary]">
                {item.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[--bg-section] px-2.5 py-0.5 text-[11px] font-medium text-[--text-muted]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <section className="mt-14 rounded-2xl border border-[--border-card] bg-[--bg-section] p-8 text-center">
          <p className="text-lg font-bold text-[--text-primary]">Explore the full dataset</p>
          <p className="mt-1.5 text-[14px] text-[--text-secondary]">Search any country to see its complete climate report card.</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/explore" className="rounded-lg bg-[--accent-primary] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0052CC]">
              Explore all countries
            </Link>
            <Link href="/posters" className="rounded-lg border border-[--border-card] bg-white px-5 py-2.5 text-[13px] font-semibold text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]">
              Download posters
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
