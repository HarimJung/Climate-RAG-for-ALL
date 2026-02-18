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
    <div className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-[--text-primary]">Climate Insights</h1>
      <p className="mt-3 text-lg text-[--text-secondary]">
        Data-driven analysis across 6 pilot countries
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {insights.map((item) => (
          <Link
            key={item.slug}
            href={`/insights/${item.slug}`}
            className="group rounded-xl border border-[--border-card] bg-white p-6 transition-all hover:border-[--accent-primary] hover:shadow-md"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <time className="text-xs text-[--text-muted]">{item.date}</time>
            <h2 className="mt-2 text-xl font-semibold text-[--text-primary] group-hover:text-[--accent-primary] transition-colors">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-[--text-secondary] leading-relaxed">
              {item.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[--bg-section] px-3 py-1 text-xs text-[--text-muted]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
