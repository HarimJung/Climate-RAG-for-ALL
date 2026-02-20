import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
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
  let name = iso3;
  try {
    const supabase = createServiceClient();
    const { data: country } = await supabase
      .from('countries')
      .select('name')
      .eq('iso3', iso3.toUpperCase())
      .single();
    if (country?.name) name = country.name;
  } catch {
    // fallback to iso3
  }
  return createMetaTags({
    title: `${name} Climate Profile`,
    description: `Climate data, emissions trends, energy transition, and vulnerability analysis for ${name}.`,
    path: `/country/${iso3.toUpperCase()}`,
  });
}

function getVulnerabilityBadge(score: number) {
  if (score >= 0.45) return { label: 'High Risk', dotColor: '#E5484D', textColor: 'text-[--accent-negative]', bgColor: 'bg-red-50 border-red-200' };
  if (score >= 0.35) return { label: 'Medium Risk', dotColor: '#F59E0B', textColor: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' };
  return { label: 'Low Risk', dotColor: '#00A67E', textColor: 'text-[--accent-positive]', bgColor: 'bg-emerald-50 border-emerald-200' };
}

const GRADE_LABELS_COUNTRY: Record<number, string> = { 7: 'A+', 6: 'A', 5: 'B+', 4: 'B', 3: 'C+', 2: 'C', 1: 'D', 0: 'F' };
const GRADE_COLOR_COUNTRY: Record<string, string> = {
  'A+': '#10B981', 'A': '#10B981', 'B+': '#3B82F6', 'B': '#3B82F6',
  'C+': '#F59E0B', 'C': '#F59E0B', 'D': '#EF4444', 'F': '#991B1B',
};
const GRADE_BG_COUNTRY: Record<string, string> = {
  'A+': '#ECFDF5', 'A': '#ECFDF5', 'B+': '#EFF6FF', 'B': '#EFF6FF',
  'C+': '#FFFBEB', 'C': '#FFFBEB', 'D': '#FEF2F2', 'F': '#FFF1F2',
};

const PILOT_NAMES: Record<string, string> = {
  KOR: 'South Korea', USA: 'United States', DEU: 'Germany',
  BRA: 'Brazil', NGA: 'Nigeria', BGD: 'Bangladesh',
};

async function getCountryData(iso3: string) {
  try {
    const supabase = createServiceClient();

    const { data: country } = await supabase
      .from('countries')
      .select('*')
      .eq('iso3', iso3)
      .single();

    if (!country) return null;

    // All country_data rows for this country
    const { data: rows } = await supabase
      .from('country_data')
      .select('indicator_code, year, value, source')
      .eq('country_iso3', iso3)
      .order('year', { ascending: true });

    // All time series grouped by indicator
    const seriesByCode: Record<string, { year: number; value: number; source: string }[]> = {};
    const latestByCode: Record<string, { value: number; year: number; source: string }> = {};

    for (const r of rows || []) {
      if (r.value == null) continue;
      const code = r.indicator_code;
      if (!seriesByCode[code]) seriesByCode[code] = [];
      seriesByCode[code].push({ year: r.year, value: Number(r.value), source: r.source });
      if (!latestByCode[code] || r.year > latestByCode[code].year) {
        latestByCode[code] = { value: Number(r.value), year: r.year, source: r.source };
      }
    }

    // CO2 per capita series (World Bank)
    const wbCo2Series = seriesByCode['EN.GHG.CO2.PC.CE.AR5'] || [];
    // Climate TRACE total GHG
    const ctGhgSeries = seriesByCode['CT.GHG.TOTAL'] || [];
    // GDP per capita series
    const gdpSeries = seriesByCode['NY.GDP.PCAP.CD'] || [];
    // Ember renewable series
    const renewableSeries = seriesByCode['EMBER.RENEWABLE.PCT'] || [];
    // Decoupling series
    const decouplingSeries = seriesByCode['DERIVED.DECOUPLING'] || [];

    // ND-GAIN vulnerability badge
    const ndgainVuln = latestByCode['NDGAIN.VULNERABILITY'];
    const vulnerability = ndgainVuln
      ? { score: ndgainVuln.value, year: ndgainVuln.year, ...getVulnerabilityBadge(ndgainVuln.value) }
      : null;

    // Ember electricity mix
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

    // WB vs CT comparison (indexed)
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

    // GDP vs CO2 dual axis data (year, gdp_index, co2_index)
    const gdpYears = new Set(gdpSeries.map(d => d.year));
    const co2Years = new Set(wbCo2Series.map(d => d.year));
    const dualYears = [...gdpYears].filter(y => co2Years.has(y)).sort();
    let gdpVsCo2: { year: number; gdp: number; co2: number }[] = [];
    if (dualYears.length > 0) {
      const baseYear = dualYears[0];
      const gdpBase = gdpSeries.find(d => d.year === baseYear)!.value;
      const co2Base = wbCo2Series.find(d => d.year === baseYear)!.value;
      if (gdpBase > 0 && co2Base > 0) {
        gdpVsCo2 = dualYears.map(year => ({
          year,
          gdp: (gdpSeries.find(d => d.year === year)!.value / gdpBase) * 100,
          co2: (wbCo2Series.find(d => d.year === year)!.value / co2Base) * 100,
        }));
      }
    }

    // ND-GAIN scatter data for all 6 pilots
    const pilots = ['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD'];
    const { data: ndgainRows } = await supabase
      .from('country_data')
      .select('country_iso3, indicator_code, value')
      .in('country_iso3', pilots)
      .in('indicator_code', ['NDGAIN.VULNERABILITY', 'NDGAIN.READINESS'])
      .eq('year', 2023);

    const scatterData: { iso3: string; name: string; vulnerability: number; readiness: number }[] = [];
    const ndMap: Record<string, { vulnerability?: number; readiness?: number }> = {};
    for (const r of ndgainRows || []) {
      if (!ndMap[r.country_iso3]) ndMap[r.country_iso3] = {};
      if (r.indicator_code === 'NDGAIN.VULNERABILITY') ndMap[r.country_iso3].vulnerability = Number(r.value);
      if (r.indicator_code === 'NDGAIN.READINESS') ndMap[r.country_iso3].readiness = Number(r.value);
    }
    for (const p of pilots) {
      const d = ndMap[p];
      if (d?.vulnerability != null && d?.readiness != null) {
        scatterData.push({ iso3: p, name: PILOT_NAMES[p] || p, vulnerability: d.vulnerability, readiness: d.readiness });
      }
    }

    // Renewable 5-year change
    const renewableLatest = renewableSeries.length > 0 ? renewableSeries[renewableSeries.length - 1] : null;
    const renewable5yAgo = renewableSeries.find(d => d.year === (renewableLatest?.year ?? 0) - 5);
    const renewableChange = renewableLatest && renewable5yAgo
      ? renewableLatest.value - renewable5yAgo.value
      : null;

    // Data sources table
    const sourcesUsed: { indicator: string; source: string; yearRange: string }[] = [];
    const codeNames: Record<string, string> = {
      'EN.GHG.CO2.PC.CE.AR5': 'CO2 per capita',
      'CT.GHG.TOTAL': 'Total GHG (absolute)',
      'NY.GDP.PCAP.CD': 'GDP per capita',
      'EMBER.RENEWABLE.PCT': 'Renewable electricity %',
      'EMBER.FOSSIL.PCT': 'Fossil electricity %',
      'EMBER.CARBON.INTENSITY': 'Carbon intensity',
      'EG.USE.PCAP.KG.OE': 'Energy use per capita',
      'EN.ATM.PM25.MC.M3': 'PM2.5 air pollution',
      'AG.LND.FRST.ZS': 'Forest area',
      'NDGAIN.VULNERABILITY': 'ND-GAIN Vulnerability',
      'NDGAIN.READINESS': 'ND-GAIN Readiness',
      'DERIVED.DECOUPLING': 'Decoupling index',
      'DERIVED.CO2_PER_GDP': 'Carbon intensity of GDP',
      'DERIVED.ENERGY_TRANSITION': 'Energy transition momentum',
      'DERIVED.EMISSIONS_INTENSITY': 'Emissions intensity',
    };

    for (const [code, series] of Object.entries(seriesByCode)) {
      if (series.length === 0) continue;
      const years = series.map(d => d.year);
      sourcesUsed.push({
        indicator: codeNames[code] || code,
        source: series[0].source,
        yearRange: `${Math.min(...years)}–${Math.max(...years)}`,
      });
    }

    return {
      country,
      latestByCode,
      wbCo2Series: wbCo2Series.map(d => ({ year: d.year, value: d.value })),
      co2Comparison,
      gdpVsCo2,
      vulnerability,
      emberMix,
      scatterData,
      renewableChange,
      decouplingSeries: decouplingSeries.map(d => ({ year: d.year, value: d.value })),
      sourcesUsed,
    };
  } catch {
    return null;
  }
}

export default async function CountryPage({ params }: Props) {
  const { iso3 } = await params;
  const data = await getCountryData(iso3.toUpperCase());

  if (!data) notFound();

  const {
    country, latestByCode, wbCo2Series, co2Comparison, gdpVsCo2,
    vulnerability, emberMix, scatterData, renewableChange,
    decouplingSeries, sourcesUsed,
  } = data;

  // Key stats for header cards
  const co2 = latestByCode['EN.GHG.CO2.PC.CE.AR5'];
  const gdp = latestByCode['NY.GDP.PCAP.CD'];
  const renewable = latestByCode['EMBER.RENEWABLE.PCT'];
  const ndVuln = latestByCode['NDGAIN.VULNERABILITY'];
  const decoupling = latestByCode['DERIVED.DECOUPLING'];
  const pm25 = latestByCode['EN.ATM.PM25.MC.M3'];

  const formatGdpTotal = (pcap: number, pop: number) => {
    const total = pcap * pop;
    if (total >= 1e12) return `$${(total / 1e12).toFixed(2)}T`;
    if (total >= 1e9) return `$${(total / 1e9).toFixed(0)}B`;
    return `$${total.toLocaleString()}`;
  };

  return (
    <div className="bg-[--bg-primary]">
      <JsonLd
        data={buildCountryJsonLd({
          name: country.name,
          iso3: country.iso3,
          description: `Climate data, emissions trends, and sustainability indicators for ${country.name}.`,
        })}
      />

      {/* Header */}
      <section className="border-b border-[--border-card] bg-white px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
            {country.flag_url && (
              <Image
                src={country.flag_url}
                alt={`${country.name} flag`}
                width={72}
                height={54}
                className="rounded-lg shadow"
                unoptimized
              />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-[--text-primary] sm:text-4xl">{country.name}</h1>
                {(() => {
                  const gradeRaw = latestByCode['REPORT.GRADE'];
                  if (!gradeRaw) return null;
                  const grade = GRADE_LABELS_COUNTRY[Math.round(gradeRaw.value)];
                  if (!grade) return null;
                  return (
                    <Link
                      href={`/report/${country.iso3}`}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold transition-opacity hover:opacity-80"
                      style={{
                        borderColor: GRADE_COLOR_COUNTRY[grade],
                        backgroundColor: GRADE_BG_COUNTRY[grade],
                        color: GRADE_COLOR_COUNTRY[grade],
                      }}
                      title="View full Report Card"
                    >
                      Grade {grade}
                    </Link>
                  );
                })()}
                {vulnerability && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${vulnerability.bgColor} ${vulnerability.textColor}`}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: vulnerability.dotColor }} />
                    {vulnerability.label}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[--text-secondary]">
                {country.sub_region || country.region}
                {country.income_group && ` · ${country.income_group}`}
                {country.population && ` · Pop. ${Number(country.population).toLocaleString()}`}
              </p>
              {vulnerability && (
                <p className="mt-1 text-xs text-[--text-muted]">
                  ND-GAIN Vulnerability: {vulnerability.score.toFixed(3)} ({vulnerability.year})
                </p>
              )}
            </div>
          </div>

          {/* 4 key stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="CO2 per capita"
              value={co2 ? co2.value.toFixed(2) : '—'}
              unit="t CO2e"
              source={co2 ? `${co2.source} (${co2.year})` : undefined}
            />
            <StatCard
              title="GDP"
              value={gdp && country.population ? formatGdpTotal(gdp.value, Number(country.population)) : (gdp ? `$${gdp.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—')}
              unit={gdp && country.population ? `($${(gdp.value / 1000).toFixed(1)}k/capita)` : 'per capita'}
              source={gdp ? `World Bank (${gdp.year})` : undefined}
            />
            <StatCard
              title="Renewable electricity"
              value={renewable ? renewable.value.toFixed(1) : '—'}
              unit="%"
              trend={renewableChange != null ? { direction: renewableChange > 0 ? 'up' : 'down', label: `${renewableChange > 0 ? '+' : ''}${renewableChange.toFixed(1)}pp (5yr)` } : undefined}
              source={renewable ? `Ember (${renewable.year})` : undefined}
            />
            <StatCard
              title="Vulnerability"
              value={ndVuln ? ndVuln.value.toFixed(3) : '—'}
              unit="ND-GAIN index"
              source={ndVuln ? `ND-GAIN (${ndVuln.year})` : undefined}
            />
          </div>
        </div>
      </section>

      {/* All chart sections via client component */}
      <CountryClient
        countryName={country.name}
        iso3={country.iso3.trim()}
        wbCo2Series={wbCo2Series}
        co2Comparison={co2Comparison}
        gdpVsCo2={gdpVsCo2}
        emberMix={emberMix}
        renewableChange={renewableChange}
        scatterData={scatterData}
        decouplingSeries={decouplingSeries}
        decouplingScore={decoupling?.value ?? null}
        pm25={pm25?.value ?? null}
      />

      {/* Data Sources (accordion by category) */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-12">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">Data Sources</h2>
          {(() => {
            const CATEGORY_CODES: Record<string, string[]> = {
              'Emissions':    ['EN.GHG.CO2.PC.CE.AR5', 'CT.GHG.TOTAL', 'DERIVED.DECOUPLING', 'DERIVED.CO2_PER_GDP', 'DERIVED.EMISSIONS_INTENSITY'],
              'Energy':       ['EMBER.RENEWABLE.PCT', 'EMBER.FOSSIL.PCT', 'EMBER.CARBON.INTENSITY', 'EG.USE.PCAP.KG.OE', 'DERIVED.ENERGY_TRANSITION'],
              'Economy':      ['NY.GDP.PCAP.CD'],
              'Climate Risk': ['NDGAIN.VULNERABILITY', 'NDGAIN.READINESS', 'EN.ATM.PM25.MC.M3', 'AG.LND.FRST.ZS'],
              'Derived':      [],
            };
            const assigned = new Set(Object.values(CATEGORY_CODES).flat());
            // Group sourcesUsed by category
            const categorized: Record<string, typeof sourcesUsed> = {};
            for (const cat of Object.keys(CATEGORY_CODES)) categorized[cat] = [];
            for (const s of sourcesUsed) {
              let found = false;
              for (const [cat, codes] of Object.entries(CATEGORY_CODES)) {
                if (codes.some(c => s.indicator === (({
                  'EN.GHG.CO2.PC.CE.AR5': 'CO2 per capita', 'CT.GHG.TOTAL': 'Total GHG (absolute)',
                  'NY.GDP.PCAP.CD': 'GDP per capita', 'EMBER.RENEWABLE.PCT': 'Renewable electricity %',
                  'EMBER.FOSSIL.PCT': 'Fossil electricity %', 'EMBER.CARBON.INTENSITY': 'Carbon intensity',
                  'EG.USE.PCAP.KG.OE': 'Energy use per capita', 'EN.ATM.PM25.MC.M3': 'PM2.5 air pollution',
                  'AG.LND.FRST.ZS': 'Forest area', 'NDGAIN.VULNERABILITY': 'ND-GAIN Vulnerability',
                  'NDGAIN.READINESS': 'ND-GAIN Readiness', 'DERIVED.DECOUPLING': 'Decoupling index',
                  'DERIVED.CO2_PER_GDP': 'Carbon intensity of GDP', 'DERIVED.ENERGY_TRANSITION': 'Energy transition momentum',
                  'DERIVED.EMISSIONS_INTENSITY': 'Emissions intensity',
                } as Record<string, string>)[c]))) {
                  categorized[cat].push(s);
                  found = true;
                  break;
                }
              }
              if (!found) categorized['Derived'].push(s);
            }
            return (
              <div className="space-y-2">
                {Object.entries(categorized)
                  .filter(([, rows]) => rows.length > 0)
                  .map(([cat, rows]) => (
                    <details key={cat} className="group rounded-xl border border-[--border-card] bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-[--text-primary] hover:bg-gray-50">
                        <span>{cat} <span className="ml-1.5 text-xs font-normal text-[--text-muted]">({rows.length})</span></span>
                        <svg className="h-4 w-4 text-[--text-muted] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="border-t border-[--border-card]">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[--border-card] bg-gray-50">
                              <th className="px-5 py-2 text-left text-xs font-medium text-[--text-muted]">Indicator</th>
                              <th className="px-5 py-2 text-left text-xs font-medium text-[--text-muted]">Source</th>
                              <th className="px-5 py-2 text-left text-xs font-medium text-[--text-muted]">Years</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((s, i) => (
                              <tr key={i} className="border-b border-[--border-card] last:border-b-0">
                                <td className="px-5 py-2.5 text-[--text-primary]">{s.indicator}</td>
                                <td className="px-5 py-2.5 text-[--text-secondary]">{s.source}</td>
                                <td className="px-5 py-2.5 font-mono text-xs text-[--text-muted]">{s.yearRange}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* CTAs */}
      <section className="border-t border-[--border-card] bg-white px-4 py-12">
        <div className="mx-auto grid max-w-[1200px] gap-4 sm:grid-cols-2">
          <Link
            href="/compare"
            className="flex items-center justify-center gap-2 rounded-xl border border-[--accent-primary] bg-[--accent-primary] p-5 text-center font-medium text-white transition-all hover:opacity-90"
          >
            Compare with other countries
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl border border-[--border-card] bg-white p-5 text-center font-medium text-[--text-secondary] transition-all hover:border-[--accent-primary] hover:text-[--accent-primary]"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            View all countries
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
