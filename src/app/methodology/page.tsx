import Link from 'next/link';
import { createMetaTags } from '@/components/seo/MetaTags';
import { Metadata } from 'next';

export const metadata: Metadata = createMetaTags({
  title: 'Methodology — Climate Report Card',
  description: 'How VisualClimate calculates the Climate Report Card: 5 domains, 9 indicators, min-max normalization, and grade thresholds.',
  path: '/methodology',
});

const DOMAINS = [
  {
    name: 'Emissions',
    weight: '30%',
    color: '#E5484D',
    indicators: [
      { code: 'EN.GHG.CO2.PC.CE.AR5', label: 'CO2 per capita', source: 'World Bank / Climate Watch', direction: 'Lower is better', weight: '50%' },
      { code: 'DERIVED.CO2_PER_GDP',   label: 'CO2 per GDP',    source: 'Derived (CO2 / GDP/capita)', direction: 'Lower is better', weight: '30%' },
      { code: 'DERIVED.DECOUPLING',    label: 'Decoupling index', source: 'Derived (GDP CAGR - CO2 CAGR)', direction: 'Higher is better', weight: '20%' },
    ],
  },
  {
    name: 'Energy',
    weight: '25%',
    color: '#0066FF',
    indicators: [
      { code: 'EMBER.RENEWABLE.PCT',    label: 'Renewable electricity %', source: 'Ember', direction: 'Higher is better', weight: '60%' },
      { code: 'EMBER.CARBON.INTENSITY', label: 'Grid carbon intensity',    source: 'Ember', direction: 'Lower is better', weight: '40%' },
    ],
  },
  {
    name: 'Economy',
    weight: '15%',
    color: '#8B5CF6',
    indicators: [
      { code: 'NY.GDP.PCAP.CD',      label: 'GDP per capita',  source: 'World Bank', direction: 'Higher enables climate action', weight: '50%' },
      { code: 'DERIVED.CO2_PER_GDP', label: 'CO2 per GDP',     source: 'Derived',    direction: 'Lower is better', weight: '50%' },
    ],
  },
  {
    name: 'Responsibility',
    weight: '15%',
    color: '#F59E0B',
    indicators: [
      { code: 'OWID.SHARE_GLOBAL_CUMULATIVE_CO2', label: 'Share of global cumulative CO2', source: 'Our World in Data / GCP', direction: 'Lower = less historical burden', weight: '100%' },
    ],
  },
  {
    name: 'Resilience',
    weight: '15%',
    color: '#00A67E',
    indicators: [
      { code: 'NDGAIN.READINESS',     label: 'ND-GAIN Readiness',     source: 'Notre Dame Global Adaptation Initiative', direction: 'Higher is better', weight: '60%' },
      { code: 'NDGAIN.VULNERABILITY', label: 'ND-GAIN Vulnerability',  source: 'Notre Dame Global Adaptation Initiative', direction: 'Lower is better', weight: '40%' },
    ],
  },
];

const GRADES = [
  { grade: 'A+', range: '90-100', description: 'Climate leader — top global performance across most domains' },
  { grade: 'A',  range: '80-89',  description: 'Strong performer — well above average on most indicators' },
  { grade: 'B+', range: '70-79',  description: 'Good progress — above average, some areas for improvement' },
  { grade: 'B',  range: '60-69',  description: 'Moderate action — meeting international averages' },
  { grade: 'C+', range: '50-59',  description: 'Below average — meaningful gaps in several domains' },
  { grade: 'C',  range: '40-49',  description: 'Significant gaps — lagging on most climate indicators' },
  { grade: 'D',  range: '25-39',  description: 'Low performance — urgent improvement needed' },
  { grade: 'F',  range: '0-24',   description: 'Critical — among the worst performers globally' },
];

export default function MethodologyPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-14">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[--border-card] bg-white px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-secondary]">
            <span className="h-1.5 w-1.5 rounded-full bg-[--accent-primary]" />
            Methodology
          </p>
          <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-[--text-primary] sm:text-4xl">
            How the Climate Report Card Works
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[--text-secondary]">
            Each country receives a score based on 9 indicators across 5 climate domains.
            Scores are normalized against all countries with available data, so grades reflect
            relative global performance rather than absolute thresholds.
          </p>
        </div>

        {/* Scoring overview */}
        <section className="mb-14 rounded-2xl border border-[--border-card] bg-white p-7" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-5 text-lg font-bold text-[--text-primary]">Scoring Formula</h2>
          <div className="space-y-2.5 font-mono text-[13px] text-[--text-secondary]">
            <p className="font-sans text-[14px]">For each indicator:</p>
            <p className="rounded-lg bg-[--bg-section] px-4 py-2.5 text-[--text-primary]">
              normalized = (value - min) / (max - min) x 100
            </p>
            <p className="mt-3 font-sans text-[14px]">Inverse indicators (lower = better):</p>
            <p className="rounded-lg bg-[--bg-section] px-4 py-2.5 text-[--text-primary]">
              score = 100 - normalized
            </p>
            <p className="mt-3 font-sans text-[14px]">Domain score (weighted average):</p>
            <p className="rounded-lg bg-[--bg-section] px-4 py-2.5 text-[--text-primary]">
              domain_score = sum(indicator_score x weight) / sum(weight)
            </p>
            <p className="mt-3 font-sans text-[14px]">Total score:</p>
            <p className="rounded-lg bg-[--bg-section] px-4 py-2.5 text-[--text-primary]">
              total = 0.30 x Emissions + 0.25 x Energy + 0.15 x Economy + 0.15 x Responsibility + 0.15 x Resilience
            </p>
          </div>
          <p className="mt-4 text-[12px] text-[--text-muted]">
            Countries missing more than 2 of 5 domains are excluded from scoring.
            Domain scores are re-weighted to sum to 1.0 when a domain is missing.
          </p>
        </section>

        {/* 5 Domains */}
        <section className="mb-14">
          <h2 className="mb-6 text-lg font-bold text-[--text-primary]">5 Scoring Domains</h2>
          <div className="space-y-4">
            {DOMAINS.map((domain) => (
              <div
                key={domain.name}
                className="rounded-2xl border border-[--border-card] bg-white p-6"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: domain.color }} />
                    <h3 className="text-[15px] font-bold text-[--text-primary]">{domain.name}</h3>
                  </div>
                  <span className="rounded-full bg-[--bg-section] px-3 py-1 text-[12px] font-medium text-[--text-secondary]">
                    {domain.weight}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-[--border-card] text-left text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">
                        <th className="pb-2 pr-4">Indicator</th>
                        <th className="pb-2 pr-4">Source</th>
                        <th className="pb-2 pr-4">Direction</th>
                        <th className="pb-2">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[--border-card]">
                      {domain.indicators.map((ind) => (
                        <tr key={ind.code}>
                          <td className="py-2.5 pr-4 font-medium text-[--text-primary]">{ind.label}</td>
                          <td className="py-2.5 pr-4 text-[--text-secondary]">{ind.source}</td>
                          <td className="py-2.5 pr-4 text-[--text-secondary]">{ind.direction}</td>
                          <td className="py-2.5 text-[--text-muted]">{ind.weight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Grade thresholds */}
        <section className="mb-14 rounded-2xl border border-[--border-card] bg-white p-7" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-5 text-lg font-bold text-[--text-primary]">Grade Thresholds</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {GRADES.map((g) => (
              <div key={g.grade} className="flex items-center gap-3 rounded-xl bg-[--bg-section] px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[14px] font-bold text-[--text-primary] shadow-sm">
                  {g.grade}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[--text-primary]">{g.range}</p>
                  <p className="text-[12px] text-[--text-secondary]">{g.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-14 rounded-2xl border border-[--border-card] bg-white p-7" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-5 text-lg font-bold text-[--text-primary]">Limitations</h2>
          <ul className="space-y-3 text-[14px] text-[--text-secondary]">
            {[
              ['Relative scoring', 'Grades measure performance relative to other countries, not against a climate-safe absolute benchmark.'],
              ['Data gaps', 'Countries with missing indicators are penalized through domain exclusion, which may understate scores for less-monitored nations.'],
              ['Structural factors', 'Cold climates, landlocked geography, and development stage affect energy use in ways the score does not fully adjust for.'],
              ['Policy lag', 'Many indicators reflect outcomes from policies enacted years earlier, not current commitments.'],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[--accent-primary]" />
                <span><strong className="text-[--text-primary]">{title}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Data sources */}
        <section className="rounded-2xl border border-[--border-card] bg-white p-7" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-4 text-lg font-bold text-[--text-primary]">Primary Data Sources</h2>
          <ul className="space-y-2 text-[13px] text-[--text-secondary]">
            {[
              ['World Bank / Climate Watch', 'CO2 per capita, GDP per capita'],
              ['Ember Climate', 'Renewable electricity %, fossil %, grid carbon intensity'],
              ['Our World in Data / GCP', 'Cumulative CO2, global share, temperature attribution'],
              ['ND-GAIN', 'Country readiness and vulnerability indices'],
            ].map(([src, desc]) => (
              <li key={src} className="flex gap-2">
                <span className="font-medium text-[--text-primary]">{src}:</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[11px] text-[--text-muted]">
            Scores updated annually. Current scoring year: 2024. VisualClimate is not affiliated with any of the above organizations.
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="mt-14 rounded-2xl border border-[--border-card] bg-[--bg-section] p-8 text-center">
          <p className="text-lg font-bold text-[--text-primary]">See the methodology in action</p>
          <p className="mt-1.5 text-[14px] text-[--text-secondary]">Search any country to view its report card with scores across all 5 domains.</p>
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
