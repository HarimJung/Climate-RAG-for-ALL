import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { CLIMATE_INDICATORS } from '@/lib/constants';
import { CountryClient } from './CountryClient';

interface Props {
    params: Promise<{ iso3: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { iso3 } = await params;
    const supabase = createServiceClient();
    const { data: country } = await supabase
        .from('countries')
        .select('name')
        .eq('iso3', iso3.toUpperCase())
        .single();

    const name = country?.name || iso3;
    return {
        title: `${name} Climate Profile`,
        description: `Climate data, emissions trends, and sustainability indicators for ${name}.`,
    };
}

async function getCountryData(iso3: string) {
    const supabase = createServiceClient();

    const { data: country } = await supabase
        .from('countries')
        .select('*')
        .eq('iso3', iso3)
        .single();

    if (!country) return null;

    // Get indicator IDs
    const allCodes = [...CLIMATE_INDICATORS.map(i => i.code), 'TOTAL_GHG'];
    const { data: indicators } = await supabase
        .from('indicators')
        .select('id, code')
        .in('code', allCodes);

    if (!indicators) return { country, latestIndicators: {}, ghgData: [] };

    const indicatorMap = new Map(indicators.map((i: { id: number; code: string }) => [i.id, i.code]));
    const indicatorIds = indicators.map((i: { id: number }) => i.id);

    // Get all indicator values for this country
    const { data: values } = await supabase
        .from('indicator_values')
        .select('indicator_id, year, value')
        .eq('country_id', country.id)
        .in('indicator_id', indicatorIds)
        .order('year', { ascending: false });

    // Get latest value for each indicator
    const latestIndicators: Record<string, { value: number; year: number }> = {};
    for (const v of (values || [])) {
        const code = indicatorMap.get(v.indicator_id);
        if (code && !latestIndicators[code]) {
            latestIndicators[code] = { value: v.value, year: v.year };
        }
    }

    // Get GHG/CO2 time series
    const ghgCodes = new Set(['TOTAL_GHG', 'EN.ATM.CO2E.PC']);
    const ghgIndicatorIds = indicators
        .filter((i: { code: string }) => ghgCodes.has(i.code))
        .map((i: { id: number }) => i.id);

    const ghgData = (values || [])
        .filter((v: { indicator_id: number }) => ghgIndicatorIds.includes(v.indicator_id))
        .reduce((acc: Map<number, { year: number; value: number }>, v: { year: number; value: number }) => {
            if (!acc.has(v.year)) acc.set(v.year, { year: v.year, value: v.value });
            return acc;
        }, new Map<number, { year: number; value: number }>());

    return {
        country,
        latestIndicators,
        ghgData: Array.from(ghgData.values()).sort((a, b) => a.year - b.year),
    };
}

export default async function CountryPage({ params }: Props) {
    const { iso3 } = await params;
    const data = await getCountryData(iso3.toUpperCase());

    if (!data) {
        notFound();
    }

    const { country, latestIndicators, ghgData } = data;

    return (
        <div className="bg-slate-950 px-4 py-12">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center">
                    {country.flag_url && (
                        <Image
                            src={country.flag_url}
                            alt={`${country.name} flag`}
                            width={80}
                            height={60}
                            className="rounded shadow-lg"
                            unoptimized
                        />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-white sm:text-4xl">{country.name}</h1>
                        <p className="mt-1 text-lg text-slate-400">
                            {country.sub_region || country.region} • Population: {country.population?.toLocaleString() || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Key Indicators */}
                <section className="mb-12">
                    <h2 className="mb-6 text-xl font-semibold text-white">Key Indicators</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {CLIMATE_INDICATORS.map((indicator) => {
                            const d = latestIndicators[indicator.code];
                            return (
                                <div
                                    key={indicator.code}
                                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
                                >
                                    <div className="text-sm text-slate-400">{indicator.name.split('(')[0].trim()}</div>
                                    <div className="mt-2 text-2xl font-bold text-emerald-400">
                                        {d ? d.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {d ? `${indicator.unit} (${d.year})` : indicator.unit}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Emissions Trend */}
                <section className="mb-12">
                    <h2 className="mb-6 text-xl font-semibold text-white">GHG Emissions Trend</h2>
                    <CountryClient ghgData={ghgData} countryName={country.name} />
                </section>

                {/* CTAs */}
                <section className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href={`/chat?country=${iso3}`}
                        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-950/30 p-6 text-center font-medium text-emerald-400 transition-colors hover:bg-emerald-900/30"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                        </svg>
                        Ask AI about {country.name}
                    </Link>
                    <Link
                        href="/pricing"
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-center font-medium text-slate-300 transition-colors hover:bg-slate-800"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download Full Profile (PDF) → Pro Plan
                    </Link>
                </section>
            </div>
        </div>
    );
}
