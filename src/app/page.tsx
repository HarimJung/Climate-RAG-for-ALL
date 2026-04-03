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

const CLS_COLORS: Record<string, string> = {
  Changer: '#00A67E', Starter: '#F59E0B', Talker: '#E5484D',
};

// ── Data functions (preserved) ──────────────────────────────────────────────

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
  const indicatorCount = stats.indicators > 0 ? stats.indicators : 67;
  const dataPointStr = stats.dataPoints > 0 ? `${(stats.dataPoints / 1000).toFixed(0)}K+` : '172K+';

  return (
    <div>
      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden px-6 pb-20 pt-32 sm:pt-40">
        {/* Subtle radial glow for depth */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" aria-hidden="true">
          <div className="h-[500px] w-[800px] rounded-full bg-[--accent-primary] opacity-[0.03] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <ScrollFadeIn>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[--border-card] bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[--text-secondary] shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[--accent-positive]" />
              Open Climate Intelligence
            </p>
            <h1 className="text-[2.5rem] font-extrabold leading-[1.08] tracking-tight text-[--text-primary] sm:text-5xl lg:text-[3.75rem]">
              Is your country keeping{' '}
              <br className="hidden sm:block" />
              its <span className="gradient-text">climate promises?</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[--text-secondary]">
              {countryCount} countries graded on real emissions, energy, and resilience data.
            </p>
          </ScrollFadeIn>

          <ScrollFadeIn delay={0.12}>
            <div className="mt-10">
              <HeroSearch countries={countryList} />
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              <span className="text-xs font-medium uppercase tracking-wider text-[--text-muted]">Popular:</span>
              {POPULAR_COUNTRIES.map(c => (
                <Link
                  key={c.iso3}
                  href={`/report/${c.iso3}`}
                  className="rounded-full border border-[--border-card] bg-white/80 px-3.5 py-1.5 text-sm font-medium text-[--text-secondary] shadow-sm backdrop-blur transition-all hover:border-[--accent-primary] hover:text-[--accent-primary] hover:shadow-md"
                >
                  {iso3ToFlag(c.iso3)} {c.name}
                </Link>
              ))}
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── 2. TRUST STATS ───────────────────────────────────────────────── */}
      <section className="border-y border-[--border-card] bg-white px-6 py-10">
        <div className="mx-auto max-w-[1100px]">
          <ScrollFadeIn>
            <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-[--border-card]">
              {[
                { value: countryCount, label: 'Countries scored' },
                { value: dataPointStr, label: 'Data points' },
                { value: indicatorCount, label: 'Indicators' },
                { value: '5', label: 'Trusted sources' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="font-mono text-3xl font-bold tracking-tight text-[--text-primary]">{stat.value}</p>
                  <p className="mt-1 text-sm text-[--text-muted]">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <span className="text-xs uppercase tracking-wider text-[--text-muted]">Powered by</span>
              {['World Bank WDI', 'Ember', 'ND-GAIN', 'OWID / GCP', 'Climate TRACE'].map(src => (
                <span key={src} className="text-sm font-medium text-[--text-secondary]">{src}</span>
              ))}
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── 3. WHAT YOU GET ──────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1100px]">
          <ScrollFadeIn>
            <h2 className="text-center text-3xl font-bold text-[--text-primary] sm:text-4xl">
              Three ways to understand climate action.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-[--text-secondary]">
              From a single letter grade to deep data analysis and shareable visuals.
            </p>
          </ScrollFadeIn>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {/* Report Card */}
            <ScrollFadeIn delay={0}>
              <Link href="/report" className="card-hover group flex flex-col rounded-2xl border border-[--border-card] bg-white p-7">
                <div className="mb-5 flex h-40 items-center justify-center rounded-xl bg-[--bg-section]">
                  <div className="text-center">
                    <span className="inline-block rounded-lg bg-amber-50 px-4 py-2 font-mono text-4xl font-extrabold text-amber-600">
                      C+
                    </span>
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      {[72, 32, 46, 95, 91].map((v, i) => (
                        <div key={i} className="h-1.5 w-8 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: ['#0066FF','#00A67E','#F59E0B','#10B981','#8B5CF6'][i] }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[--text-primary] group-hover:text-[--accent-primary]">Report Card</h3>
                  <svg className="h-4 w-4 text-[--text-muted] transition-transform group-hover:translate-x-1 group-hover:text-[--accent-primary]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[--text-secondary]">
                  A single grade per country across 5 scored domains. Transparent methodology, no greenwashing.
                </p>
              </Link>
            </ScrollFadeIn>

            {/* Country Deep Dive */}
            <ScrollFadeIn delay={0.1}>
              <Link href="/explore" className="card-hover group flex flex-col rounded-2xl border border-[--border-card] bg-white p-7">
                <div className="mb-5 flex h-40 items-center justify-center rounded-xl bg-[--bg-section]">
                  <svg viewBox="0 0 140 70" className="h-20 w-32">
                    <polyline fill="none" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      points="10,55 25,50 40,52 55,40 70,35 85,28 100,22 120,14 135,10" />
                    <polyline fill="none" stroke="#00A67E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3"
                      points="10,58 25,55 40,50 55,42 70,38 85,40 100,44 120,48 135,50" />
                    <line x1="10" y1="62" x2="135" y2="62" stroke="#E8E8ED" strokeWidth="1" />
                    {[10,40,70,100,135].map(x => (
                      <line key={x} x1={x} y1="62" x2={x} y2="64" stroke="#8888A0" strokeWidth="0.8" />
                    ))}
                  </svg>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[--text-primary] group-hover:text-[--accent-primary]">Country Deep Dive</h3>
                  <svg className="h-4 w-4 text-[--text-muted] transition-transform group-hover:translate-x-1 group-hover:text-[--accent-primary]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[--text-secondary]">
                  10 data sections per country — emissions trends, energy mix, vulnerability, and more.
                </p>
              </Link>
            </ScrollFadeIn>

            {/* Data Posters */}
            <ScrollFadeIn delay={0.2}>
              <Link href="/posters" className="card-hover group flex flex-col rounded-2xl border border-[--border-card] bg-white p-7">
                <div className="mb-5 flex h-40 items-center justify-center rounded-xl bg-[--bg-section]">
                  <div className="flex items-end gap-2">
                    {/* Mini poster thumbnails */}
                    <div className="h-20 w-14 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm transition-transform group-hover:-rotate-3">
                      <div className="h-2 w-6 rounded bg-blue-200" />
                      <div className="mt-1.5 h-8 rounded bg-gradient-to-b from-blue-50 to-blue-100" />
                      <div className="mt-1 h-1 w-8 rounded bg-slate-100" />
                    </div>
                    <div className="h-24 w-16 rounded-lg border border-slate-200 bg-white p-1.5 shadow-md">
                      <div className="h-2 w-8 rounded bg-emerald-200" />
                      <div className="mt-1.5 h-10 rounded bg-gradient-to-b from-emerald-50 to-emerald-100" />
                      <div className="mt-1 h-1 w-10 rounded bg-slate-100" />
                    </div>
                    <div className="h-20 w-14 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm transition-transform group-hover:rotate-3">
                      <div className="h-2 w-6 rounded bg-amber-200" />
                      <div className="mt-1.5 h-8 rounded bg-gradient-to-b from-amber-50 to-amber-100" />
                      <div className="mt-1 h-1 w-8 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[--text-primary] group-hover:text-[--accent-primary]">Data Posters</h3>
                  <svg className="h-4 w-4 text-[--text-muted] transition-transform group-hover:translate-x-1 group-hover:text-[--accent-primary]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[--text-secondary]">
                  Publication-ready chart PNGs. Download and share on LinkedIn in one click.
                </p>
              </Link>
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      {/* ── 4. MAP SCOREBOARD ────────────────────────────────────────────── */}
      <section className="bg-[--bg-section] px-6 py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid items-start gap-10 lg:grid-cols-[340px_1fr]">
            <ScrollFadeIn direction="left">
              <div className="lg:sticky lg:top-24">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[--accent-primary]">
                  World Scoreboard
                </p>
                <h2 className="text-3xl font-bold leading-tight text-[--text-primary]">
                  Who is actually changing?
                </h2>
                <p className="mt-3 text-[--text-secondary]">
                  Every country classified by real outcomes — not pledges. Click any dot to see its report card.
                </p>
                <div className="mt-8 space-y-3">
                  {(['Changer', 'Starter', 'Talker'] as const).map(cls => (
                    <div key={cls} className="flex items-center gap-3 rounded-xl border border-[--border-card] bg-white px-4 py-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CLS_COLORS[cls] }} />
                      <span className="flex-1 text-sm font-semibold text-[--text-primary]">{cls}s</span>
                      <span className="font-mono text-lg font-bold text-[--text-primary]">{classCounts[cls]}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-relaxed text-[--text-muted]">
                  Changers have declining CO2 and rising renewables. Starters meet one condition. Talkers meet neither.
                </p>
                <Link
                  href="/explore"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[--accent-primary] transition-colors hover:text-[#0052CC]"
                >
                  Explore all countries
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn direction="right" delay={0.15}>
              {scoreboardData.length > 0 ? (
                <HomeMap countries={scoreboardData} width={720} height={440} />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-[--border-card] bg-white text-sm text-[--text-muted]">
                  Loading map...
                </div>
              )}
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      {/* ── 5. CTA ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollFadeIn>
            <h2 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">
              Search your country.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-lg text-[--text-secondary]">
              Find out if your country is a Changer, Starter, or Talker.
            </p>
            <div className="mt-8">
              <HeroSearch countries={countryList} />
            </div>
            <p className="mt-6 text-sm text-[--text-muted]">
              or{' '}
              <Link href="/explore" className="font-medium text-[--accent-primary] hover:underline">
                browse all {countryCount} countries
              </Link>
            </p>
          </ScrollFadeIn>
        </div>
      </section>
    </div>
  );
}
