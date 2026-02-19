import Link from 'next/link';
import Image from 'next/image';
import { createServiceClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/StatCard';
import { createMetaTags } from '@/components/seo/MetaTags';
import { WorldScoreboard, type CountryClass } from '@/components/charts/WorldScoreboard';
// import { HomeStripes } from './HomeStripes'; // disabled — D3 SSR fix pending

export const metadata = createMetaTags({
  title: 'Climate Intelligence for Sustainability Professionals',
  description: 'Open climate data platform. 6 pilot countries. Real-time indicators for ESG analysts, consultants, and sustainability managers.',
  path: '/',
});

const PILOT_COUNTRIES = [
  { iso3: 'KOR', name: 'South Korea', flag: 'kr', context: 'High-income Asia, energy transition' },
  { iso3: 'USA', name: 'United States', flag: 'us', context: 'Largest historical emitter' },
  { iso3: 'DEU', name: 'Germany', flag: 'de', context: 'EU leader, Energiewende' },
  { iso3: 'BRA', name: 'Brazil', flag: 'br', context: 'Tropical forests, LULUCF' },
  { iso3: 'NGA', name: 'Nigeria', flag: 'ng', context: "Africa's largest economy" },
  { iso3: 'BGD', name: 'Bangladesh', flag: 'bd', context: 'Extreme climate vulnerability' },
];

const KEY_FINDINGS = [
  { title: 'CO2 Divergence', stat: '3x', desc: 'Korea emits 3x the global average per capita while Bangladesh stays below 1 tCO2e.' },
  { title: 'Paris Effect', stat: '-1.2%', desc: 'Post-2015 CAGR shows deceleration in high-income emitters vs. pre-Paris trends.' },
  { title: 'Vulnerability Gap', stat: '2.4x', desc: "Bangladesh's ND-GAIN vulnerability score is 2.4x higher than Germany's." },
  { title: 'Energy Transition', stat: '46%', desc: "Brazil leads with 46% renewable electricity; Nigeria trails at under 20%." },
];

const COUNTRY_NAMES_MAP: Record<string, string> = {
  KOR: 'South Korea', USA: 'United States', DEU: 'Germany',
  BRA: 'Brazil', NGA: 'Nigeria', BGD: 'Bangladesh',
};

async function getStripesData() {
  try {
    const supabase = createServiceClient();
    const isos = PILOT_COUNTRIES.map(c => c.iso3);
    const { data: rows } = await supabase
      .from('country_data')
      .select('country_iso3, year, value')
      .in('country_iso3', isos)
      .eq('indicator_code', 'EN.GHG.CO2.PC.CE.AR5')
      .gte('year', 2000)
      .lte('year', 2023)
      .order('year', { ascending: true });

    const byCountry: Record<string, { year: number; value: number }[]> = {};
    for (const r of rows || []) {
      if (r.value == null) continue;
      if (!byCountry[r.country_iso3]) byCountry[r.country_iso3] = [];
      byCountry[r.country_iso3].push({ year: r.year, value: Number(r.value) });
    }
    return isos.map(iso3 => ({
      country: COUNTRY_NAMES_MAP[iso3] || iso3,
      iso3,
      data: byCountry[iso3] || [],
    }));
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const supabase = createServiceClient();
    const [countries, indicators, dataPoints] = await Promise.all([
      supabase.from('countries').select('*', { count: 'exact', head: true }),
      supabase.from('indicators').select('*', { count: 'exact', head: true }),
      supabase.from('country_data').select('*', { count: 'exact', head: true }),
    ]);
    return {
      countries: countries.count ?? 0,
      indicators: indicators.count ?? 0,
      dataPoints: dataPoints.count ?? 0,
    };
  } catch {
    return { countries: 0, indicators: 0, dataPoints: 0 };
  }
}

const CLASS_NAME: Record<number, CountryClass['cls']> = { 1: 'Changer', 2: 'Starter', 3: 'Talker' };

async function getScoreboardPreview(): Promise<CountryClass[]> {
  try {
    const supabase = createServiceClient();
    const [{ data: clsRows }, { data: metricRows }, { data: cntRows }] = await Promise.all([
      supabase.from('country_data').select('country_iso3, value').eq('indicator_code', 'DERIVED.CLIMATE_CLASS').eq('year', 2023),
      supabase.from('country_data').select('country_iso3, indicator_code, year, value')
        .in('indicator_code', ['EN.GHG.CO2.PC.CE.AR5', 'EMBER.RENEWABLE.PCT']).gte('year', 2018).order('year', { ascending: false }),
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
      cls:       CLASS_NAME[r.value] ?? 'Talker',
      co2:       co2Map.get(r.country_iso3),
      renewable: renMap.get(r.country_iso3),
    }));
  } catch { return []; }
}

async function getCountryMetrics() {
  try {
    const supabase = createServiceClient();
    const isos = PILOT_COUNTRIES.map(c => c.iso3);

    const { data: rows } = await supabase
      .from('country_data')
      .select('country_iso3, indicator_code, year, value')
      .in('country_iso3', isos)
      .in('indicator_code', ['EN.GHG.CO2.PC.CE.AR5', 'EMBER.RENEWABLE.PCT'])
      .order('year', { ascending: false });

    const metrics: Record<string, { co2?: string; renewable?: string }> = {};
    for (const r of rows || []) {
      if (r.value == null) continue;
      if (!metrics[r.country_iso3]) metrics[r.country_iso3] = {};
      const m = metrics[r.country_iso3];
      if (r.indicator_code === 'EN.GHG.CO2.PC.CE.AR5' && !m.co2) {
        m.co2 = Number(r.value).toFixed(1) + ' tCO2e';
      }
      if (r.indicator_code === 'EMBER.RENEWABLE.PCT' && !m.renewable) {
        m.renewable = Number(r.value).toFixed(0) + '%';
      }
    }
    return metrics;
  } catch {
    return {};
  }
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [stats, metrics, scoreboardData] = await Promise.all([getStats(), getCountryMetrics(), getScoreboardPreview()]);

  return (
    <div>
      {/* Hero */}
      <section className="px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[--text-primary] sm:text-5xl lg:text-6xl">
            Climate Intelligence for{' '}
            <span className="text-[--accent-primary]">Sustainability Professionals</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[--text-secondary] sm:text-xl">
            Open climate data platform. 6 pilot countries. Real-time indicators for ESG analysts, consultants, and sustainability managers.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[--accent-primary] px-8 py-4 text-lg font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
            >
              Explore Dashboard
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/compare?countries=KOR,USA"
              className="inline-flex items-center gap-2 rounded-full border border-[--border-card] px-8 py-4 text-lg font-semibold text-[--text-primary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
            >
              Compare Countries
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-16">
        <div className="mx-auto grid max-w-[1200px] gap-6 md:grid-cols-3">
          <StatCard title="Countries" value="6" trend={{ direction: 'up', label: '6 pilot countries live' }} />
          <StatCard title="Indicators" value={stats.indicators.toLocaleString()} unit="metrics" trend={{ direction: 'flat', label: 'GHG, energy, land, risk, economy' }} />
          <StatCard title="Data Points" value={stats.dataPoints.toLocaleString()} unit="rows" trend={{ direction: 'up', label: '2000\u20132023 time series' }} />
        </div>
      </section>

      {/* Key Findings */}
      <section className="border-t border-[--border-card] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-8 text-center text-3xl font-bold text-[--text-primary]">Key Findings</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {KEY_FINDINGS.map((f) => (
              <div key={f.title} className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm font-medium text-[--text-secondary]">{f.title}</p>
                <p className="mt-2 font-mono text-3xl font-bold text-[--accent-primary]">{f.stat}</p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-muted]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* World Scoreboard mini */}
      <section className="border-t border-[--border-card] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[--text-primary]">Who is actually reducing emissions?</h2>
              <p className="mt-2 text-[--text-secondary]">Climate action classification · 212 countries · CO₂ CAGR 2015–2023 + Renewable growth</p>
            </div>
            <Link href="/posters" className="shrink-0 text-sm font-medium text-[--accent-primary] hover:underline">
              Open Posters →
            </Link>
          </div>
          {scoreboardData.length > 0 ? (
            <Link href="/posters" className="block rounded-xl border border-[--border-card] overflow-hidden hover:shadow-md transition-shadow" style={{ boxShadow: 'var(--shadow-card)' }}>
              <WorldScoreboard countries={scoreboardData} width={1200} height={580} />
            </Link>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-[--border-card] bg-[--bg-section] text-sm text-[--text-muted]">
              Loading world map…
            </div>
          )}
        </div>
      </section>

      {/* Pilot Countries */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-8 text-center text-3xl font-bold text-[--text-primary]">6 Pilot Countries</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILOT_COUNTRIES.map((c) => {
              const m = metrics[c.iso3];
              return (
                <Link
                  key={c.iso3}
                  href={`/country/${c.iso3}`}
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
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-[--text-primary] group-hover:text-[--accent-primary]">{c.name}</p>
                    <p className="text-sm text-[--text-muted]">{c.context}</p>
                    {m && (
                      <div className="mt-2 flex gap-4 text-xs font-medium text-[--text-secondary]">
                        {m.co2 && <span>CO2: {m.co2}</span>}
                        {m.renewable && <span>Renewable: {m.renewable}</span>}
                      </div>
                    )}
                  </div>
                  <svg className="mt-1 h-5 w-5 text-[--text-muted] group-hover:text-[--accent-primary]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
