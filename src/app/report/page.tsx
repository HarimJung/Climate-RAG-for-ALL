import { createServiceClient } from '@/lib/supabase/server';
import { createMetaTags } from '@/components/seo/MetaTags';
import { Metadata } from 'next';
import { ReportIndexClient } from './ReportIndexClient';

export const metadata: Metadata = createMetaTags({
  title: 'Climate Report Card — 200+ Countries Graded',
  description: 'Climate performance grades for 200+ countries based on emissions, energy transition, economic efficiency, historical responsibility, and resilience.',
  path: '/report',
});

export const dynamic = 'force-dynamic';

export interface CountryReportCard {
  iso3: string;
  name: string;
  region: string;
  total: number;
  gradeNumeric: number;
  grade: string;
  emissions: number | null;
  energy: number | null;
  economy: number | null;
  responsibility: number | null;
  resilience: number | null;
}

const GRADE_LABELS: Record<number, string> = {
  7: 'A+', 6: 'A', 5: 'B+', 4: 'B', 3: 'C+', 2: 'C', 1: 'D', 0: 'F',
};

const SCORE_CODES = [
  'REPORT.TOTAL_SCORE',
  'REPORT.GRADE',
  'REPORT.EMISSIONS_SCORE',
  'REPORT.ENERGY_SCORE',
  'REPORT.ECONOMY_SCORE',
  'REPORT.RESPONSIBILITY_SCORE',
  'REPORT.RESILIENCE_SCORE',
] as const;

async function getAllReportCards(): Promise<CountryReportCard[]> {
  try {
    const supabase = createServiceClient();

    const [countriesRes, scoresRes] = await Promise.all([
      supabase.from('countries').select('iso3, name, region').order('name'),
      supabase
        .from('country_data')
        .select('country_iso3, indicator_code, value')
        .in('indicator_code', [...SCORE_CODES])
        .eq('year', 2024),
    ]);

    const countries = (countriesRes.data ?? []) as { iso3: string; name: string; region: string }[];
    const rows = (scoresRes.data ?? []) as { country_iso3: string; indicator_code: string; value: number }[];

    // Build score lookup: iso3 → code → value
    const lookup: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      if (!lookup[row.country_iso3]) lookup[row.country_iso3] = {};
      lookup[row.country_iso3][row.indicator_code] = row.value;
    }

    const cards: CountryReportCard[] = [];
    for (const c of countries) {
      const scores = lookup[c.iso3];
      if (!scores || scores['REPORT.TOTAL_SCORE'] === undefined) continue;
      const gradeNumeric = Math.round(scores['REPORT.GRADE'] ?? 0);
      cards.push({
        iso3: c.iso3,
        name: c.name,
        region: c.region ?? '',
        total: scores['REPORT.TOTAL_SCORE'],
        gradeNumeric,
        grade: GRADE_LABELS[gradeNumeric] ?? 'F',
        emissions:      scores['REPORT.EMISSIONS_SCORE']      ?? null,
        energy:         scores['REPORT.ENERGY_SCORE']         ?? null,
        economy:        scores['REPORT.ECONOMY_SCORE']        ?? null,
        responsibility: scores['REPORT.RESPONSIBILITY_SCORE'] ?? null,
        resilience:     scores['REPORT.RESILIENCE_SCORE']     ?? null,
      });
    }

    return cards.sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}

export default async function ReportPage() {
  const cards = await getAllReportCards();

  return (
    <div className="bg-[--bg-primary]">
      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <span className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[--accent-primary]">
              Climate Report Card
            </span>
            <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">
              {cards.length} Countries Graded
            </h1>
            <p className="mt-3 max-w-2xl text-[--text-secondary]">
              Relative climate performance across 5 domains: emissions efficiency, energy transition,
              economic decoupling, historical responsibility, and climate resilience.
            </p>
          </div>
          <ReportIndexClient cards={cards} />
        </div>
      </section>
    </div>
  );
}
