import { createServiceClient } from '@/lib/supabase/server';
import { createMetaTags } from '@/components/seo/MetaTags';
import { Metadata } from 'next';
import Link from 'next/link';
import { DashboardClient } from '@/app/dashboard/DashboardClient';
import { CompareClient } from '@/app/compare/CompareClient';
import type { CountryCard } from '@/app/dashboard/page';
import type { CountryCompareData } from '@/app/compare/page';
import { CLIMATE_INDICATORS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const CLASS_NAME_MAP: Record<number, CountryCard['climateClass']> = { 1: 'Changer', 2: 'Starter', 3: 'Talker' };

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ tab?: string }> }): Promise<Metadata> {
  const { tab = 'dashboard' } = await searchParams;
  const tabLabel = tab === 'compare' ? 'Compare' : 'Dashboard';
  return createMetaTags({
    title: `Explore — ${tabLabel} · VisualClimate`,
    description: 'Explore climate data: country dashboard and side-by-side comparison.',
    path: `/explore?tab=${tab}`,
  });
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchDashboardCountries(): Promise<CountryCard[]> {
  try {
    const supabase = createServiceClient();
    const [countriesRes, co2Res, renewableRes, gdpRes, classRes, gradeRes] = await Promise.all([
      supabase.from('countries').select('iso3, name, region').order('name'),
      supabase.from('country_data').select('country_iso3, value, year')
        .eq('indicator_code', 'EN.GHG.CO2.PC.CE.AR5').in('year', [2022, 2021, 2020]).gt('value', 0).order('year', { ascending: false }),
      supabase.from('country_data').select('country_iso3, value, year')
        .eq('indicator_code', 'EMBER.RENEWABLE.PCT').in('year', [2023, 2022, 2021]).gt('value', 0).order('year', { ascending: false }),
      supabase.from('country_data').select('country_iso3, value, year')
        .eq('indicator_code', 'NY.GDP.PCAP.CD').in('year', [2022, 2021, 2020]).gt('value', 0).order('year', { ascending: false }),
      supabase.from('country_data').select('country_iso3, value').eq('indicator_code', 'DERIVED.CLIMATE_CLASS').eq('year', 2023),
      supabase.from('country_data').select('country_iso3, indicator_code, value')
        .in('indicator_code', ['REPORT.GRADE', 'REPORT.TOTAL_SCORE']).eq('year', 2024),
    ]);
    const GRADE_LABELS: Record<number, string> = { 7:'A+',6:'A',5:'B+',4:'B',3:'C+',2:'C',1:'D',0:'F' };
    const co2Map = new Map<string, number>();
    for (const r of co2Res.data ?? []) { if (!co2Map.has(r.country_iso3) && r.value != null) co2Map.set(r.country_iso3, Number(r.value)); }
    const renewableMap = new Map<string, number>();
    for (const r of renewableRes.data ?? []) { if (!renewableMap.has(r.country_iso3) && r.value != null) renewableMap.set(r.country_iso3, Number(r.value)); }
    const gdpMap = new Map<string, number>();
    for (const r of gdpRes.data ?? []) { if (!gdpMap.has(r.country_iso3) && r.value != null) gdpMap.set(r.country_iso3, Number(r.value)); }
    const classMap = new Map<string, number>();
    for (const r of classRes.data ?? []) classMap.set(r.country_iso3, Number(r.value));
    const gradeMap = new Map<string, string>();
    const scoreMap = new Map<string, number>();
    for (const r of (gradeRes.data ?? []) as { country_iso3: string; indicator_code: string; value: number }[]) {
      if (r.indicator_code === 'REPORT.GRADE') gradeMap.set(r.country_iso3, GRADE_LABELS[Math.round(r.value)] ?? 'F');
      if (r.indicator_code === 'REPORT.TOTAL_SCORE') scoreMap.set(r.country_iso3, r.value);
    }
    return (countriesRes.data ?? []).map((c: { iso3: string; name: string; region?: string }) => {
      const iso3 = c.iso3.trim().toUpperCase();
      const clsNum = classMap.get(iso3);
      return {
        iso3, name: c.name, region: c.region,
        co2: co2Map.get(iso3), renewable: renewableMap.get(iso3), gdp: gdpMap.get(iso3),
        climateClass: clsNum ? CLASS_NAME_MAP[clsNum] : undefined,
        grade: gradeMap.get(iso3), totalScore: scoreMap.get(iso3),
      };
    });
  } catch { return []; }
}

async function fetchCompareData(isos: string[]): Promise<{ initialData: CountryCompareData[]; allCountries: { iso3: string; name: string; region: string }[] }> {
  try {
    const supabase = createServiceClient();
    const codes = CLIMATE_INDICATORS.map(i => i.code);
    const [rowsRes, allRes] = await Promise.all([
      supabase.from('country_data').select('country_iso3, indicator_code, year, value')
        .in('country_iso3', isos).in('indicator_code', codes).order('year', { ascending: false }),
      supabase.from('countries').select('iso3, name, region').order('name'),
    ]);
    const rows = rowsRes.data ?? [];
    const allCountries = (allRes.data ?? []).map((c: { iso3: string; name: string; region: string }) => ({
      iso3: c.iso3.trim(), name: c.name, region: c.region,
    }));
    const initialData: CountryCompareData[] = isos.map(iso3 => {
      const countryRows = rows.filter(r => r.country_iso3 === iso3);
      const indicators: Record<string, { value: number; year: number } | null> = {};
      for (const code of codes) {
        const row = countryRows.find(r => r.indicator_code === code && r.value != null);
        indicators[code] = row ? { value: Number(row.value), year: row.year } : null;
      }
      const cname = allCountries.find(c => c.iso3 === iso3)?.name ?? iso3;
      return { iso3, name: cname, indicators };
    });
    return { initialData, allCountries };
  } catch { return { initialData: [], allCountries: [] }; }
}

// ── Tab bar (shared UI) ───────────────────────────────────────────────────────

function TabBar({ active }: { active: string }) {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'compare',   label: 'Compare' },
  ];
  return (
    <div className="mb-8 flex gap-1 rounded-xl border border-[--border-card] bg-[--bg-section] p-1 w-fit">
      {tabs.map(t => (
        <Link
          key={t.key}
          href={`/explore?tab=${t.key}`}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ tab?: string; countries?: string }> }) {
  const { tab: rawTab = 'dashboard', countries: countriesParam } = await searchParams;
  const tab = rawTab === 'compare' ? 'compare' : 'dashboard';

  let dashboardCountries: CountryCard[] = [];
  let compareData: { initialData: CountryCompareData[]; allCountries: { iso3: string; name: string; region: string }[] } = { initialData: [], allCountries: [] };

  if (tab === 'dashboard') {
    dashboardCountries = await fetchDashboardCountries();
  } else if (tab === 'compare') {
    const selected = countriesParam ? countriesParam.split(',').slice(0, 5) : ['KOR', 'USA', 'DEU'];
    compareData = await fetchCompareData(selected);
  }

  const withData = dashboardCountries.filter(c => c.co2 != null || c.renewable != null || c.climateClass != null).length;

  return (
    <div className="bg-[--bg-primary] px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[--text-primary]">Explore</h1>
          <p className="mt-1 text-[--text-secondary]">Country data explorer and side-by-side comparison.</p>
        </div>

        <TabBar active={tab} />

        {tab === 'dashboard' && (
          <div>
            <p className="mb-6 text-sm text-[--text-muted]">
              {withData > 0 ? `${withData}+` : '200+'} countries tracked across climate action, emissions, and renewable energy
            </p>
            <DashboardClient countries={dashboardCountries} />
          </div>
        )}

        {tab === 'compare' && (
          <CompareClient
            initialData={compareData.initialData}
            allCountries={compareData.allCountries}
            selectedIso3={countriesParam ? countriesParam.split(',').slice(0, 5) : ['KOR', 'USA', 'DEU']}
          />
        )}

      </div>
    </div>
  );
}
