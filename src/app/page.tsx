import Link from 'next/link';
import Image from 'next/image';
import { createServiceClient } from '@/lib/supabase/server';
import { createMetaTags } from '@/components/seo/MetaTags';
import { WorldScoreboard, type CountryClass } from '@/components/charts/WorldScoreboard';

export const metadata = createMetaTags({
  title: 'VisualClimate — Climate Accountability Through Data',
  description:
    'Track 200+ countries across 60 climate indicators. Who is really reducing emissions? Open data platform for the Paris Agreement era.',
  path: '/',
});

export const dynamic = 'force-dynamic';

const PILOT_COUNTRIES = [
  { iso3: 'KOR', name: 'South Korea', flag: 'kr', context: 'High-income Asia, energy transition' },
  { iso3: 'USA', name: 'United States', flag: 'us', context: 'Largest historical emitter' },
  { iso3: 'DEU', name: 'Germany',       flag: 'de', context: 'EU leader, Energiewende' },
  { iso3: 'BRA', name: 'Brazil',        flag: 'br', context: 'Tropical forests, LULUCF' },
  { iso3: 'NGA', name: 'Nigeria',       flag: 'ng', context: "Africa's largest economy" },
  { iso3: 'BGD', name: 'Bangladesh',    flag: 'bd', context: 'Extreme climate vulnerability' },
];

const CLASS_NAME_MAP: Record<number, CountryClass['cls']> = { 1: 'Changer', 2: 'Starter', 3: 'Talker' };
const CLASS_COLOR: Record<string, string> = {
  Changer: '#10B981',
  Starter: '#F59E0B',
  Talker:  '#EF4444',
};

const GRADE_LABELS: Record<number, string> = {
  7: 'A+', 6: 'A', 5: 'B+', 4: 'B', 3: 'C+', 2: 'C', 1: 'D', 0: 'F',
};
const GRADE_COLOR_FG: Record<string, string> = {
  'A+': '#00A67E', 'A': '#00A67E', 'B+': '#0066FF', 'B': '#0066FF',
  'C+': '#F59E0B', 'C': '#F59E0B', 'D': '#E5484D',  'F': '#E5484D',
};

// ── Data functions ──────────────────────────────────────────────────────────

async function getStats() {
  try {
    const supabase = createServiceClient();
    const [countriesRes, indicatorsRes, dataPointsRes] = await Promise.all([
      supabase.from('country_data').select('country_iso3').eq('indicator_code', 'EN.GHG.CO2.PC.CE.AR5').eq('year', 2022),
      supabase.from('indicators').select('*', { count: 'exact', head: true }),
      supabase.from('country_data').select('*', { count: 'exact', head: true }),
    ]);
    return {
      countries:  countriesRes.data?.length ?? 0,
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
      .from('country_data')
      .select('value')
      .eq('indicator_code', 'DERIVED.CLIMATE_CLASS')
      .eq('year', 2023);
    const counts = { Changer: 0, Starter: 0, Talker: 0 };
    for (const r of data ?? []) {
      if (r.value === 1)      counts.Changer++;
      else if (r.value === 2) counts.Starter++;
      else if (r.value === 3) counts.Talker++;
    }
    return counts;
  } catch {
    return { Changer: 0, Starter: 0, Talker: 0 };
  }
}

async function getCO2Insight() {
  try {
    const supabase = createServiceClient();
    // Large countries (pop > 10M) to avoid small-island outliers
    const { data: popRows } = await supabase
      .from('country_data')
      .select('country_iso3')
      .eq('indicator_code', 'SP.POP.TOTL')
      .eq('year', 2022)
      .gt('value', 10_000_000);
    const largeCodes = new Set((popRows ?? []).map(r => r.country_iso3));

    const { data: co2Rows } = await supabase
      .from('country_data')
      .select('country_iso3, value')
      .eq('indicator_code', 'EN.GHG.CO2.PC.CE.AR5')
      .eq('year', 2022)
      .gt('value', 0);

    const relevant = (co2Rows ?? []).filter(r => largeCodes.has(r.country_iso3));
    if (relevant.length === 0) return null;

    relevant.sort((a, b) => Number(b.value) - Number(a.value));
    const max = relevant[0];
    const min = relevant[relevant.length - 1];
    return {
      maxISO3: max.country_iso3,
      maxVal:  Math.round(Number(max.value) * 10) / 10,
      minISO3: min.country_iso3,
      minVal:  Math.round(Number(min.value) * 10) / 10,
      ratio:   Math.round(Number(max.value) / Number(min.value)),
    };
  } catch {
    return null;
  }
}

async function getRenewableInsight() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('country_data')
      .select('country_iso3, value, year')
      .eq('indicator_code', 'EMBER.RENEWABLE.PCT')
      .in('country_iso3', ['DEU', 'KOR'])
      .order('year', { ascending: false })
      .limit(10);
    const deu = (data ?? []).find(r => r.country_iso3 === 'DEU');
    const kor = (data ?? []).find(r => r.country_iso3 === 'KOR');
    return {
      deuVal: deu ? Math.round(Number(deu.value) * 10) / 10 : null,
      korVal: kor ? Math.round(Number(kor.value) * 10) / 10 : null,
    };
  } catch {
    return { deuVal: null, korVal: null };
  }
}

async function getScoreboardData(): Promise<CountryClass[]> {
  try {
    const supabase = createServiceClient();
    const [{ data: clsRows }, { data: metricRows }, { data: cntRows }] = await Promise.all([
      supabase.from('country_data').select('country_iso3, value').eq('indicator_code', 'DERIVED.CLIMATE_CLASS').eq('year', 2023),
      supabase.from('country_data')
        .select('country_iso3, indicator_code, year, value')
        .in('indicator_code', ['EN.GHG.CO2.PC.CE.AR5', 'EMBER.RENEWABLE.PCT'])
        .gte('year', 2018)
        .order('year', { ascending: false }),
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

async function getFeaturedCountries() {
  try {
    const supabase = createServiceClient();
    const isos = PILOT_COUNTRIES.map(c => c.iso3);
    const [{ data: classRows }, { data: metricRows }, { data: scoreRows }] = await Promise.all([
      supabase.from('country_data').select('country_iso3, value')
        .eq('indicator_code', 'DERIVED.CLIMATE_CLASS').eq('year', 2023).in('country_iso3', isos),
      supabase.from('country_data').select('country_iso3, indicator_code, year, value')
        .in('country_iso3', isos)
        .in('indicator_code', ['EN.GHG.CO2.PC.CE.AR5', 'EMBER.RENEWABLE.PCT'])
        .order('year', { ascending: false }),
      supabase.from('country_data').select('country_iso3, indicator_code, value')
        .in('country_iso3', isos)
        .in('indicator_code', ['REPORT.TOTAL_SCORE', 'REPORT.GRADE'])
        .eq('year', 2024),
    ]);
    const clsMap: Record<string, number> = {};
    for (const r of (classRows ?? [])) clsMap[r.country_iso3] = Number(r.value);
    const co2Map: Record<string, string> = {};
    const renMap: Record<string, string> = {};
    for (const r of (metricRows ?? [])) {
      if (r.value == null) continue;
      if (r.indicator_code === 'EN.GHG.CO2.PC.CE.AR5' && !co2Map[r.country_iso3]) co2Map[r.country_iso3] = Number(r.value).toFixed(1) + 't';
      if (r.indicator_code === 'EMBER.RENEWABLE.PCT'   && !renMap[r.country_iso3]) renMap[r.country_iso3] = Number(r.value).toFixed(0) + '%';
    }
    const gradeNumMap: Record<string, number> = {};
    for (const r of (scoreRows ?? [])) {
      if (r.indicator_code === 'REPORT.GRADE') gradeNumMap[r.country_iso3] = Math.round(Number(r.value));
    }
    return { clsMap, co2Map, renMap, gradeNumMap };
  } catch {
    return { clsMap: {}, co2Map: {}, renMap: {}, gradeNumMap: {} };
  }
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [stats, classCounts, co2Insight, renewableInsight, scoreboardData, featured] = await Promise.all([
    getStats(),
    getClassCounts(),
    getCO2Insight(),
    getRenewableInsight(),
    getScoreboardData(),
    getFeaturedCountries(),
  ]);

  return (
    <div>

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:py-36">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-block rounded-full border border-[--border-card] bg-[--bg-section] px-4 py-1.5 text-sm font-medium text-[--text-secondary]">
            Open climate data platform
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[--text-primary] sm:text-5xl lg:text-6xl">
            Who is really changing?{' '}
            <span className="text-[--accent-negative]">Who is just talking?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[--text-secondary] sm:text-xl">
            Tracking{' '}
            <strong className="text-[--text-primary]">
              {stats.countries > 0 ? `${stats.countries}+` : '200+'} countries
            </strong>
            {' '}×{' '}
            <strong className="text-[--text-primary]">
              {stats.indicators > 0 ? stats.indicators : 60} climate indicators
            </strong>.
            {' '}Data-driven accountability for the Paris Agreement era.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-full bg-[--accent-primary] px-8 py-4 text-lg font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
            >
              Get Report Cards
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#world-map"
              className="inline-flex items-center gap-2 rounded-full border border-[--border-card] px-8 py-4 text-lg font-semibold text-[--text-primary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
            >
              Explore the Map
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. Stats ─────────────────────────────────────────────────────── */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-16">
        <div className="mx-auto grid max-w-[1200px] gap-6 md:grid-cols-3">
          {[
            { value: stats.countries > 0 ? `${stats.countries}+` : '200+', label: 'Countries',    sub: 'Every nation tracked',                             icon: '🌍' },
            { value: stats.indicators > 0 ? String(stats.indicators) : '60', label: 'Indicators', sub: 'Emissions, energy, vulnerability, economy',          icon: '📊' },
            { value: stats.dataPoints > 0 ? `${(stats.dataPoints / 1000).toFixed(0)}K+` : '170K+', label: 'Data Points', sub: '2000–2023 time series', icon: '📈' },
          ].map(card => (
            <div key={card.label} className="rounded-xl border border-[--border-card] bg-white p-6 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="text-3xl">{card.icon}</div>
              <p className="mt-3 font-mono text-4xl font-bold text-[--accent-primary]">{card.value}</p>
              <p className="mt-1 text-base font-semibold text-[--text-primary]">{card.label}</p>
              <p className="mt-1 text-sm text-[--text-muted]">{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. World Map ─────────────────────────────────────────────────── */}
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
            <Link href="/insights" className="shrink-0 text-sm font-medium text-[--accent-primary] hover:underline">
              See methodology →
            </Link>
          </div>

          {/* Legend — bigger and clearer */}
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

      {/* ── 4. Key Findings ───────────────────────────────────────────────── */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-8 text-center text-3xl font-bold text-[--text-primary]">Key Findings</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            <Link href="/insights" className="group block">
              <div className="h-full rounded-xl border border-[--border-card] bg-white p-6 transition-shadow hover:shadow-md" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                  </svg>
                </div>
                <p className="font-mono text-3xl font-bold text-emerald-500">
                  {classCounts.Changer > 0 ? `${classCounts.Changer}` : '64'} countries
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-muted]">
                  are genuinely cutting emissions while growing renewables
                </p>
                <p className="mt-3 text-xs font-medium text-[--accent-primary] opacity-0 transition-opacity group-hover:opacity-100">View analysis →</p>
              </div>
            </Link>

            <Link href="/insights" className="group block">
              <div className="h-full rounded-xl border border-[--border-card] bg-white p-6 transition-shadow hover:shadow-md" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <p className="font-mono text-3xl font-bold text-red-500">
                  {classCounts.Talker > 0 ? `${classCounts.Talker}` : '72'} countries
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-muted]">
                  signed Paris but show no measurable progress on either metric
                </p>
                <p className="mt-3 text-xs font-medium text-[--accent-primary] opacity-0 transition-opacity group-hover:opacity-100">View analysis →</p>
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
                  {co2Insight ? `${co2Insight.maxVal}t vs ${co2Insight.minVal}t` : '14t vs 0.05t'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-muted]">
                  {co2Insight
                    ? `The highest per-capita emitters produce ${co2Insight.ratio}× more CO₂ than the lowest (large nations, 2022)`
                    : 'Extreme CO₂ inequality persists across large nations'}
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

          {/* Report Card CTA */}
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

      {/* ── 5. Featured Countries ─────────────────────────────────────────── */}
      <section className="border-t border-[--border-card] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-8 text-3xl font-bold text-[--text-primary]">Featured Countries</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILOT_COUNTRIES.map(c => {
              const clsNum    = featured.clsMap[c.iso3];
              const cls       = clsNum ? CLASS_NAME_MAP[clsNum] : undefined;
              const gradeNum  = featured.gradeNumMap[c.iso3];
              const grade     = gradeNum !== undefined ? GRADE_LABELS[gradeNum] : undefined;
              return (
                <Link
                  key={c.iso3}
                  href={`/report/${c.iso3}`}
                  className="group flex items-start gap-4 rounded-xl border border-[--border-card] bg-white p-5 transition-all hover:border-[--accent-primary] hover:shadow-md"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <Image
                    src={`https://flagcdn.com/${c.flag}.svg`}
                    alt={`${c.name} flag`}
                    width={48}
                    height={36}
                    className="mt-0.5 rounded shadow"
                    unoptimized
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-[--text-primary] group-hover:text-[--accent-primary]">{c.name}</p>
                      {cls && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: CLASS_COLOR[cls] }}>
                          {cls}
                        </span>
                      )}
                      {grade && (
                        <span className="rounded-full border px-2 py-0.5 text-xs font-bold" style={{ color: GRADE_COLOR_FG[grade], borderColor: GRADE_COLOR_FG[grade] }}>
                          {grade}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-[--text-muted]">{c.context}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-[--text-secondary]">
                      {featured.co2Map[c.iso3] && <span>CO₂ {featured.co2Map[c.iso3]}/cap</span>}
                      {featured.renMap[c.iso3] && <span>Renewable {featured.renMap[c.iso3]}</span>}
                    </div>
                  </div>
                  <svg className="mt-1 h-5 w-5 shrink-0 text-[--text-muted] group-hover:text-[--accent-primary]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[--accent-primary] px-8 py-3 text-base font-semibold text-[--accent-primary] transition-all hover:bg-[--accent-primary] hover:text-white"
            >
              Explore all {stats.countries > 0 ? `${stats.countries}+` : '200+'} countries
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
