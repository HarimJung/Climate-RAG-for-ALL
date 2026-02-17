import Link from 'next/link';
import Image from 'next/image';
import { createServiceClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/StatCard';
import { HomeCharts } from './HomeCharts';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
  title: 'Climate Intelligence for Sustainability Professionals',
  description: 'Open climate data platform. 200 countries. Real-time indicators for ESG analysts, consultants, and sustainability managers.',
  path: '/',
});

const PILOT_COLORS: Record<string, string> = {
  KOR: '#3b82f6', USA: '#ef4444', DEU: '#f59e0b', BRA: '#22c55e', NGA: '#a855f7', BGD: '#06b6d4',
};

const PILOT_COUNTRIES = [
  { iso3: 'KOR', name: 'South Korea', flag: 'kr', color: 'border-blue-500/40' },
  { iso3: 'USA', name: 'United States', flag: 'us', color: 'border-red-500/40' },
  { iso3: 'DEU', name: 'Germany', flag: 'de', color: 'border-amber-500/40' },
  { iso3: 'BRA', name: 'Brazil', flag: 'br', color: 'border-green-500/40' },
  { iso3: 'NGA', name: 'Nigeria', flag: 'ng', color: 'border-purple-500/40' },
  { iso3: 'BGD', name: 'Bangladesh', flag: 'bd', color: 'border-cyan-500/40' },
];

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

async function getChartData() {
  try {
    const supabase = createServiceClient();
    const isos = PILOT_COUNTRIES.map(c => c.iso3);

    // CO2 time series for all pilots — compute yearly average
    const { data: co2Rows } = await supabase
      .from('country_data')
      .select('country_iso3, year, value')
      .eq('indicator_code', 'EN.ATM.CO2E.PC')
      .in('country_iso3', isos)
      .order('year', { ascending: true });

    const yearMap = new Map<number, { sum: number; cnt: number }>();
    for (const r of co2Rows || []) {
      if (r.value == null) continue;
      const e = yearMap.get(r.year) || { sum: 0, cnt: 0 };
      e.sum += Number(r.value);
      e.cnt += 1;
      yearMap.set(r.year, e);
    }
    const co2Avg = Array.from(yearMap.entries())
      .map(([year, { sum, cnt }]) => ({ year, value: sum / cnt }))
      .sort((a, b) => a.year - b.year);

    // Latest CO2 per capita per country
    const latestByCountry: { label: string; value: number; color: string; href: string }[] = [];
    for (const c of PILOT_COUNTRIES) {
      const rows = (co2Rows || []).filter(r => r.country_iso3 === c.iso3 && r.value != null);
      if (rows.length === 0) continue;
      const latest = rows.reduce((a, b) => (a.year > b.year ? a : b));
      latestByCountry.push({
        label: c.name,
        value: Number(latest.value),
        color: PILOT_COLORS[c.iso3] || '#64748b',
        href: `/country/${c.iso3}`,
      });
    }

    return { co2Avg, countryBar: latestByCountry };
  } catch {
    return { co2Avg: [], countryBar: [] };
  }
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [stats, charts] = await Promise.all([getStats(), getChartData()]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-36">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Climate Intelligence for{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Sustainability Professionals
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
            Open climate data platform. {stats.countries} countries. Real-time indicators.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-lg font-semibold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Explore Dashboard
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-8 py-4 text-lg font-semibold text-white transition-colors hover:border-emerald-500/50 hover:bg-slate-800"
            >
              Compare Countries
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-slate-800 px-4 py-16">
        <div className="mx-auto grid max-w-[1200px] gap-6 md:grid-cols-3">
          <StatCard title="Countries" value={stats.countries.toLocaleString()} trend={{ direction: 'up', label: '6 pilot countries live' }} />
          <StatCard title="Indicators" value={stats.indicators.toLocaleString()} unit="metrics" trend={{ direction: 'flat', label: 'GHG, energy, land, risk, economy' }} />
          <StatCard title="Data Points" value={stats.dataPoints.toLocaleString()} unit="rows" trend={{ direction: 'up', label: '2000\u20132023 time series' }} />
        </div>
      </section>

      {/* Charts */}
      <section className="border-t border-slate-800 px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">At a Glance</h2>
          <HomeCharts co2Data={charts.co2Avg} countryBar={charts.countryBar} />
        </div>
      </section>

      {/* Pilot Countries */}
      <section className="border-t border-slate-800 px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">Pilot Countries</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILOT_COUNTRIES.map((c) => (
              <Link
                key={c.iso3}
                href={`/country/${c.iso3}`}
                className={`flex items-center gap-4 rounded-xl border ${c.color} bg-slate-900 p-5 transition-all hover:bg-slate-800 hover:shadow-lg`}
              >
                <Image
                  src={`https://flagcdn.com/${c.flag}.svg`}
                  alt={`${c.name} flag`}
                  width={48}
                  height={36}
                  className="rounded shadow"
                  unoptimized
                />
                <div>
                  <p className="text-lg font-semibold text-white">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.iso3}</p>
                </div>
                <svg className="ml-auto h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
