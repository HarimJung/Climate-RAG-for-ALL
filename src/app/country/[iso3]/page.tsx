import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { CLIMATE_INDICATORS } from '@/lib/constants';
import { StatCard } from '@/components/StatCard';
import { CountryClient } from './CountryClient';
import { createMetaTags } from '@/components/seo/MetaTags';
import { JsonLd, buildCountryJsonLd } from '@/components/seo/JsonLd';

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
  return createMetaTags({
    title: `${name} Climate Profile`,
    description: `Climate data, emissions trends, and sustainability indicators for ${name}.`,
    path: `/country/${iso3.toUpperCase()}`,
  });
}

// ND-GAIN vulnerability: 0–1 scale. Higher = more vulnerable
function getVulnerabilityBadge(score: number): { label: string; color: string; bg: string } {
  if (score >= 0.45) return { label: 'High', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' };
  if (score >= 0.35) return { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' };
  return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' };
}

async function getCountryData(iso3: string) {
  const supabase = createServiceClient();

  const { data: country } = await supabase
    .from('countries')
    .select('*')
    .eq('iso3', iso3)
    .single();

  if (!country) return null;

  const { data: rows } = await supabase
    .from('country_data')
    .select('indicator_code, year, value, source')
    .eq('country_iso3', iso3)
    .order('year', { ascending: true });

  const latestByCode: Record<string, { value: number; year: number; source: string }> = {};
  const wbCo2Series: { year: number; value: number }[] = [];
  const ctGhgSeries: { year: number; value: number }[] = [];
  const emberRenewableSeries: { year: number; value: number }[] = [];

  for (const r of rows || []) {
    if (!latestByCode[r.indicator_code] || r.year > latestByCode[r.indicator_code].year) {
      latestByCode[r.indicator_code] = { value: Number(r.value), year: r.year, source: r.source };
    }
    if (r.indicator_code === 'EN.GHG.CO2.PC.CE.AR5' && r.value != null) {
      wbCo2Series.push({ year: r.year, value: Number(r.value) });
    }
    if (r.indicator_code === 'CT.GHG.TOTAL' && r.value != null) {
      ctGhgSeries.push({ year: r.year, value: Number(r.value) });
    }
    if (r.indicator_code === 'EMBER.RENEWABLE.PCT' && r.value != null) {
      emberRenewableSeries.push({ year: r.year, value: Number(r.value) });
    }
  }

  // ND-GAIN vulnerability
  const ndgainVuln = latestByCode['NDGAIN.VULNERABILITY'];
  const vulnerability = ndgainVuln
    ? { score: ndgainVuln.value, year: ndgainVuln.year, ...getVulnerabilityBadge(ndgainVuln.value) }
    : null;

  // Ember electricity mix (latest)
  const emberRenewable = latestByCode['EMBER.RENEWABLE.PCT'];
  const emberFossil = latestByCode['EMBER.FOSSIL.PCT'];
  const emberMix = emberRenewable && emberFossil
    ? {
        renewable: emberRenewable.value,
        fossil: emberFossil.value,
        other: Math.max(0, 100 - emberRenewable.value - emberFossil.value),
        year: emberRenewable.year,
        source: 'Ember',
      }
    : null;

  // Normalize both CO2 series to index (first overlapping year = 100)
  const wbYears = new Set(wbCo2Series.map(d => d.year));
  const ctYears = new Set(ctGhgSeries.map(d => d.year));
  const overlapYears = [...wbYears].filter(y => ctYears.has(y)).sort();

  let co2Comparison: { year: number; wb: number; ct: number }[] = [];
  if (overlapYears.length > 0) {
    const baseYear = overlapYears[0];
    const wbBase = wbCo2Series.find(d => d.year === baseYear)!.value;
    const ctBase = ctGhgSeries.find(d => d.year === baseYear)!.value;
    if (wbBase > 0 && ctBase > 0) {
      co2Comparison = overlapYears.map(year => ({
        year,
        wb: (wbCo2Series.find(d => d.year === year)!.value / wbBase) * 100,
        ct: (ctGhgSeries.find(d => d.year === year)!.value / ctBase) * 100,
      }));
    }
  }

  return {
    country,
    latestByCode,
    wbCo2Series,
    vulnerability,
    co2Comparison,
    emberMix,
  };
}

export default async function CountryPage({ params }: Props) {
  const { iso3 } = await params;
  const data = await getCountryData(iso3.toUpperCase());

  if (!data) notFound();

  const { country, latestByCode, wbCo2Series, vulnerability, co2Comparison, emberMix } = data;

  return (
    <div className="px-4 py-12">
      <JsonLd
        data={buildCountryJsonLd({
          name: country.name,
          iso3: country.iso3,
          description: `Climate data, emissions trends, and sustainability indicators for ${country.name}.`,
        })}
      />
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center">
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{country.name}</h1>
              {vulnerability && (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${vulnerability.bg} ${vulnerability.color}`}>
                  <span className="inline-block h-2 w-2 rounded-full" style={{
                    backgroundColor: vulnerability.label === 'High' ? '#f87171' : vulnerability.label === 'Medium' ? '#facc15' : '#34d399',
                  }} />
                  {vulnerability.label} Vulnerability
                </span>
              )}
            </div>
            <p className="mt-1 text-lg text-slate-400">
              {country.sub_region || country.region}
              {country.income_group && ` \u00b7 ${country.income_group}`}
              {country.population && ` \u00b7 Pop. ${Number(country.population).toLocaleString()}`}
            </p>
            {vulnerability && (
              <p className="mt-1 text-xs text-slate-600">
                Source: ND-GAIN ({vulnerability.year}) — Score: {vulnerability.score.toFixed(3)}
              </p>
            )}
          </div>
        </div>

        {/* Key Indicators */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-white">Key Indicators</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CLIMATE_INDICATORS.map((ind) => {
              const d = latestByCode[ind.code];
              return (
                <StatCard
                  key={ind.code}
                  title={ind.name.split('(')[0].trim()}
                  value={d ? Number(d.value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
                  unit={d ? `${ind.unit} (${d.year})` : ind.unit}
                  source={d ? `${d.source} (${d.year})` : undefined}
                />
              );
            })}
          </div>
        </section>

        {/* Charts */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-white">Data Visualizations</h2>
          <CountryClient
            wbCo2Series={wbCo2Series}
            co2Comparison={co2Comparison}
            countryName={country.name}
            emberMix={emberMix}
            forestPercent={latestByCode['AG.LND.FRST.ZS'] ? Number(latestByCode['AG.LND.FRST.ZS'].value) : null}
            forestSource={latestByCode['AG.LND.FRST.ZS']?.source}
            forestYear={latestByCode['AG.LND.FRST.ZS']?.year}
          />
        </section>

        {/* CTAs */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/compare"
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
          >
            Compare with other countries
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-6 text-center font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
          >
            Back to Dashboard
          </Link>
        </section>
      </div>
    </div>
  );
}
