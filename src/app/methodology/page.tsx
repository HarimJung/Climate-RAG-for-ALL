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
      { code: 'EN.GHG.CO2.PC.CE.AR5', label: 'CO₂ per capita', source: 'World Bank / Climate Watch', direction: 'Lower is better', weight: '50%' },
      { code: 'DERIVED.CO2_PER_GDP',   label: 'CO₂ per GDP',    source: 'Derived (CO₂ ÷ GDP/capita)', direction: 'Lower is better', weight: '30%' },
      { code: 'DERIVED.DECOUPLING',    label: 'Decoupling index', source: 'Derived (GDP CAGR − CO₂ CAGR)', direction: 'Higher is better', weight: '20%' },
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
      { code: 'DERIVED.CO2_PER_GDP', label: 'CO₂ per GDP',     source: 'Derived',    direction: 'Lower is better', weight: '50%' },
    ],
  },
  {
    name: 'Responsibility',
    weight: '15%',
    color: '#F59E0B',
    indicators: [
      { code: 'OWID.SHARE_GLOBAL_CUMULATIVE_CO2', label: 'Share of global cumulative CO₂', source: 'Our World in Data / GCP', direction: 'Lower = less historical burden', weight: '100%' },
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
  { grade: 'A+', range: '90–100', description: 'Climate leader — top global performance across most domains' },
  { grade: 'A',  range: '80–89',  description: 'Strong performer — well above average on most indicators' },
  { grade: 'B+', range: '70–79',  description: 'Good progress — above average, some areas for improvement' },
  { grade: 'B',  range: '60–69',  description: 'Moderate action — meeting international averages' },
  { grade: 'C+', range: '50–59',  description: 'Below average — meaningful gaps in several domains' },
  { grade: 'C',  range: '40–49',  description: 'Significant gaps — lagging on most climate indicators' },
  { grade: 'D',  range: '25–39',  description: 'Low performance — urgent improvement needed' },
  { grade: 'F',  range: '0–24',   description: 'Critical — among the worst performers globally' },
];

export default function MethodologyPage() {
  return (
    <div className="bg-[--bg-primary] px-4 py-16">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-12">
          <span className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[--accent-primary]">
            Methodology
          </span>
          <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">
            How the Climate Report Card Works
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[--text-secondary]">
            Each country receives a score based on 9 indicators across 5 climate domains.
            Scores are normalized against all countries with available data, so grades reflect
            relative global performance rather than absolute thresholds.
          </p>
        </div>

        {/* Scoring overview */}
        <section className="mb-12 rounded-2xl border border-[--border-card] bg-white p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">Scoring Formula</h2>
          <div className="space-y-2 font-mono text-sm text-[--text-secondary]">
            <p>For each indicator:</p>
            <p className="ml-4 rounded bg-[--bg-section] px-3 py-2 text-[--text-primary]">
              normalized = (value − min) ÷ (max − min) × 100
            </p>
            <p className="mt-2">Inverse indicators (lower = better):</p>
            <p className="ml-4 rounded bg-[--bg-section] px-3 py-2 text-[--text-primary]">
              score = 100 − normalized
            </p>
            <p className="mt-2">Domain score (weighted average of its indicators):</p>
            <p className="ml-4 rounded bg-[--bg-section] px-3 py-2 text-[--text-primary]">
              domain_score = Σ (indicator_score × weight) ÷ Σ weight
            </p>
            <p className="mt-2">Total score:</p>
            <p className="ml-4 rounded bg-[--bg-section] px-3 py-2 text-[--text-primary]">
              total = 0.30×Emissions + 0.25×Energy + 0.15×Economy + 0.15×Responsibility + 0.15×Resilience
            </p>
          </div>
          <p className="mt-4 text-sm text-[--text-muted]">
            Countries missing more than 2 of 5 domains are excluded from scoring.
            Domain scores are re-weighted to sum to 1.0 when a domain is missing.
          </p>
        </section>

        {/* 5 Domains */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">5 Scoring Domains</h2>
          <div className="space-y-4">
            {DOMAINS.map((domain) => (
              <div
                key={domain.name}
                className="rounded-xl border border-[--border-card] bg-white p-6"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: domain.color }} />
                    <h3 className="text-lg font-semibold text-[--text-primary]">{domain.name}</h3>
                  </div>
                  <span className="rounded-full bg-[--bg-section] px-3 py-1 text-sm font-medium text-[--text-secondary]">
                    {domain.weight} of total score
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[--border-card] text-left text-xs font-medium uppercase tracking-wider text-[--text-muted]">
                        <th className="pb-2 pr-4">Indicator</th>
                        <th className="pb-2 pr-4">Source</th>
                        <th className="pb-2 pr-4">Direction</th>
                        <th className="pb-2">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[--border-card]">
                      {domain.indicators.map((ind) => (
                        <tr key={ind.code}>
                          <td className="py-2 pr-4 font-medium text-[--text-primary]">{ind.label}</td>
                          <td className="py-2 pr-4 text-[--text-secondary]">{ind.source}</td>
                          <td className="py-2 pr-4 text-[--text-secondary]">{ind.direction}</td>
                          <td className="py-2 text-[--text-muted]">{ind.weight}</td>
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
        <section className="mb-12 rounded-2xl border border-[--border-card] bg-white p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">Grade Thresholds</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {GRADES.map((g) => (
              <div key={g.grade} className="flex items-start gap-3 rounded-lg bg-[--bg-section] p-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-[--text-primary]" style={{ boxShadow: 'var(--shadow-card)' }}>
                  {g.grade}
                </span>
                <div>
                  <p className="font-medium text-[--text-primary]">{g.range} points</p>
                  <p className="text-sm text-[--text-secondary]">{g.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-12 rounded-2xl border border-[--border-card] bg-white p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">Limitations</h2>
          <ul className="space-y-3 text-[--text-secondary]">
            <li className="flex gap-2">
              <span className="mt-1 text-[--accent-primary]">→</span>
              <span><strong>Relative scoring:</strong> Grades measure performance relative to other countries, not against a climate-safe absolute benchmark.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 text-[--accent-primary]">→</span>
              <span><strong>Data gaps:</strong> Countries with missing indicators are penalized through domain exclusion, which may understate scores for less-monitored nations.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 text-[--accent-primary]">→</span>
              <span><strong>Structural factors:</strong> Cold climates, landlocked geography, and development stage affect energy use in ways the score does not fully adjust for.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 text-[--accent-primary]">→</span>
              <span><strong>Policy lag:</strong> Many indicators reflect outcomes from policies enacted years earlier, not current commitments.</span>
            </li>
          </ul>
        </section>

        {/* Data sources */}
        <section className="rounded-2xl border border-[--border-card] bg-white p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-4 text-xl font-semibold text-[--text-primary]">Primary Data Sources</h2>
          <ul className="space-y-2 text-sm text-[--text-secondary]">
            {[
              ['World Bank / Climate Watch', 'CO₂ per capita (EN.GHG.CO2.PC.CE.AR5), GDP per capita'],
              ['Ember Climate', 'Renewable electricity %, fossil %, grid carbon intensity'],
              ['Our World in Data / Global Carbon Project', 'Cumulative CO₂, global share, temperature attribution'],
              ['Notre Dame Global Adaptation Initiative (ND-GAIN)', 'Country readiness and vulnerability indices'],
            ].map(([src, desc]) => (
              <li key={src} className="flex gap-2">
                <span className="font-medium text-[--text-primary]">{src}:</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-[--text-muted]">
            Scores updated annually. Current scoring year: 2024. VisualClimate is an independent platform and is not affiliated with any of the above organizations.
          </p>
        </section>

      </div>
    </div>
  );
}
