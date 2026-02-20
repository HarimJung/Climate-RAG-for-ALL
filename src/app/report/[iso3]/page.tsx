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
  emissions:      number | null;
  energy:         number | null;
  economy:        number | null;
  responsibility: number | null;
  resilience:     number | null;
}

async function getReportCard(iso3: string): Promise<ReportCardData | null> {
  try {
    const supabase = createServiceClient();

    const [countryRes, scoresRes] = await Promise.all([
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
    ]);

    if (!countryRes.data) return null;

    const country = countryRes.data as { iso3: string; name: string; region: string };
    const rows = (scoresRes.data ?? []) as { indicator_code: string; value: number }[];

    const lookup: Record<string, number> = {};
    for (const row of rows) lookup[row.indicator_code] = row.value;

    if (lookup['REPORT.TOTAL_SCORE'] === undefined) return null;

    const gradeNumeric = Math.round(lookup['REPORT.GRADE'] ?? 0);
    return {
      iso3: country.iso3,
      name: country.name,
      region: country.region ?? '',
      total: lookup['REPORT.TOTAL_SCORE'],
      gradeNumeric,
      grade: GRADE_LABELS[gradeNumeric] ?? 'F',
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
  const data = await getReportCard(iso3);

  if (!data) notFound();

  return (
    <div className="bg-[--bg-primary] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-[--text-muted]">
          <Link href="/report" className="hover:text-[--accent-primary]">Report Card</Link>
          <span>/</span>
          <span className="text-[--text-secondary]">{data.name}</span>
        </nav>

        <ReportCardClient data={data} />
      </div>
    </div>
  );
}
