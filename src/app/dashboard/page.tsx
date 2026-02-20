import { createServiceClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
  title: 'Country Explorer — All Countries',
  description: 'Browse 200+ countries by climate action class. Filter Changers, Starters, and Talkers by CO2 emissions and renewable energy.',
  path: '/dashboard',
});

export const dynamic = 'force-dynamic';

export interface CountryCard {
  iso3: string;
  name: string;
  region?: string;
  co2?: number;
  renewable?: number;
  gdp?: number;
  climateClass?: 'Changer' | 'Starter' | 'Talker';
  grade?: string;
  totalScore?: number;
}

const CLASS_NAME_MAP: Record<number, CountryCard['climateClass']> = { 1: 'Changer', 2: 'Starter', 3: 'Talker' };
const GRADE_LABELS: Record<number, string> = { 7:'A+',6:'A',5:'B+',4:'B',3:'C+',2:'C',1:'D',0:'F' };

async function getAllCountryCards(): Promise<CountryCard[]> {
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

    const co2Map = new Map<string, number>();
    for (const r of (co2Res.data ?? [])) {
      if (!co2Map.has(r.country_iso3) && r.value != null) co2Map.set(r.country_iso3, Number(r.value));
    }
    const renewableMap = new Map<string, number>();
    for (const r of (renewableRes.data ?? [])) {
      if (!renewableMap.has(r.country_iso3) && r.value != null) renewableMap.set(r.country_iso3, Number(r.value));
    }
    const gdpMap = new Map<string, number>();
    for (const r of (gdpRes.data ?? [])) {
      if (!gdpMap.has(r.country_iso3) && r.value != null) gdpMap.set(r.country_iso3, Number(r.value));
    }
    const classMap = new Map<string, number>();
    for (const r of (classRes.data ?? [])) classMap.set(r.country_iso3, Number(r.value));
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
        iso3,
        name:         c.name,
        region:       c.region,
        co2:          co2Map.get(iso3),
        renewable:    renewableMap.get(iso3),
        gdp:          gdpMap.get(iso3),
        climateClass: clsNum ? CLASS_NAME_MAP[clsNum] : undefined,
        grade:        gradeMap.get(iso3),
        totalScore:   scoreMap.get(iso3),
      };
    });
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const countries = await getAllCountryCards();
  const withData  = countries.filter(c => c.co2 != null || c.renewable != null || c.climateClass != null).length;

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">Country Explorer</h1>
          <p className="mt-2 text-lg text-[--text-secondary]">
            {withData > 0 ? `${withData}` : '200'}+ countries tracked across climate action, emissions, and renewable energy
          </p>
        </div>
        <DashboardClient countries={countries} />
      </div>
    </div>
  );
}
