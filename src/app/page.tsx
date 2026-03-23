import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { createMetaTags } from '@/components/seo/MetaTags';
import { type CountryClass } from '@/components/charts/WorldScoreboard';
import { HeroSearch } from '@/components/HeroSearch';
import { HomeMap } from '@/components/HomeMap';
import { iso3ToFlag } from '@/lib/iso3ToFlag';
import { ScrollFadeIn } from '@/components/climate/scroll-fade-in';

export const metadata = createMetaTags({
  title: 'VisualClimate — Climate Accountability Through Data',
  description:
    'Track 250 countries across 61 climate indicators. Who is really reducing emissions? Open data platform for the Paris Agreement era.',
  path: '/',
});

export const dynamic = 'force-dynamic';

const CLASS_NAME_MAP: Record<number, CountryClass['cls']> = { 1: 'Changer', 2: 'Starter', 3: 'Talker' };

const POPULAR_COUNTRIES = [
  { iso3: 'KOR', name: 'South Korea' },
  { iso3: 'USA', name: 'United States' },
  { iso3: 'CHN', name: 'China' },
  { iso3: 'DEU', name: 'Germany' },
  { iso3: 'IND', name: 'India' },
  { iso3: 'BRA', name: 'Brazil' },
];

const CTA_COUNTRIES = [
  { iso3: 'KOR', name: 'South Korea', grade: 'C+', score: 56.8, cls: 'Starter' as const },
  { iso3: 'CRI', name: 'Costa Rica', grade: 'A', score: 82.1, cls: 'Changer' as const },
  { iso3: 'USA', name: 'United States', grade: 'D', score: 34.2, cls: 'Talker' as const },
];

const GRADE_COLORS: Record<string, string> = {
  'A+': '#00A67E', A: '#00A67E', 'B+': '#10B981', B: '#34D399',
  'C+': '#F59E0B', C: '#F59E0B', D: '#E5484D', F: '#E5484D',
};

const CLS_COLORS: Record<string, string> = {
  Changer: '#00A67E', Starter: '#F59E0B', Talker: '#E5484D',
};

// ── Data functions ──────────────────────────────────────────────────────────

async function getStats() {
  try {
    const supabase = createServiceClient();
    const [countriesRes, indicatorsRes, dataPointsRes] = await Promise.all([
      supabase.from('countries').select('iso3', { count: 'exact', head: true }),
      supabase.from('indicators').select('*', { count: 'exact', head: true }),
      supabase.from('country_data').select('*', { count: 'exact', head: true }),
    ]);
    return {
      countries:  countriesRes.count ?? 0,
      indicators: indicatorsRes.count ?? 0,
      dataPoints: dataPointsRes.count ?? 0,
    };
  } catch {
    return { countries: 0, indicators: 0, dataPoints: 0 };
  }
}

async function getScoreboardData(): Promise<CountryClass[]> {
  try {
    const supabase = createServiceClient();
    const [{ data: clsRows }, { data: metricRows }, { data: cntRows }] = await Promise.all([
      supabase.from('country_data').select('country_iso3, value').eq('indicator_code', 'DERIVED.CLIMATE_CLASS').eq('year', 2023),
      supabase.from('country_data').select('country_iso3, indicator_code, year, value')
        .in('indicator_code', ['EN.GHG.CO2.PC.CE.AR5', 'EMBER.RENEWABLE.PCT'])
        .gte('year', 2018).order('year', { ascending: false }),
      supabase.from('countries').select('iso3, name'),
    ]);
    const nameMap = new Map<string, string>((cntRows ?? []).map((c: { iso3: string; name: string }) => [c.iso3, c.name]));
    const co2Map  = new Map<string, number>();
    const renMap  = new Map<string, number>();
    for (const r of (metricRows ?? []) as { country_iso3: string; indicator_code: string; value: number }[]) {
      if (r.indicator_code === 'EN.GHG.CO2.PC.CE.AR5' && !co2Map.has(r.country_iso3)) co2Map.set(r.country_iso3, Number(r.value));
      if (r.indicator_code === 'EMBER.RENEWABLE.PCT'   && !renMap.has(r.country_iso3)) renMap.set(r.country_iso3, Number(r.value));
    }
    return (clsRows ?? []).map((r: { country_iso3: string; value: number }) => ({
      iso3:      r.country_iso3,
      name:      nameMap.get(r.country_iso3) ?? r.country_iso3,
      cls:       CLASS_NAME_MAP[r.value] ?? 'Talker',
      co2:       co2Map.get(r.country_iso3),
      renewable: renMap.get(r.country_iso3),
    }));
  } catch { return []; }
}

async function getCountryList(): Promise<{ iso3: string; name: string }[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from('countries').select('iso3, name').order('name');
    return (data ?? []) as { iso3: string; name: string }[];
  } catch { return []; }
}

// ── Section label ───────────────────────────────────────────────────────────

function SectionDot({ label }: { label: string }) {
  return (
    <p className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider text-[--text-muted]">
      <span className="inline-block h-2 w-2 rounded-full bg-[--accent-primary]" />
      {label}
    </p>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [stats, scoreboardData, countryList] = await Promise.all([
    getStats(),
    getScoreboardData(),
    getCountryList(),
  ]);

  const classCounts = {
    Changer: scoreboardData.filter(c => c.cls === 'Changer').length || 64,
    Starter: scoreboardData.filter(c => c.cls === 'Starter').length || 80,
    Talker:  scoreboardData.filter(c => c.cls === 'Talker').length  || 72,
  };

  const countryCount = stats.countries > 0 ? stats.countries : 250;
  const dataPointStr = stats.dataPoints > 0 ? `${(stats.dataPoints / 1000).toFixed(0)}K+` : '172K+';

  return (
    <div>
      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden px-6 pb-20 pt-28 sm:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollFadeIn>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[--text-primary] sm:text-5xl lg:text-6xl">
              Climate accountability{' '}
              <span className="gradient-text">for every country.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[--text-secondary]">
              Search any country to see its climate report card — grades backed by real emissions, energy, and vulnerability data.
            </p>
          </ScrollFadeIn>

          <ScrollFadeIn delay={0.15}>
            <div className="mt-10">
              <HeroSearch countries={countryList} />
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay={0.25}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-[--text-muted]">Popular:</span>
              {POPULAR_COUNTRIES.map(c => (
                <Link
                  key={c.iso3}
                  href={`/report/${c.iso3}`}
                  className="rounded-full border border-[--border-card] bg-white px-3 py-1.5 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
                >
                  {iso3ToFlag(c.iso3)} {c.name}
                </Link>
              ))}
            </div>
          </ScrollFadeIn>
        </div>

        {/* Floating badges */}
        <ScrollFadeIn direction="left" delay={0.3} className="absolute left-6 top-32 hidden lg:block">
          <div className="glass-card float-anim rounded-2xl px-5 py-3 shadow-lg">
            <p className="text-2xl font-bold text-[--text-primary]">{countryCount}</p>
            <p className="text-xs text-[--text-muted]">countries tracked</p>
          </div>
        </ScrollFadeIn>
        <ScrollFadeIn direction="right" delay={0.4} className="absolute right-6 top-40 hidden lg:block">
          <div className="glass-card float-anim rounded-2xl px-5 py-3 shadow-lg" style={{ animationDelay: '1s' }}>
            <p className="text-2xl font-bold text-[--text-primary]">{dataPointStr}</p>
            <p className="text-xs text-[--text-muted]">data points</p>
          </div>
        </ScrollFadeIn>
      </section>

      {/* ── 2. PLATFORM ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <ScrollFadeIn>
            <SectionDot label="Platform" />
            <h2 className="text-center text-3xl font-bold text-[--text-primary] sm:text-4xl">
              Better Data, Better Accountability.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-[--text-secondary]">
              We aggregate, score, and visualize — so you can focus on what matters.
            </p>
          </ScrollFadeIn>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { icon: '📡', title: '5 Trusted Sources', desc: 'World Bank, Ember, ND-GAIN, OWID, and Climate TRACE — aggregated and cross-verified.' },
              { icon: '🌍', title: '250 Countries Scored', desc: 'Every country graded across 5 domains: Emissions, Energy, Policy, Resilience, and Social.' },
              { icon: '📊', title: 'Shareable Posters', desc: 'Download publication-ready PNG charts designed for LinkedIn, reports, and presentations.' },
            ].map((card, i) => (
              <ScrollFadeIn key={card.title} delay={i * 0.1}>
                <div className="card-hover rounded-2xl border border-[--border-card] bg-white p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[--text-primary]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[--text-secondary]">{card.desc}</p>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. MAP SCOREBOARD ────────────────────────────────────────────── */}
      <section className="bg-[--bg-section] px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid items-start gap-10 lg:grid-cols-[380px_1fr]">
            <ScrollFadeIn direction="left">
              <div className="lg:sticky lg:top-24">
                <SectionDot label="Scoreboard" />
                <h2 className="text-3xl font-bold text-[--text-primary]">
                  Who is actually changing?
                </h2>
                <p className="mt-3 text-[--text-secondary]">
                  Every country classified by real action — not pledges. Click any country to see its full report card.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  {(['Changer', 'Starter', 'Talker'] as const).map(cls => (
                    <div key={cls} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CLS_COLORS[cls] }} />
                      <span className="text-sm font-bold text-[--text-primary]">{classCounts[cls]}</span>
                      <span className="text-sm text-[--text-muted]">{cls}s</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn direction="right" delay={0.15}>
              {scoreboardData.length > 0 ? (
                <HomeMap countries={scoreboardData} width={780} height={440} />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-[--border-card] bg-white text-sm text-[--text-muted]">
                  Loading map...
                </div>
              )}
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      {/* ── 4. FEATURES (3+2 bento) ──────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <ScrollFadeIn>
            <SectionDot label="Features" />
            <h2 className="text-center text-3xl font-bold text-[--text-primary] sm:text-4xl">
              Everything you need to hold your country accountable.
            </h2>
          </ScrollFadeIn>

          {/* Top row: 3 cards */}
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            <ScrollFadeIn delay={0}>
              <div className="card-hover flex flex-col rounded-2xl border border-[--border-card] bg-white p-6">
                <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-slate-50">
                  {/* Mini report card bars */}
                  <div className="flex items-end gap-2">
                    {[72, 45, 58, 88, 34].map((v, i) => (
                      <div key={i} className="w-5 rounded-t" style={{ height: `${v * 0.9}px`, backgroundColor: ['#0066FF','#00A67E','#F59E0B','#10B981','#E5484D'][i] }} />
                    ))}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[--text-primary]">Report Card</h3>
                <p className="mt-1 text-sm text-[--text-secondary]">A single grade for every country. 5 domains, transparent methodology.</p>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={0.1}>
              <div className="card-hover flex flex-col rounded-2xl border border-[--border-card] bg-white p-6">
                <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-slate-50">
                  {/* Mini line chart */}
                  <svg viewBox="0 0 120 60" className="h-16 w-24 text-[--accent-primary]">
                    <polyline fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      points="5,50 20,45 35,48 50,35 65,30 80,22 95,18 115,10" />
                    <polyline fill="none" stroke="#00A67E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3"
                      points="5,55 20,52 35,48 50,40 65,35 80,38 95,42 115,45" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[--text-primary]">Country Deep Dive</h3>
                <p className="mt-1 text-sm text-[--text-secondary]">10 data sections per country — from emissions to vulnerability and beyond.</p>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={0.2}>
              <div className="card-hover flex flex-col rounded-2xl border border-[--border-card] bg-white p-6">
                <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-slate-50">
                  {/* Mini poster card */}
                  <div className="w-20 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="mb-1 h-2 w-10 rounded bg-slate-200" />
                    <div className="h-8 rounded bg-gradient-to-br from-blue-100 to-emerald-100" />
                    <div className="mt-1 h-1.5 w-12 rounded bg-slate-200" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[--text-primary]">Data Posters</h3>
                <p className="mt-1 text-sm text-[--text-secondary]">Publication-ready chart PNGs. One click to download, share on LinkedIn.</p>
              </div>
            </ScrollFadeIn>
          </div>

          {/* Bottom row: 2 cards */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <ScrollFadeIn delay={0.1}>
              <div className="card-hover flex flex-col rounded-2xl border border-[--border-card] bg-white p-6">
                <div className="mb-4 flex h-28 items-center justify-center gap-3 rounded-xl bg-slate-50">
                  {(['Changer', 'Starter', 'Talker'] as const).map(cls => (
                    <span key={cls} className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: CLS_COLORS[cls] }}>
                      {cls}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg font-bold text-[--text-primary]">Greenwashing Filter</h3>
                <p className="mt-1 text-sm text-[--text-secondary]">
                  Three classifications based on real outcomes: Changers reduce CO2 and grow renewables. Talkers don't.
                </p>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn delay={0.2}>
              <div className="card-hover flex flex-col rounded-2xl border border-[--border-card] bg-white p-6">
                <div className="mb-4 flex h-28 flex-wrap items-center justify-center gap-2 rounded-xl bg-slate-50 px-4">
                  {['World Bank', 'Ember', 'ND-GAIN', 'OWID', 'Climate TRACE'].map(src => (
                    <span key={src} className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-[--text-secondary] shadow-sm">
                      {src}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg font-bold text-[--text-primary]">{stats.indicators || 67} Indicators</h3>
                <p className="mt-1 text-sm text-[--text-secondary]">
                  From CO2 per capita to renewable share, ND-GAIN vulnerability to NDC targets.
                </p>
              </div>
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      {/* ── 5. LIVE PREVIEW ──────────────────────────────────────────────── */}
      <section className="bg-[--bg-section] px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollFadeIn direction="left">
              <SectionDot label="Preview" />
              <h2 className="text-3xl font-bold text-[--text-primary]">
                Every country gets a grade.
              </h2>
              <p className="mt-3 text-lg text-[--text-secondary]">
                Transparent, data-driven scores across 5 domains. No guesswork, no greenwashing — just the numbers.
              </p>
              <Link
                href="/report/KOR"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[--accent-primary] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0052CC]"
              >
                See South Korea's Report Card
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </ScrollFadeIn>

            <ScrollFadeIn direction="right" delay={0.15}>
              <div className="rounded-2xl border border-[--border-card] bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{iso3ToFlag('KOR')}</span>
                  <div>
                    <p className="text-lg font-bold text-[--text-primary]">South Korea</p>
                    <p className="text-sm text-[--text-muted]">Climate Report Card</p>
                  </div>
                  <span className="ml-auto rounded-lg bg-amber-50 px-3 py-1 text-lg font-bold text-amber-600">C+</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Emissions', score: 69.4, color: '#0066FF' },
                    { label: 'Energy Transition', score: 32.2, color: '#00A67E' },
                    { label: 'Policy & Governance', score: 45.7, color: '#F59E0B' },
                    { label: 'Resilience', score: 95.3, color: '#10B981' },
                    { label: 'Social Equity', score: 91.3, color: '#8B5CF6' },
                  ].map(d => (
                    <div key={d.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-[--text-secondary]">{d.label}</span>
                        <span className="font-mono text-sm font-bold text-[--text-primary]">{d.score}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      {/* ── 6. POSTER SHOWCASE ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <ScrollFadeIn>
            <SectionDot label="Posters" />
            <h2 className="text-center text-3xl font-bold text-[--text-primary]">Data that travels.</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-[--text-secondary]">
              Download chart posters and share climate data where it matters most.
            </p>
          </ScrollFadeIn>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { title: 'CO2 Emissions Trend', subtitle: 'Per capita over 30 years', gradient: 'from-blue-500 to-cyan-400' },
              { title: 'Energy Mix Breakdown', subtitle: 'Fossil vs Renewable share', gradient: 'from-emerald-500 to-teal-400' },
              { title: 'Climate Risk Profile', subtitle: 'Vulnerability & Readiness', gradient: 'from-amber-500 to-orange-400' },
            ].map((poster, i) => (
              <ScrollFadeIn key={poster.title} delay={i * 0.1}>
                <div className="card-hover overflow-hidden rounded-2xl border border-[--border-card] bg-white">
                  <div className={`flex h-44 items-end bg-gradient-to-br ${poster.gradient} p-5`}>
                    <div>
                      <p className="text-xs font-medium text-white/70">VisualClimate</p>
                      <p className="text-lg font-bold text-white">{poster.title}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-[--text-secondary]">{poster.subtitle}</p>
                  </div>
                </div>
              </ScrollFadeIn>
            ))}
          </div>

          <ScrollFadeIn delay={0.3}>
            <div className="mt-8 text-center">
              <Link href="/posters" className="inline-flex items-center gap-1 text-sm font-semibold text-[--accent-primary] hover:underline">
                See all posters
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── 7. DATA SOURCES ──────────────────────────────────────────────── */}
      <section className="border-y border-[--border-card] bg-[--bg-section] px-6 py-10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-8 text-sm font-medium text-[--text-muted]">
          <span className="mr-2 text-xs uppercase tracking-wider">Powered by</span>
          {['World Bank WDI', 'Ember', 'ND-GAIN', 'OWID / GCP', 'Climate TRACE'].map(src => (
            <span key={src} className="text-[--text-secondary]">{src}</span>
          ))}
        </div>
      </section>

      {/* ── 8. CTA ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px] text-center">
          <ScrollFadeIn>
            <h2 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">Search your country.</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-[--text-secondary]">
              Find out if your country is a Changer, Starter, or Talker.
            </p>
            <div className="mx-auto mt-8 max-w-2xl">
              <HeroSearch countries={countryList} />
            </div>
          </ScrollFadeIn>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {CTA_COUNTRIES.map((c, i) => (
              <ScrollFadeIn key={c.iso3} delay={i * 0.1}>
                <Link href={`/report/${c.iso3}`} className="card-hover block rounded-2xl border border-[--border-card] bg-white p-6 text-left transition-all hover:border-[--accent-primary]">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{iso3ToFlag(c.iso3)}</span>
                    <div className="flex-1">
                      <p className="font-bold text-[--text-primary]">{c.name}</p>
                      <p className="text-xs text-[--text-muted]">{c.cls}</p>
                    </div>
                    <span className="rounded-lg px-3 py-1.5 text-xl font-bold" style={{ backgroundColor: `${GRADE_COLORS[c.grade]}15`, color: GRADE_COLORS[c.grade] }}>
                      {c.grade}
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${c.score}%`, backgroundColor: GRADE_COLORS[c.grade] }} />
                  </div>
                  <p className="mt-2 text-right font-mono text-sm font-bold" style={{ color: GRADE_COLORS[c.grade] }}>{c.score}</p>
                </Link>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
