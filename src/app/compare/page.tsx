import { createServiceClient } from '@/lib/supabase/server';
import { CLIMATE_INDICATORS } from '@/lib/constants';
import { CompareClient } from './CompareClient';
import { createMetaTags } from '@/components/seo/MetaTags';

export const metadata = createMetaTags({
    title: 'Compare Countries',
    description: 'Side-by-side climate indicator comparison across countries with real data from World Bank, Ember, and ND-GAIN.',
    path: '/compare',
});

export const dynamic = 'force-dynamic';

export interface DomainScores {
    emissions:      number | null;
    energy:         number | null;
    economy:        number | null;
    responsibility: number | null;
    resilience:     number | null;
    total:          number | null;
    grade:          string | null;
    climateClass:   'Changer' | 'Starter' | 'Talker' | null;
}

export interface CountryCompareData {
    iso3: string;
    name: string;
    region: string;
    indicators: Record<string, { value: number; year: number } | null>;
    domain: DomainScores;
}

const GRADE_LABELS: Record<number, string> = {
    7: 'A+', 6: 'A', 5: 'B+', 4: 'B', 3: 'C+', 2: 'C', 1: 'D', 0: 'F',
};
const CLASS_MAP: Record<number, 'Changer' | 'Starter' | 'Talker'> = {
    1: 'Changer', 2: 'Starter', 3: 'Talker',
};

const DOMAIN_CODES = [
    'REPORT.TOTAL_SCORE', 'REPORT.GRADE',
    'REPORT.EMISSIONS_SCORE', 'REPORT.ENERGY_SCORE',
    'REPORT.ECONOMY_SCORE', 'REPORT.RESPONSIBILITY_SCORE',
    'REPORT.RESILIENCE_SCORE',
];

async function getCompareData(iso3List: string[]): Promise<CountryCompareData[]> {
  try {
    const supabase = createServiceClient();
    const codes = CLIMATE_INDICATORS.map(i => i.code);

    const [indicatorRes, countryRes, domainRes, classRes] = await Promise.all([
        supabase
            .from('country_data')
            .select('country_iso3, indicator_code, year, value')
            .in('country_iso3', iso3List)
            .in('indicator_code', codes)
            .order('year', { ascending: false }),
        supabase
            .from('countries')
            .select('iso3, name, region')
            .in('iso3', iso3List),
        supabase
            .from('country_data')
            .select('country_iso3, indicator_code, value')
            .in('country_iso3', iso3List)
            .in('indicator_code', DOMAIN_CODES)
            .eq('year', 2024),
        supabase
            .from('country_data')
            .select('country_iso3, value')
            .in('country_iso3', iso3List)
            .eq('indicator_code', 'DERIVED.CLIMATE_CLASS')
            .eq('year', 2023),
    ]);

    const nameMap = new Map<string, { name: string; region: string }>();
    for (const c of (countryRes.data ?? []) as { iso3: string; name: string; region: string }[]) {
        nameMap.set(c.iso3.trim(), { name: c.name, region: c.region ?? '' });
    }

    const domainMap = new Map<string, Record<string, number>>();
    for (const r of (domainRes.data ?? []) as { country_iso3: string; indicator_code: string; value: number }[]) {
        if (!domainMap.has(r.country_iso3)) domainMap.set(r.country_iso3, {});
        domainMap.get(r.country_iso3)![r.indicator_code] = r.value;
    }

    const classMap = new Map<string, number>();
    for (const r of (classRes.data ?? []) as { country_iso3: string; value: number }[]) {
        classMap.set(r.country_iso3, r.value);
    }

    return iso3List.map(iso3 => {
        const countryRows = (indicatorRes.data || []).filter(
            (r: { country_iso3: string }) => r.country_iso3 === iso3
        );
        const indicators: Record<string, { value: number; year: number } | null> = {};
        for (const code of codes) {
            const row = countryRows.find(
                (r: { indicator_code: string; value: number | null }) => r.indicator_code === code && r.value != null
            );
            indicators[code] = row ? { value: Number(row.value), year: row.year } : null;
        }

        const dm = domainMap.get(iso3) ?? {};
        const gradeNum = Math.round(dm['REPORT.GRADE'] ?? -1);
        const clsNum = classMap.get(iso3);

        const info = nameMap.get(iso3);

        return {
            iso3,
            name: info?.name ?? iso3,
            region: info?.region ?? '',
            indicators,
            domain: {
                emissions:      dm['REPORT.EMISSIONS_SCORE']      ?? null,
                energy:         dm['REPORT.ENERGY_SCORE']         ?? null,
                economy:        dm['REPORT.ECONOMY_SCORE']        ?? null,
                responsibility: dm['REPORT.RESPONSIBILITY_SCORE'] ?? null,
                resilience:     dm['REPORT.RESILIENCE_SCORE']     ?? null,
                total:          dm['REPORT.TOTAL_SCORE']          ?? null,
                grade:          gradeNum >= 0 ? (GRADE_LABELS[gradeNum] ?? 'F') : null,
                climateClass:   clsNum != null ? (CLASS_MAP[Math.round(clsNum)] ?? null) : null,
            },
        };
    });
  } catch {
    return [];
  }
}

async function getAllCountries() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
        .from('countries')
        .select('iso3, name, region')
        .order('name');
    return (data || []).map((c: { iso3: string; name: string; region: string }) => ({
        iso3: c.iso3.trim(), name: c.name, region: c.region,
    }));
  } catch {
    return [];
  }
}

interface ComparePageProps {
    searchParams: Promise<{ countries?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
    const params = await searchParams;
    const countriesParam = params.countries || 'KOR,USA';
    const iso3List = countriesParam
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 5);

    const [compareData, allCountries] = await Promise.all([
        iso3List.length > 0 ? getCompareData(iso3List) : Promise.resolve([]),
        getAllCountries(),
    ]);

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">
                        Compare Countries
                    </h1>
                    <p className="mt-2 text-lg text-[--text-secondary]">
                        Side-by-side climate indicator comparison across countries
                    </p>
                </div>
                <CompareClient
                    initialData={compareData}
                    allCountries={allCountries}
                    selectedIso3={iso3List}
                />
            </div>
        </div>
    );
}
