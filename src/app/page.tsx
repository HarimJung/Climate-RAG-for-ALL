import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { createMetaTags } from '@/components/seo/MetaTags';
import { type CountryClass } from '@/components/charts/WorldScoreboard';
import { HeroSearch } from '@/components/HeroSearch';
import { HomeMap } from '@/components/HomeMap';
import { iso3ToFlag } from '@/lib/iso3ToFlag';
import { ScrollFadeIn } from '@/components/climate/scroll-fade-in';
import { WhoItsFor, WhyTrustThis, HowItWorks } from '@/components/HomePhase2';

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
      <section className="hero-gradient relative overflow-hidden px-6 pb-16 pt-28 sm:pt-36">
        <div className="relative mx-auto max-w-3xl text-center">
          <ScrollFadeIn>
            <h1 className="text-[2.5rem] font-bold leading-[1.06] tracking-[-0.03em] text-[--text-primary] sm:text-[3.25rem] lg:text-[3.75rem]">
              Is your country keeping{' '}
              <br className="hidden sm:block" />
              its <span className="gradient-text">climate promises?</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[--text-secondary]">
              {countryCount} countries graded on real emissions, energy, and resilience data. Open methodology. No opinions.
            </p>
          </ScrollFadeIn>

          <ScrollFadeIn delay={0.12}>
            <div className="mt-9">
              <HeroSearch countries={countryList} />
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn delay={0.2}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[--text-muted]">Popular</span>
              {POPULAR_COUNTRIES.map(c => (
                <Link
                  key={c.iso3}
                  href={`/report/${c.iso3}`}
                  className="rounded-lg border border-[--border-card] bg-white px-3 py-1.5 text-[13px] font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
                >
                  {iso3ToFlag(c.iso3)} {c.name}
                </Link>
              ))}
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── 2. TRUST STATS ───────────────────────────────────────────────── */}
      <section className="border-y border-[--border-card] bg-white px-6 py-8">
        <div className="mx-auto max-w-[960px]">
          <ScrollFadeIn>
            <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
              {[
                { value: countryCount, label: 'Countries' },
                { value: dataPointStr, label: 'Data points' },
                { value: indicatorCount, label: 'Indicators' },
                { value: '5', label: 'Sources' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="font-mono text-[2rem] font-bold tracking-[-0.03em] text-[--text-primary]">{stat.value}</p>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[--text-muted]">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-[--border-card] pt-4">
              {['World Bank', 'Ember', 'ND-GAIN', 'OWID / GCP', 'Climate TRACE'].map((src, i) => (
                <span key={src} className="flex items-center gap-2 text-[12px] text-[--text-muted]">
                  {i > 0 && <span className="text-[--border-card]">&middot;</span>}
                  {src}
                </span>
              ))}
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── 3. WHAT YOU GET ──────────────────────────────────────────────── */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-[1000px]">
          <ScrollFadeIn>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">The platform</p>
            <h2 className="mt-3 text-center text-2xl font-bold tracking-[-0.02em] text-[--text-primary] sm:text-3xl">
              Three ways to understand climate action
            </h2>
          </ScrollFadeIn>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {/* Report Card */}
            <ScrollFadeIn delay={0}>
              <Link href="/report" className="card-hover group flex flex-col rounded-xl border border-[--border-card] bg-white p-6">
                <div className="mb-5 flex h-36 items-center justify-center rounded-lg bg-[--bg-section]">
                  <div className="text-center">
                    <span className="inline-block font-mono text-[2.5rem] font-bold tracking-[-0.04em] text-amber-600">
                      C+
                    </span>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      {[72, 32, 46, 95, 91].map((v, i) => (
                        <div key={i} className="h-1 w-7 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: ['#0066FF','#00A67E','#F59E0B','#10B981','#8B5CF6'][i] }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[--text-muted]">01</p>
                <h3 className="mt-1 text-[15px] font-semibold text-[--text-primary] group-hover:text-[--accent-primary]">Report Card</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[--text-secondary]">
                  One grade per country across 5 scored domains. Transparent methodology.
                </p>
              </Link>
            </ScrollFadeIn>

            {/* Country Deep Dive */}
            <ScrollFadeIn delay={0.1}>
              <Link href="/explore" className="card-hover group flex flex-col rounded-xl border border-[--border-card] bg-white p-6">
                <div className="mb-5 flex h-36 items-center justify-center rounded-lg bg-[--bg-section]">
                  <svg viewBox="0 0 140 70" className="h-16 w-28">
                    <polyline fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      points="10,55 25,50 40,52 55,40 70,35 85,28 100,22 120,14 135,10" />
                    <polyline fill="none" stroke="#00A67E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3"
                      points="10,58 25,55 40,50 55,42 70,38 85,40 100,44 120,48 135,50" />
                    <line x1="10" y1="64" x2="135" y2="64" stroke="#E5E5E0" strokeWidth="0.5" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[--text-muted]">02</p>
                <h3 className="mt-1 text-[15px] font-semibold text-[--text-primary] group-hover:text-[--accent-primary]">Country Deep Dive</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[--text-secondary]">
                  10 data sections per country. Emissions, energy, vulnerability, and more.
                </p>
              </Link>
            </ScrollFadeIn>

            {/* Data Posters */}
            <ScrollFadeIn delay={0.2}>
              <Link href="/posters" className="card-hover group flex flex-col rounded-xl border border-[--border-card] bg-white p-6">
                <div className="mb-5 flex h-36 items-center justify-center rounded-lg bg-[--bg-section]">
                  <div className="flex items-end gap-1.5">
                    <div className="h-16 w-11 rounded border border-[--border-card] bg-white p-1 shadow-sm transition-transform group-hover:-rotate-3">
                      <div className="h-1.5 w-5 rounded-sm bg-blue-200" />
                      <div className="mt-1 h-6 rounded-sm bg-gradient-to-b from-blue-50 to-blue-100" />
                    </div>
                    <div className="h-20 w-14 rounded border border-[--border-card] bg-white p-1 shadow-sm">
                      <div className="h-1.5 w-7 rounded-sm bg-emerald-200" />
                      <div className="mt-1 h-9 rounded-sm bg-gradient-to-b from-emerald-50 to-emerald-100" />
                    </div>
                    <div className="h-16 w-11 rounded border border-[--border-card] bg-white p-1 shadow-sm transition-transform group-hover:rotate-3">
                      <div className="h-1.5 w-5 rounded-sm bg-amber-200" />
                      <div className="mt-1 h-6 rounded-sm bg-gradient-to-b from-amber-50 to-amber-100" />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[--text-muted]">03</p>
                <h3 className="mt-1 text-[15px] font-semibold text-[--text-primary] group-hover:text-[--accent-primary]">Data Posters</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[--text-secondary]">
                  Publication-ready chart PNGs. Download and share on LinkedIn.
                </p>
              </Link>
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      {/* ── 4. MAP SCOREBOARD ────────────────────────────────────────────── */}
      <section className="border-y border-[--border-card] bg-[--bg-section] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid items-start gap-10 lg:grid-cols-[300px_1fr]">
            <ScrollFadeIn direction="left">
              <div className="lg:sticky lg:top-24">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">
                  World Scoreboard
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[--text-primary] sm:text-[1.75rem]">
                  Who is actually<br />changing?
                </h2>
                <p className="mt-3 text-[13px] leading-relaxed text-[--text-secondary]">
                  Every country classified by real outcomes, not pledges.
                </p>
                <div className="mt-6 space-y-2">
                  {(['Changer', 'Starter', 'Talker'] as const).map(cls => (
                    <div key={cls} className="flex items-center gap-3 rounded-lg bg-white px-4 py-2.5 border border-[--border-card]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CLS_COLORS[cls] }} />
                      <span className="flex-1 text-[13px] font-medium text-[--text-primary]">{cls}s</span>
                      <span className="font-mono text-base font-bold tracking-[-0.02em] text-[--text-primary]">{classCounts[cls]}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-[--text-muted]">
                  Changers: declining CO2 + rising renewables. Starters: one condition. Talkers: neither.
                </p>
                <Link
                  href="/explore"
                  className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[--accent-primary] transition-colors hover:text-[#0052CC]"
                >
                  Explore all countries
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            </ScrollFadeIn>

            <ScrollFadeIn direction="right" delay={0.15}>
              {scoreboardData.length > 0 ? (
                <HomeMap countries={scoreboardData} width={720} height={440} />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border border-[--border-card] bg-white text-sm text-[--text-muted]">
                  Loading map...
                </div>
              )}
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      {/* ── Phase 2 sections ────────────────────────────────────────────── */}
      <WhoItsFor />
      <WhyTrustThis />
      <HowItWorks />

      {/* ── 8. FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <ScrollFadeIn>
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-[--text-primary]">
              Search your country
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-[14px] text-[--text-secondary]">
              Changer, Starter, or Talker — find out where your country stands.
            </p>
            <div className="mt-7">
              <HeroSearch countries={countryList} />
            </div>
            <p className="mt-5 text-[13px] text-[--text-muted]">
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
