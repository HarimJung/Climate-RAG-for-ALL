import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { createMetaTags } from '@/components/seo/MetaTags';
import { type CountryClass } from '@/components/charts/WorldScoreboard';
import { HeroSearch } from '@/components/HeroSearch';
import { HomeMap } from '@/components/HomeMap';
import { iso3ToFlag } from '@/lib/iso3ToFlag';

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

// ── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [stats, scoreboardData, countryList] = await Promise.all([
    getStats(),
    getScoreboardData(),
    getCountryList(),
  ]);

  return (
    <div>
      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[--accent-primary]">
            {stats.countries > 0 ? stats.countries : 250} countries climate report card
          </p>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-[--text-primary] sm:text-6xl">
            Is your country keeping its{' '}
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00A67E] bg-clip-text text-transparent">
              climate promise?
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-[--text-secondary]">
            Search any country to see its climate report card — grades backed by real emissions, energy, and climate risk data.
          </p>

          {/* Search bar — central, largest element */}
          <div className="mt-10">
            <HeroSearch countries={countryList} />
          </div>

          {/* Popular country tags */}
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
        </div>
      </section>

      {/* ── 2. World Map ─────────────────────────────────────────────────── */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-3xl font-bold text-[--text-primary]">The Global Scoreboard</h2>
          <p className="mt-2 text-[--text-secondary]">
            Click any country to see its report card
          </p>

          {/* Legend */}
          <div className="mb-6 mt-4 flex flex-wrap gap-5">
            {([
              ['Changer', '#10B981', '\u2193CO\u2082 + \u2191Renewable'],
              ['Starter', '#F59E0B', 'one condition met'],
              ['Talker',  '#EF4444', 'neither condition'],
            ] as const).map(([cls, color, desc]) => (
              <div key={cls} className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-[--text-primary]">{cls}</span>
                <span className="text-sm text-[--text-muted]">\u2014 {desc}</span>
              </div>
            ))}
          </div>

          {scoreboardData.length > 0 ? (
            <HomeMap countries={scoreboardData} width={1200} height={560} />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-[--border-card] bg-white text-sm text-[--text-muted]">
              Loading map\u2026
            </div>
          )}
        </div>
      </section>

      {/* ── 3. Stats bar ─────────────────────────────────────────────────── */}
      <section className="border-t border-[--border-card] px-4 py-12">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-8 text-center">
          <div>
            <p className="font-mono text-4xl font-bold text-[--text-primary]">
              {stats.countries > 0 ? stats.countries : 250}
            </p>
            <p className="mt-1 text-sm text-[--text-muted]">countries tracked</p>
          </div>
          <div className="h-10 w-px bg-[--border-card]" />
          <div>
            <p className="font-mono text-4xl font-bold text-[--text-primary]">
              {stats.indicators > 0 ? stats.indicators : 61}
            </p>
            <p className="mt-1 text-sm text-[--text-muted]">climate indicators</p>
          </div>
          <div className="h-10 w-px bg-[--border-card]" />
          <div>
            <p className="font-mono text-4xl font-bold text-[--text-primary]">
              {stats.dataPoints > 0 ? `${(stats.dataPoints / 1000).toFixed(0)}K+` : '172K+'}
            </p>
            <p className="mt-1 text-sm text-[--text-muted]">data points</p>
          </div>
        </div>
      </section>

      {/* ── 4. Bottom CTA ─────────────────────────────────────────────────── */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-12">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-lg font-semibold text-[--text-primary]">Ready to dive deeper?</p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/explore"
              className="rounded-lg bg-[--accent-primary] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0052CC]"
            >
              Explore all countries
            </Link>
            <Link
              href="/posters"
              className="rounded-lg border border-[--border-card] bg-white px-6 py-3 text-sm font-semibold text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
            >
              Download posters
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
