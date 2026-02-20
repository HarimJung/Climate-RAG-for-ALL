import Link from 'next/link';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
  title: 'Learn — Climate Data, Guides & Methodology',
  description: 'Climate insights, authoritative reports, expert guides, and the methodology behind the VisualClimate Climate Report Card.',
  path: '/learn',
});

// ── Tab bar ────────────────────────────────────────────────────────────────────

function TabBar({ active }: { active: string }) {
  const tabs = [
    { key: 'insights',    label: 'Insights' },
    { key: 'library',     label: 'Library' },
    { key: 'guides',      label: 'Guides' },
    { key: 'methodology', label: 'Methodology' },
  ];
  return (
    <div className="mb-8 flex gap-1 rounded-xl border border-[--border-card] bg-[--bg-section] p-1 w-fit overflow-x-auto">
      {tabs.map(t => (
        <Link
          key={t.key}
          href={`/learn?tab=${t.key}`}
          className={`rounded-lg px-5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
            active === t.key
              ? 'bg-white text-[--text-primary] shadow-sm'
              : 'text-[--text-secondary] hover:text-[--text-primary]'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// ── Insights content ───────────────────────────────────────────────────────────

const INSIGHTS = [
  {
    slug: 'emissions-trend',
    title: 'Emissions Trend Analysis',
    description: 'CO2 per capita trajectories for 6 countries (2000–2023). CAGR, Paris Agreement impact, decoupling scores, and energy transition speed.',
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

function InsightsTab() {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-[--text-primary]">Climate Insights</h2>
      <p className="mb-8 text-[--text-secondary]">Data-driven analysis across 6 pilot countries</p>
      <div className="grid gap-6 md:grid-cols-2">
        {INSIGHTS.map(item => (
          <Link
            key={item.slug}
            href={`/insights/${item.slug}`}
            className="group rounded-xl border border-[--border-card] bg-white p-6 transition-all hover:border-[--accent-primary] hover:shadow-md"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <time className="text-xs text-[--text-muted]">{item.date}</time>
            <h3 className="mt-2 text-xl font-semibold text-[--text-primary] group-hover:text-[--accent-primary] transition-colors">{item.title}</h3>
            <p className="mt-2 text-sm text-[--text-secondary] leading-relaxed">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="rounded-full bg-[--bg-section] px-3 py-1 text-xs text-[--text-muted]">{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Library content ────────────────────────────────────────────────────────────

const REPORTS = [
  { title: 'IPCC AR6 Synthesis Report', org: 'IPCC', year: 2023, description: 'Comprehensive assessment of climate change science, impacts, and mitigation strategies.', tags: ['Assessment', 'Global'], url: 'https://www.ipcc.ch/report/ar6/syr/' },
  { title: 'Emissions Gap Report 2024', org: 'UNEP', year: 2024, description: 'Analysis of the gap between current commitments and Paris Agreement targets.', tags: ['Emissions', 'Policy'], url: 'https://www.unep.org/resources/emissions-gap-report-2024' },
  { title: 'State of the Global Climate', org: 'WMO', year: 2024, description: 'Annual overview of global climate indicators, extreme events, and socioeconomic impacts.', tags: ['Annual', 'Indicators'], url: 'https://wmo.int/publication-series/state-of-global-climate' },
  { title: 'Global Stocktake Report', org: 'UNFCCC', year: 2023, description: 'First global assessment of progress under the Paris Agreement.', tags: ['Paris Agreement', 'Progress'], url: 'https://unfccc.int/topics/global-stocktake' },
  { title: 'Adaptation Gap Report 2023', org: 'UNEP', year: 2023, description: 'Assessment of global progress on adaptation planning, finance, and implementation.', tags: ['Adaptation', 'Finance'], url: 'https://www.unep.org/resources/adaptation-gap-report-2023' },
  { title: 'Net Zero Roadmap 2023', org: 'IEA', year: 2023, description: 'Updated pathway for the global energy sector to reach net zero by 2050.', tags: ['Energy', 'Net Zero'], url: 'https://www.iea.org/reports/net-zero-roadmap-a-global-pathway-to-keep-the-15-0c-goal-in-reach' },
  { title: 'Global Carbon Budget 2023', org: 'GCP', year: 2023, description: 'Annual update of global CO2 emissions from fossil fuels, land use, and cement.', tags: ['Carbon', 'Data'], url: 'https://globalcarbonbudget.org/' },
  { title: 'Climate Change and Land', org: 'IPCC', year: 2022, description: 'Special report on climate change, desertification, food security, and land management.', tags: ['Land', 'Food Security'], url: 'https://www.ipcc.ch/srccl/' },
];

function LibraryTab() {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-[--text-primary]">Climate Report Library</h2>
      <p className="mb-8 text-[--text-secondary]">Authoritative climate reports from the world's leading institutions</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(report => (
          <a
            key={report.title}
            href={report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-[--border-card] bg-white p-6 transition-all hover:border-[--accent-primary] hover:shadow-md"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[--bg-section] px-3 py-1 text-xs font-medium text-[--text-secondary]">{report.org}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[--text-muted]">{report.year}</span>
                <svg className="h-3.5 w-3.5 text-[--text-muted] opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[--text-primary] group-hover:text-[--accent-primary] transition-colors">{report.title}</h3>
            <p className="mt-2 text-sm text-[--text-secondary]">{report.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.tags.map(tag => (
                <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-[--accent-primary]">{tag}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Guides content ─────────────────────────────────────────────────────────────

const GUIDES = [
  { slug: 'climate-data-sources', title: 'The Complete Guide to Free Climate Data Sources (2026)', description: 'Comprehensive overview of World Bank, Climate Watch, NASA POWER, NOAA, and IMF climate data APIs with practical examples.', readTime: '12 min read', category: 'Data' },
  { slug: 'issb-s2-beginners', title: 'ISSB S2 Climate Disclosure: A Practical Guide for Beginners', description: 'Understand IFRS S2 requirements, physical vs transition risks, and how to prepare your first climate disclosure.', readTime: '15 min read', category: 'Reporting' },
];

function GuidesTab() {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-[--text-primary]">Climate Guides</h2>
      <p className="mb-8 text-[--text-secondary]">Expert guides on climate data, sustainability reporting, and ESG frameworks</p>
      <div className="space-y-6">
        {GUIDES.map(guide => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group block rounded-xl border border-[--border-card] bg-white p-6 transition-all hover:border-[--accent-primary] hover:shadow-md"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[--accent-primary]">{guide.category}</span>
              <span className="text-sm text-[--text-muted]">{guide.readTime}</span>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-[--text-primary] group-hover:text-[--accent-primary]">{guide.title}</h3>
            <p className="mt-2 text-[--text-secondary]">{guide.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[--accent-primary]">
              Read guide
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Methodology content ────────────────────────────────────────────────────────

const DOMAINS = [
  { name: 'Emissions', weight: '30%', color: '#E5484D', indicators: [
    { label: 'CO₂ per capita', source: 'World Bank / Climate Watch', direction: 'Lower is better', weight: '50%' },
    { label: 'CO₂ per GDP', source: 'Derived (CO₂ ÷ GDP/capita)', direction: 'Lower is better', weight: '30%' },
    { label: 'Decoupling index', source: 'Derived (GDP CAGR − CO₂ CAGR)', direction: 'Higher is better', weight: '20%' },
  ]},
  { name: 'Energy', weight: '25%', color: '#0066FF', indicators: [
    { label: 'Renewable electricity %', source: 'Ember', direction: 'Higher is better', weight: '60%' },
    { label: 'Grid carbon intensity', source: 'Ember', direction: 'Lower is better', weight: '40%' },
  ]},
  { name: 'Economy', weight: '15%', color: '#8B5CF6', indicators: [
    { label: 'GDP per capita', source: 'World Bank', direction: 'Higher enables climate action', weight: '50%' },
    { label: 'CO₂ per GDP', source: 'Derived', direction: 'Lower is better', weight: '50%' },
  ]},
  { name: 'Responsibility', weight: '15%', color: '#F59E0B', indicators: [
    { label: 'Share of global cumulative CO₂', source: 'Our World in Data / GCP', direction: 'Lower = less historical burden', weight: '100%' },
  ]},
  { name: 'Resilience', weight: '15%', color: '#00A67E', indicators: [
    { label: 'ND-GAIN Readiness', source: 'Notre Dame Global Adaptation Initiative', direction: 'Higher is better', weight: '60%' },
    { label: 'ND-GAIN Vulnerability', source: 'Notre Dame Global Adaptation Initiative', direction: 'Lower is better', weight: '40%' },
  ]},
];

const GRADES = [
  { grade: 'A+', range: '90–100', description: 'Climate leader — top global performance' },
  { grade: 'A',  range: '80–89',  description: 'Strong performer — above average on most indicators' },
  { grade: 'B+', range: '70–79',  description: 'Good progress — above average with room to improve' },
  { grade: 'B',  range: '60–69',  description: 'Moderate action — meeting international averages' },
  { grade: 'C+', range: '50–59',  description: 'Below average — meaningful gaps in several domains' },
  { grade: 'C',  range: '40–49',  description: 'Significant gaps — lagging on most indicators' },
  { grade: 'D',  range: '25–39',  description: 'Low performance — urgent improvement needed' },
  { grade: 'F',  range: '0–24',   description: 'Critical — among the worst performers globally' },
];

function MethodologyTab() {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-[--text-primary]">How the Climate Report Card Works</h2>
      <p className="mb-8 max-w-2xl text-[--text-secondary]">
        Each country receives a score based on 9 indicators across 5 climate domains, normalized against all countries with available data.
      </p>

      {/* Formula */}
      <div className="mb-8 rounded-2xl border border-[--border-card] bg-white p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h3 className="mb-4 text-lg font-semibold text-[--text-primary]">Scoring Formula</h3>
        <div className="space-y-2 font-mono text-sm text-[--text-secondary]">
          <p>Normalized score:</p>
          <p className="ml-4 rounded bg-[--bg-section] px-3 py-2 text-[--text-primary]">normalized = (value − min) ÷ (max − min) × 100</p>
          <p className="mt-2">Inverse indicators (lower = better):</p>
          <p className="ml-4 rounded bg-[--bg-section] px-3 py-2 text-[--text-primary]">score = 100 − normalized</p>
          <p className="mt-2">Total score:</p>
          <p className="ml-4 rounded bg-[--bg-section] px-3 py-2 text-[--text-primary]">total = 0.30×Emissions + 0.25×Energy + 0.15×Economy + 0.15×Responsibility + 0.15×Resilience</p>
        </div>
      </div>

      {/* Domains */}
      <div className="mb-8 space-y-4">
        {DOMAINS.map(domain => (
          <div key={domain.name} className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: domain.color }} />
                <h4 className="text-lg font-semibold text-[--text-primary]">{domain.name}</h4>
              </div>
              <span className="rounded-full bg-[--bg-section] px-3 py-1 text-sm font-medium text-[--text-secondary]">{domain.weight}</span>
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
                  {domain.indicators.map(ind => (
                    <tr key={ind.label}>
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

      {/* Grade thresholds */}
      <div className="rounded-2xl border border-[--border-card] bg-white p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h3 className="mb-4 text-lg font-semibold text-[--text-primary]">Grade Thresholds</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {GRADES.map(g => (
            <div key={g.grade} className="flex items-start gap-3 rounded-lg bg-[--bg-section] p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-[--text-primary]" style={{ boxShadow: 'var(--shadow-card)' }}>
                {g.grade}
              </span>
              <div>
                <p className="font-medium text-[--text-primary]">{g.range} pts</p>
                <p className="text-sm text-[--text-secondary]">{g.description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-[--text-muted]">
          Full methodology at <Link href="/methodology" className="text-[--accent-primary] hover:underline">/methodology</Link>
        </p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const active = ['insights', 'library', 'guides', 'methodology'].includes(tab ?? '') ? (tab as string) : 'insights';

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">Learn</h1>
          <p className="mt-2 text-lg text-[--text-secondary]">
            Climate insights, key reports, expert guides, and our scoring methodology
          </p>
        </div>

        <TabBar active={active} />

        {active === 'insights'    && <InsightsTab />}
        {active === 'library'     && <LibraryTab />}
        {active === 'guides'      && <GuidesTab />}
        {active === 'methodology' && <MethodologyTab />}
      </div>
    </div>
  );
}
