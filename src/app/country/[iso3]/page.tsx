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
  const co2Series: { year: number; value: number }[] = [];

  for (const r of rows || []) {
    if (!latestByCode[r.indicator_code] || r.year > latestByCode[r.indicator_code].year) {
      latestByCode[r.indicator_code] = { value: Number(r.value), year: r.year, source: r.source };
    }
    if (r.indicator_code === 'EN.ATM.CO2E.PC' && r.value != null) {
      co2Series.push({ year: r.year, value: Number(r.value) });
    }
  }

  return { country, latestByCode, co2Series };
}

export default async function CountryPage({ params }: Props) {
  const { iso3 } = await params;
  const data = await getCountryData(iso3.toUpperCase());

  if (!data) notFound();

  const { country, latestByCode, co2Series } = data;

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
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{country.name}</h1>
            <p className="mt-1 text-lg text-slate-400">
              {country.sub_region || country.region}
              {country.income_group && ` \u00b7 ${country.income_group}`}
              {country.population && ` \u00b7 Pop. ${Number(country.population).toLocaleString()}`}
            </p>
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
                />
              );
            })}
          </div>
        </section>

        {/* Charts */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-white">Data Visualizations</h2>
          <CountryClient
            co2Series={co2Series}
            countryName={country.name}
            renewablePercent={latestByCode['EG.FEC.RNEW.ZS'] ? Number(latestByCode['EG.FEC.RNEW.ZS'].value) : null}
            forestPercent={latestByCode['AG.LND.FRST.ZS'] ? Number(latestByCode['AG.LND.FRST.ZS'].value) : null}
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
