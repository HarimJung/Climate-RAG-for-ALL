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
        <div className="px-4 py-12">
            <div className="mx-auto max-w-[1200px]">
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
                        <h1 className="text-3xl font-bold sm:text-4xl">{country.name}</h1>
                        <p className="mt-1 text-lg text-[--text-secondary]">
                            {country.sub_region || country.region} • Population: {country.population?.toLocaleString() || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Key Indicators */}
                <section className="mb-12">
                    <h2 className="mb-6 text-xl font-semibold">Key Indicators</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {CLIMATE_INDICATORS.map((indicator) => {
                            const d = latestIndicators[indicator.code];
                            return (
                                <div
                                    key={indicator.code}
                                    className="rounded-xl border border-[--border-card] bg-[--bg-card] p-4 backdrop-blur"
                                >
                                    <div className="text-sm text-[--text-secondary]">{indicator.name.split('(')[0].trim()}</div>
                                    <div className="mt-2 font-mono text-2xl font-bold text-[--accent-primary]">
                                        {d ? d.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
                                    </div>
                                    <div className="text-xs text-[--text-secondary]/70">
                                        {d ? `${indicator.unit} (${d.year})` : indicator.unit}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Emissions Trend */}
                <section className="mb-12">
                    <h2 className="mb-6 text-xl font-semibold">GHG Emissions Trend</h2>
                    <CountryClient ghgData={ghgData} countryName={country.name} />
                </section>

                {/* CTAs */}
                <section className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/compare"
                        className="flex items-center justify-center gap-2 rounded-full border border-[--accent-primary]/30 bg-[--accent-primary]/10 p-6 text-center font-medium text-[--accent-primary] transition-colors hover:bg-[--accent-primary]/20"
                    >
                        Compare with other countries
                    </Link>
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 rounded-full border border-[--border-card] bg-[--bg-card] p-6 text-center font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary]/30 hover:text-[--text-primary]"
                    >
                        Back to Dashboard
                    </Link>
                </section>
            </div>
        </div>
    );
}
