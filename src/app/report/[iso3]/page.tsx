import { createServiceClient } from '@/lib/supabase/server';
import { createMetaTags } from '@/components/seo/MetaTags';
import { notFound } from 'next/navigation';
import { ReportCardClient } from './ReportCardClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const GRADE_LABELS: Record<number, string> = {
  7: 'A+', 6: 'A', 5: 'B+', 4: 'B', 3: 'C+', 2: 'C', 1: 'D', 0: 'F',
};

export interface ReportCardData {
  iso3: string;
  name: string;
  region: string;
  total: number;
  grade: string;
  gradeNumeric: number;
  climateClass: 'Changer' | 'Starter' | 'Talker' | null;
  emissions:      number | null;
  energy:         number | null;
  economy:        number | null;
  responsibility: number | null;
  resilience:     number | null;
}

export interface PeerContext {
  globalRank: number;
  globalTotal: number;
  incomeGroup: string | null;
  incomeGroupRank: number | null;
  incomeGroupTotal: number | null;
  globalAvg: {
    emissions: number | null;
    energy: number | null;
    economy: number | null;
    responsibility: number | null;
    resilience: number | null;
    total: number | null;
  };
}

async function getReportCard(iso3: string): Promise<ReportCardData | null> {
  try {
    const supabase = createServiceClient();

    const [countryRes, scoresRes, classRes] = await Promise.all([
      supabase.from('countries').select('iso3, name, region').eq('iso3', iso3.toUpperCase()).single(),
      supabase
        .from('country_data')
        .select('indicator_code, value')
        .eq('country_iso3', iso3.toUpperCase())
        .in('indicator_code', [
          'REPORT.TOTAL_SCORE', 'REPORT.GRADE',
          'REPORT.EMISSIONS_SCORE', 'REPORT.ENERGY_SCORE', 'REPORT.ECONOMY_SCORE',
          'REPORT.RESPONSIBILITY_SCORE', 'REPORT.RESILIENCE_SCORE',
        ])
        .eq('year', 2024),
      supabase
        .from('country_data')
        .select('value')
        .eq('country_iso3', iso3.toUpperCase())
        .eq('indicator_code', 'DERIVED.CLIMATE_CLASS')
        .eq('year', 2023)
        .maybeSingle(),
    ]);

    if (!countryRes.data) return null;

    const country = countryRes.data as { iso3: string; name: string; region: string };
    const rows = (scoresRes.data ?? []) as { indicator_code: string; value: number }[];

    const lookup: Record<string, number> = {};
    for (const row of rows) lookup[row.indicator_code] = row.value;

    if (lookup['REPORT.TOTAL_SCORE'] === undefined) return null;

    const gradeNumeric = Math.round(lookup['REPORT.GRADE'] ?? 0);
    const CLASS_MAP: Record<number, 'Changer' | 'Starter' | 'Talker'> = { 1: 'Changer', 2: 'Starter', 3: 'Talker' };
    const classValue = classRes.data?.value as number | undefined;
    const climateClass = classValue != null ? (CLASS_MAP[Math.round(classValue)] ?? null) : null;

    return {
      iso3: country.iso3,
      name: country.name,
      region: country.region ?? '',
      total: lookup['REPORT.TOTAL_SCORE'],
      gradeNumeric,
      grade: GRADE_LABELS[gradeNumeric] ?? 'F',
      climateClass,
      emissions:      lookup['REPORT.EMISSIONS_SCORE']      ?? null,
      energy:         lookup['REPORT.ENERGY_SCORE']         ?? null,
      economy:        lookup['REPORT.ECONOMY_SCORE']        ?? null,
      responsibility: lookup['REPORT.RESPONSIBILITY_SCORE'] ?? null,
      resilience:     lookup['REPORT.RESILIENCE_SCORE']     ?? null,
    };
  } catch {
    return null;
  }
}

async function getPeerContext(iso3: string): Promise<PeerContext | null> {
  try {
    const supabase = createServiceClient();
    const upper = iso3.toUpperCase();

    const [countryRes, allScoresRes, allCountriesRes, domainAvgRes] = await Promise.all([
      supabase.from('countries').select('income_group').eq('iso3', upper).single(),
      supabase.from('country_data').select('country_iso3, value')
        .eq('indicator_code', 'REPORT.TOTAL_SCORE').eq('year', 2024),
      supabase.from('countries').select('iso3, income_group'),
      supabase.from('country_data').select('indicator_code, value')
        .in('indicator_code', [
          'REPORT.TOTAL_SCORE', 'REPORT.EMISSIONS_SCORE', 'REPORT.ENERGY_SCORE',
          'REPORT.ECONOMY_SCORE', 'REPORT.RESPONSIBILITY_SCORE', 'REPORT.RESILIENCE_SCORE',
        ]).eq('year', 2024),
    ]);

    const allScores = allScoresRes.data;
    const allCountries = allCountriesRes.data;
    const domainRows = domainAvgRes.data;
    if (!allScores || !allCountries || !domainRows) return null;

    const incomeMap: Record<string, string> = {};
    for (const c of allCountries) {
      if (c.income_group) incomeMap[c.iso3] = c.income_group;
    }

    const sorted = [...allScores].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const globalRank = sorted.findIndex(s => s.country_iso3 === upper) + 1;

    const ig = countryRes.data?.income_group ?? null;
    let incomeGroupRank: number | null = null;
    let incomeGroupTotal: number | null = null;
    if (ig) {
      const igSorted = sorted.filter(s => incomeMap[s.country_iso3] === ig);
      incomeGroupRank = igSorted.findIndex(s => s.country_iso3 === upper) + 1;
      incomeGroupTotal = igSorted.length;
    }

    const buckets: Record<string, number[]> = {};
    for (const r of domainRows) {
      (buckets[r.indicator_code] ??= []).push(r.value);
    }
    const avg = (code: string) => {
      const v = buckets[code];
      return v && v.length > 0 ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };

    return {
      globalRank: globalRank || sorted.length,
      globalTotal: sorted.length,
      incomeGroup: ig,
      incomeGroupRank,
      incomeGroupTotal,
      globalAvg: {
        total: avg('REPORT.TOTAL_SCORE'),
        emissions: avg('REPORT.EMISSIONS_SCORE'),
        energy: avg('REPORT.ENERGY_SCORE'),
        economy: avg('REPORT.ECONOMY_SCORE'),
        responsibility: avg('REPORT.RESPONSIBILITY_SCORE'),
        resilience: avg('REPORT.RESILIENCE_SCORE'),
      },
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ iso3: string }> }) {
  const { iso3 } = await params;
  const data = await getReportCard(iso3);
  if (!data) return {};
  return createMetaTags({
    title: `${data.name} Climate Report Card — Grade ${data.grade}`,
    description: `${data.name} scores ${data.total.toFixed(1)}/100 (${data.grade}) on the VisualClimate Climate Report Card. Breakdown across emissions, energy, economy, responsibility, and resilience.`,
    path: `/report/${iso3}`,
  });
}

export default async function ReportCardPage({ params }: { params: Promise<{ iso3: string }> }) {
  const { iso3 } = await params;
  const [data, peerContext] = await Promise.all([
    getReportCard(iso3),
    getPeerContext(iso3),
  ]);

  if (!data) notFound();

  return (
    <div className="bg-[--bg-primary]">
      <div className="mx-auto max-w-[960px] px-6 pt-8">
        <nav className="flex items-center gap-2 text-sm text-[--text-muted]">
          <Link href="/" className="hover:text-[--accent-primary]">Home</Link>
          <span>/</span>
          <Link href="/report" className="hover:text-[--accent-primary]">Report Cards</Link>
          <span>/</span>
          <span className="text-[--text-secondary]">{data.name}</span>
        </nav>
      </div>

      <ReportCardClient data={data} peerContext={peerContext} />
    </div>
  );
}
