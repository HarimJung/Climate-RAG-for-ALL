import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { createMetaTags } from '@/components/seo/MetaTags';
import { WorldScoreboard, type CountryClass } from '@/components/charts/WorldScoreboard';
import { HeroSearch } from '@/components/HeroSearch';
import { iso3ToFlag } from '@/lib/iso3ToFlag';

export const metadata = createMetaTags({
  title: 'VisualClimate — Climate Accountability Through Data',
  description:
    'Track 200+ countries across 60 climate indicators. Who is really reducing emissions? Open data platform for the Paris Agreement era.',
  path: '/',
});

export const dynamic = 'force-dynamic';

const CLASS_NAME_MAP: Record<number, CountryClass['cls']> = { 1: 'Changer', 2: 'Starter', 3: 'Talker' };
const CLASS_COLOR: Record<string, string> = { Changer: '#10B981', Starter: '#F59E0B', Talker: '#EF4444' };
const CLASS_BG: Record<string, string>    = { Changer: '#ECFDF5', Starter: '#FFFBEB', Talker: '#FEF2F2' };

const GRADE_LABELS: Record<number, string> = { 7: 'A+', 6: 'A', 5: 'B+', 4: 'B', 3: 'C+', 2: 'C', 1: 'D', 0: 'F' };
const GRADE_COLOR: Record<string, string> = {
  'A+': '#10B981', 'A': '#10B981',
  'B+': '#3B82F6', 'B': '#3B82F6',
  'C+': '#F59E0B', 'C': '#F59E0B',
  'D':  '#EF4444',
  'F':  '#991B1B',
};
const GRADE_BG: Record<string, string> = {
  'A+': '#ECFDF5', 'A': '#ECFDF5',
  'B+': '#EFF6FF', 'B': '#EFF6FF',
  'C+': '#FFFBEB', 'C': '#FFFBEB',
  'D':  '#FEF2F2',
  'F':  '#FFF1F2',
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

async function getClassCounts() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('country_data').select('value')
      .eq('indicator_code', 'DERIVED.CLIMATE_CLASS').eq('year', 2023);
    const counts = { Changer: 0, Starter: 0, Talker: 0 };
    for (const r of data ?? []) {
      if (r.value === 1)      counts.Changer++;
      else if (r.value === 2) counts.Starter++;
      else if (r.value === 3) counts.Talker++;
    }
    return counts;
  } catch { return { Changer: 0, Starter: 0, Talker: 0 }; }
}

async function getCO2Insight() {
  try {
    const supabase = createServiceClient();
    const { data: popRows } = await supabase
      .from('country_data').select('country_iso3')
      .eq('indicator_code', 'SP.POP.TOTL').eq('year', 2022).gt('value', 10_000_000);
    const largeCodes = new Set((popRows ?? []).map(r => r.country_iso3));
    const { data: co2Rows } = await supabase
      .from('country_data').select('country_iso3, value')
      .eq('indicator_code', 'EN.GHG.CO2.PC.CE.AR5').eq('year', 2022).gt('value', 0);
    const relevant = (co2Rows ?? []).filter(r => largeCodes.has(r.country_iso3));
    if (relevant.length === 0) return null;
    relevant.sort((a, b) => Number(b.value) - Number(a.value));
    const max = relevant[0];
    const min = relevant[relevant.length - 1];
    return {
      maxVal: Math.round(Number(max.value) * 10) / 10,
      minVal: Math.round(Number(min.value) * 10) / 10,
      ratio:  Math.round(Number(max.value) / Number(min.value)),
    };
  } catch { return null; }
}

async function getRenewableInsight() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('country_data').select('country_iso3, value, year')
      .eq('indicator_code', 'EMBER.RENEWABLE.PCT').in('country_iso3', ['DEU', 'KOR'])
      .order('year', { ascending: false }).limit(10);
    const deu = (data ?? []).find(r => r.country_iso3 === 'DEU');
    const kor = (data ?? []).find(r => r.country_iso3 === 'KOR');
    return {
      deuVal: deu ? Math.round(Number(deu.value) * 10) / 10 : null,
      korVal: kor ? Math.round(Number(kor.value) * 10) / 10 : null,
    };
  } catch { return { deuVal: null, korVal: null }; }
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

interface HomepageCountry {
  iso3: string;
  name: string;
  region: string;
  grade: string;
  cls: 'Changer' | 'Talker';
}

async function getTopChangers(): Promise<HomepageCountry[]> {
  try {
    const supabase = createServiceClient();
    const { data: changerRows } = await supabase
      .from('country_data').select('country_iso3')
      .eq('indicator_code', 'DERIVED.CLIMATE_CLASS').eq('year', 2023).eq('value', 1);
    const changerISOs = (changerRows ?? []).map(r => r.country_iso3);
    if (changerISOs.length === 0) return [];

    const { data: gradeRows } = await supabase
      .from('country_data').select('country_iso3, value')
      .eq('indicator_code', 'REPORT.GRADE').eq('year', 2024)
      .in('country_iso3', changerISOs)
      .order('value', { ascending: false }).limit(5);

    const topISOs = (gradeRows ?? []).map(r => r.country_iso3);
    const { data: countries } = await supabase.from('countries').select('iso3, name, region').in('iso3', topISOs);
    const nameMap = new Map((countries ?? []).map((c: { iso3: string; name: string; region?: string }) => [c.iso3, c]));

    return (gradeRows ?? []).map(r => {
      const c = nameMap.get(r.country_iso3) as { iso3: string; name: string; region?: string } | undefined;
      return {
        iso3:   r.country_iso3,
        name:   c?.name ?? r.country_iso3,
        region: c?.region ?? '',
        grade:  GRADE_LABELS[Math.round(Number(r.value))] ?? 'F',
        cls:    'Changer' as const,
      };
    });
  } catch { return []; }
}

async function getBiggestTalkers(): Promise<HomepageCountry[]> {
  try {
    const supabase = createServiceClient();
    const { data: talkerRows } = await supabase
      .from('country_data').select('country_iso3')
      .eq('indicator_code', 'DERIVED.CLIMATE_CLASS').eq('year', 2023).eq('value', 3);
    const talkerISOs = (talkerRows ?? []).map(r => r.country_iso3);
    if (talkerISOs.length === 0) return [];

    const { data: scoreRows } = await supabase
      .from('country_data').select('country_iso3, value')
      .eq('indicator_code', 'REPORT.TOTAL_SCORE').eq('year', 2024)
      .in('country_iso3', talkerISOs)
      .order('value', { ascending: true }).limit(5);

    const topISOs = (scoreRows ?? []).map(r => r.country_iso3);
    const { data: gradeData } = await supabase
      .from('country_data').select('country_iso3, value')
      .eq('indicator_code', 'REPORT.GRADE').eq('year', 2024).in('country_iso3', topISOs);
    const gradeMap = new Map((gradeData ?? []).map((r: { country_iso3: string; value: number }) => [r.country_iso3, Math.round(Number(r.value))]));

    const { data: countries } = await supabase.from('countries').select('iso3, name, region').in('iso3', topISOs);
    const nameMap = new Map((countries ?? []).map((c: { iso3: string; name: string; region?: string }) => [c.iso3, c]));

    return (scoreRows ?? []).map(r => {
      const c = nameMap.get(r.country_iso3) as { iso3: string; name: string; region?: string } | undefined;
      const gradeNum = gradeMap.get(r.country_iso3) ?? 0;
      return {
        iso3:   r.country_iso3,
        name:   c?.name ?? r.country_iso3,
        region: c?.region ?? '',
        grade:  GRADE_LABELS[gradeNum] ?? 'F',
        cls:    'Talker' as const,
      };
    });
  } catch { return []; }
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [stats, classCounts, co2Insight, renewableInsight, scoreboardData, countryList, topChangers, biggestTalkers] = await Promise.all([
    getStats(),
    getClassCounts(),
    getCO2Insight(),
    getRenewableInsight(),
    getScoreboardData(),
    getCountryList(),
    getTopChangers(),
    getBiggestTalkers(),
  ]);

  const statsSubtitle = [
    stats.countries  > 0 ? `${stats.countries}+ countries` : '200+ countries',
    stats.indicators > 0 ? `${stats.indicators} indicators`  : '60 indicators',
    stats.dataPoints > 0 ? `${(stats.dataPoints / 1000).toFixed(0)}K+ data points` : '170K+ data points',
  ].join(' · ');

  return (
    <div>

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white">
        {/* Background world map */}
        {scoreboardData.length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.18]">
            <WorldScoreboard countries={scoreboardData} width={1440} height={720} />
          </div>
        )}
        {/* Overlay content */}
        <div className="relative z-10 px-4 py-28 sm:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-block rounded-full border border-[--border-card] bg-white/80 px-4 py-1.5 text-sm font-medium text-[--text-secondary] backdrop-blur-sm">
              Open climate accountability platform
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[--text-primary] sm:text-5xl lg:text-6xl">
              Is your country keeping its{' '}
              <span className="text-[--accent-primary]">climate promise?</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[--text-secondary]">
              Check your country&apos;s report card — grades backed by real emissions, energy, and climate risk data.
            </p>

            {/* Search */}
            <div className="mt-8">
              <HeroSearch countries={countryList} />
              <p className="mt-3 text-xs text-[--text-muted]">
                Tracking {statsSubtitle}
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/report"
                className="inline-flex items-center gap-2 rounded-full border border-[--accent-primary] px-6 py-3 text-sm font-semibold text-[--accent-primary] transition-all hover:bg-[--accent-primary] hover:text-white"
              >
                Browse all report cards
              </Link>
              <a
                href="#world-map"
                className="inline-flex items-center gap-2 rounded-full border border-[--border-card] bg-white/80 px-6 py-3 text-sm font-semibold text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
              >
                Explore the map ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. World Map ─────────────────────────────────────────────────── */}
      <section id="world-map" className="scroll-mt-16 border-t border-[--border-card] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[--text-primary]">The Global Scoreboard</h2>
              <p className="mt-2 text-[--text-secondary]">
                {classCounts.Changer > 0
                  ? `${classCounts.Changer} Changers · ${classCounts.Starter} Starters · ${classCounts.Talker} Talkers`
                  : '64 Changers · 80 Starters · 72 Talkers'}
                {' '}— based on post-Paris CO₂ trend and renewable energy growth
              </p>
            </div>
            <Link href="/methodology" className="shrink-0 text-sm font-medium text-[--accent-primary] hover:underline">
              See methodology →
            </Link>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-5">
            {([ ['Changer', '#10B981', '↓CO₂ + ↑Renewable'], ['Starter', '#F59E0B', 'one condition met'], ['Talker', '#EF4444', 'neither condition'] ] as const).map(([cls, color, desc]) => (
              <div key={cls} className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-[--text-primary]">{cls}</span>
                <span className="text-sm text-[--text-muted]">— {desc}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full shrink-0 bg-[#E5E7EB] opacity-70" />
              <span className="text-sm text-[--text-muted]">No data</span>
            </div>
          </div>

          {scoreboardData.length > 0 ? (
            <Link
              href="/posters"
              className="block overflow-hidden rounded-xl border border-[--border-card] transition-shadow hover:shadow-md"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <WorldScoreboard countries={scoreboardData} width={1200} height={560} />
            </Link>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-[--border-card] bg-[--bg-section] text-sm text-[--text-muted]">
              Loading map…
            </div>
          )}
        </div>
      </section>

      {/* ── 3. Key Findings ───────────────────────────────────────────────── */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-8 text-center text-3xl font-bold text-[--text-primary]">Key Findings</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            <Link href="/report" className="group block">
              <div className="h-full rounded-xl border border-[--border-card] bg-white p-6 transition-shadow hover:shadow-md" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                  </svg>
                </div>
                <p className="font-mono text-3xl font-bold text-emerald-500">
                  {classCounts.Changer > 0 ? `${classCounts.Changer}` : '64'} nations
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-muted]">
                  are genuinely cutting emissions while scaling renewables — the real Changers
                </p>
                <p className="mt-3 text-xs font-medium text-[--accent-primary] opacity-0 transition-opacity group-hover:opacity-100">See Changers →</p>
              </div>
            </Link>

            <Link href="/report" className="group block">
              <div className="h-full rounded-xl border border-[--border-card] bg-white p-6 transition-shadow hover:shadow-md" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <p className="font-mono text-3xl font-bold text-red-500">
                  {classCounts.Talker > 0 ? `${classCounts.Talker}` : '72'} nations
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-muted]">
                  signed Paris but show no measurable progress — Talkers, not Doers
                </p>
                <p className="mt-3 text-xs font-medium text-[--accent-primary] opacity-0 transition-opacity group-hover:opacity-100">See Talkers →</p>
              </div>
            </Link>

            <Link href="/insights" className="group block">
              <div className="h-full rounded-xl border border-[--border-card] bg-white p-6 transition-shadow hover:shadow-md" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                  </svg>
                </div>
                <p className="font-mono text-3xl font-bold text-[--accent-primary]">
                  {co2Insight ? `${co2Insight.ratio}×` : '280×'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-muted]">
                  {co2Insight
                    ? 'gap between highest and lowest per-capita emitters among large nations'
                    : 'CO₂ inequality between highest and lowest per-capita emitters'}
                </p>
                <p className="mt-3 text-xs font-medium text-[--accent-primary] opacity-0 transition-opacity group-hover:opacity-100">View analysis →</p>
              </div>
            </Link>

            <Link href="/insights" className="group block">
              <div className="h-full rounded-xl border border-[--border-card] bg-white p-6 transition-shadow hover:shadow-md" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                  <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                  </svg>
                </div>
                <p className="font-mono text-3xl font-bold text-amber-500">
                  {renewableInsight?.deuVal != null ? `${renewableInsight.deuVal}%` : '53%'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-muted]">
                  Germany leads renewable electricity
                  {renewableInsight?.korVal != null
                    ? ` — Korea trails at ${renewableInsight.korVal}%`
                    : ' — while others still lag below 10%'}
                </p>
                <p className="mt-3 text-xs font-medium text-[--accent-primary] opacity-0 transition-opacity group-hover:opacity-100">View analysis →</p>
              </div>
            </Link>

          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-6 py-3 text-sm font-semibold text-[--accent-primary] transition-colors hover:bg-blue-100"
            >
              Get Your Country&apos;s Report Card →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Top Changers & Biggest Talkers ─────────────────────────────── */}
      <section className="border-t border-[--border-card] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-8 lg:grid-cols-2">

            {/* Top Changers */}
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[--text-primary]">Top Changers</h2>
                  <p className="mt-1 text-sm text-[--text-muted]">Highest-scoring countries cutting emissions &amp; growing renewables</p>
                </div>
                <Link href="/report" className="text-sm font-medium text-[--accent-primary] hover:underline">See all →</Link>
              </div>
              <div className="space-y-3">
                {(topChangers.length > 0 ? topChangers : (Array.from({ length: 5 }) as null[])).map((c, i) =>
                  c ? (
                    <Link
                      key={(c as HomepageCountry).iso3}
                      href={`/report/${(c as HomepageCountry).iso3}`}
                      className="group flex items-center gap-4 rounded-xl border border-[--border-card] bg-white p-4 transition-all hover:border-[#10B981] hover:shadow-sm"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      <span className="w-6 text-center text-sm font-bold text-[--text-muted]">{i + 1}</span>
                      <span className="text-2xl">{iso3ToFlag((c as HomepageCountry).iso3)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[--text-primary] group-hover:text-[#10B981]">{(c as HomepageCountry).name}</p>
                        <p className="text-xs text-[--text-muted]">{(c as HomepageCountry).region}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: CLASS_BG[(c as HomepageCountry).cls], color: CLASS_COLOR[(c as HomepageCountry).cls] }}>{(c as HomepageCountry).cls}</span>
                        {(c as HomepageCountry).grade && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: GRADE_BG[(c as HomepageCountry).grade] ?? '#F3F4F6', color: GRADE_COLOR[(c as HomepageCountry).grade] ?? '#6B7280' }}>{(c as HomepageCountry).grade}</span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-[--border-card] bg-gray-50" />
                  )
                )}
              </div>
            </div>

            {/* Biggest Talkers */}
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[--text-primary]">Biggest Talkers</h2>
                  <p className="mt-1 text-sm text-[--text-muted]">Signed Paris — but data shows no measurable progress</p>
                </div>
                <Link href="/report" className="text-sm font-medium text-[--accent-primary] hover:underline">See all →</Link>
              </div>
              <div className="space-y-3">
                {(biggestTalkers.length > 0 ? biggestTalkers : (Array.from({ length: 5 }) as null[])).map((c, i) =>
                  c ? (
                    <Link
                      key={(c as HomepageCountry).iso3}
                      href={`/report/${(c as HomepageCountry).iso3}`}
                      className="group flex items-center gap-4 rounded-xl border border-[--border-card] bg-white p-4 transition-all hover:border-[#EF4444] hover:shadow-sm"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      <span className="w-6 text-center text-sm font-bold text-[--text-muted]">{i + 1}</span>
                      <span className="text-2xl">{iso3ToFlag((c as HomepageCountry).iso3)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[--text-primary] group-hover:text-[#EF4444]">{(c as HomepageCountry).name}</p>
                        <p className="text-xs text-[--text-muted]">{(c as HomepageCountry).region}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: CLASS_BG[(c as HomepageCountry).cls], color: CLASS_COLOR[(c as HomepageCountry).cls] }}>{(c as HomepageCountry).cls}</span>
                        {(c as HomepageCountry).grade && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: GRADE_BG[(c as HomepageCountry).grade] ?? '#F3F4F6', color: GRADE_COLOR[(c as HomepageCountry).grade] ?? '#6B7280' }}>{(c as HomepageCountry).grade}</span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-[--border-card] bg-gray-50" />
                  )
                )}
              </div>
            </div>

          </div>

          <div className="mt-10 text-center">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full border border-[--accent-primary] px-8 py-3 text-base font-semibold text-[--accent-primary] transition-all hover:bg-[--accent-primary] hover:text-white"
            >
              Explore all countries
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
