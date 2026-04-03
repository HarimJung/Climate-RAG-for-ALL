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

// Country names fetched from DB for scatter (no hardcoded pilot list)

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

    // ND-GAIN scatter data for ALL countries
    const { data: ndgainRows } = await supabase
      .from('country_data')
      .select('country_iso3, indicator_code, value')
      .in('indicator_code', ['NDGAIN.VULNERABILITY', 'NDGAIN.READINESS'])
      .eq('year', 2023)
      .limit(2000);

    const scatterData: { iso3: string; name: string; vulnerability: number; readiness: number }[] = [];
    const ndMap: Record<string, { vulnerability?: number; readiness?: number }> = {};
    for (const r of ndgainRows || []) {
      if (!ndMap[r.country_iso3]) ndMap[r.country_iso3] = {};
      if (r.indicator_code === 'NDGAIN.VULNERABILITY') ndMap[r.country_iso3].vulnerability = Number(r.value);
      if (r.indicator_code === 'NDGAIN.READINESS') ndMap[r.country_iso3].readiness = Number(r.value);
    }
    const { data: allCountryNames } = await supabase
      .from('countries')
      .select('iso3, name')
      .limit(500);
    const ndNameMap: Record<string, string> = {};
    for (const c of allCountryNames || []) ndNameMap[c.iso3] = c.name;
    for (const iso of Object.keys(ndMap)) {
      const d = ndMap[iso];
      if (d?.vulnerability != null && d?.readiness != null) {
        scatterData.push({ iso3: iso, name: ndNameMap[iso] || iso, vulnerability: d.vulnerability, readiness: d.readiness });
      }
    }

    // ── ClimateGap: pre/post Paris CAGR for all countries (server-side) ──
    const { data: allCo2Rows } = await supabase
      .from('country_data')
      .select('country_iso3, year, value')
      .eq('indicator_code', 'EN.GHG.CO2.PC.CE.AR5')
      .gte('year', 1998)
      .lte('year', 2023)
      .order('year')
      .limit(50000);

    const cagrByCountry: Record<string, Record<number, number>> = {};
    for (const r of allCo2Rows || []) {
      if (r.value == null) continue;
      const v = Number(r.value);
      if (isNaN(v)) continue;
      if (!cagrByCountry[r.country_iso3]) cagrByCountry[r.country_iso3] = {};
      cagrByCountry[r.country_iso3][r.year] = v;
    }

    const climateGapData: { iso3: string; name: string; pre: number; post: number }[] = [];
    for (const [isoCode, yearData] of Object.entries(cagrByCountry)) {
      const findVal = (target: number): number | null => {
        for (const offset of [0, 1, -1, 2, -2]) {
          const v = yearData[target + offset];
          if (v != null && v > 0) return v;
        }
        return null;
      };
      const v2000 = findVal(2000);
      const v2014 = findVal(2014);
      const v2015 = findVal(2015);
      const v2023 = findVal(2023);
      if (!v2000 || !v2014 || !v2015 || !v2023) continue;
      const pre = (Math.pow(v2014 / v2000, 1 / 14) - 1) * 100;
      const post = (Math.pow(v2023 / v2015, 1 / 8) - 1) * 100;
      if (Math.abs(pre) > 20 || Math.abs(post) > 20) continue;
      climateGapData.push({ iso3: isoCode, name: ndNameMap[isoCode] || isoCode, pre, post });
    }

    // ── Extra data for client (OWID + CTRACE indicators) ──────────────────
    const CTRACE_SERVER = [
      'CTRACE.POWER','CTRACE.TRANSPORTATION','CTRACE.MANUFACTURING',
      'CTRACE.AGRICULTURE','CTRACE.FOSSIL-FUEL-OPERATIONS','CTRACE.BUILDINGS',
      'CTRACE.WASTE','CTRACE.FORESTRY','CTRACE.MINERAL-EXTRACTION',
    ];
    const ctraceByCode: Record<string, number> = {};
    for (const code of CTRACE_SERVER) {
      if (latestByCode[code]) ctraceByCode[code] = latestByCode[code].value;
    }
    const FUEL_KEYS = ['OWID.COAL_CO2','OWID.OIL_CO2','OWID.GAS_CO2','OWID.CEMENT_CO2','OWID.FLARING_CO2'];
    const fuelSeriesMap: Record<string, { year: number; value: number }[]> = {};
    for (const key of FUEL_KEYS) {
      fuelSeriesMap[key] = (seriesByCode[key] ?? []).map(d => ({ year: d.year, value: d.value }));
    }
    const extraData = {
      consumptionCo2: (seriesByCode['OWID.CONSUMPTION_CO2_PER_CAPITA'] ?? []).map(d => ({ year: d.year, value: d.value })),
      ctraceByCode,
      ctraceYear: latestByCode['CTRACE.POWER']?.year ?? null,
      fuelSeries: fuelSeriesMap,
      cumulativeCo2: latestByCode['OWID.CUMULATIVE_CO2']?.value ?? null,
      shareCumulative: latestByCode['OWID.SHARE_GLOBAL_CUMULATIVE_CO2']?.value ?? null,
      tempGhg: latestByCode['OWID.TEMPERATURE_CHANGE_FROM_GHG']?.value ?? null,
      tempCo2: latestByCode['OWID.TEMPERATURE_CHANGE_FROM_CO2']?.value ?? null,
      tempCh4: latestByCode['OWID.TEMPERATURE_CHANGE_FROM_CH4']?.value ?? null,
      tempN2o: latestByCode['OWID.TEMPERATURE_CHANGE_FROM_N2O']?.value ?? null,
      methaneSeries: (seriesByCode['OWID.METHANE'] ?? []).map(d => ({ year: d.year, value: d.value })),
      n2oSeries: (seriesByCode['OWID.NITROUS_OXIDE'] ?? []).map(d => ({ year: d.year, value: d.value })),
      totalGhgLatest: latestByCode['OWID.TOTAL_GHG']?.value ?? null,
      ghgPerCapitaLatest: latestByCode['OWID.GHG_PER_CAPITA']?.value ?? null,
      co2PerGdpSeries: (seriesByCode['OWID.CO2_PER_GDP'] ?? []).map(d => ({ year: d.year, value: d.value })),
    };

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

    // Carbon intensity of electricity (gCO2/kWh)
    const carbonIntensityLatest = latestByCode['EMBER.CARBON.INTENSITY'];

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
      carbonIntensity: carbonIntensityLatest?.value ?? null,
      extraData,
      climateGapData,
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
    decouplingSeries, sourcesUsed, carbonIntensity,
    extraData, climateGapData,
  } = data;

  // Key stats for header cards
  const co2 = latestByCode['EN.GHG.CO2.PC.CE.AR5'];
  const gdp = latestByCode['NY.GDP.PCAP.CD'];
  const renewable = latestByCode['EMBER.RENEWABLE.PCT'];
  const ndVuln = latestByCode['NDGAIN.VULNERABILITY'];
  const decoupling = latestByCode['DERIVED.DECOUPLING'];
  const pm25 = latestByCode['EN.ATM.PM25.MC.M3'];

  // Score snapshot
  const reportTotal = latestByCode['REPORT.TOTAL'];
  const reportGradeRaw = latestByCode['REPORT.GRADE'];
  const grade = reportGradeRaw ? GRADE_LABELS_COUNTRY[Math.round(reportGradeRaw.value)] : null;
  const gradeColor = grade ? GRADE_COLOR_COUNTRY[grade] : '#6B7280';
  const gradeBg = grade ? GRADE_BG_COUNTRY[grade] : '#F9FAFB';
  const climateClassRaw = latestByCode['DERIVED.CLIMATE_CLASS'];
  const climateClass = climateClassRaw
    ? (climateClassRaw.value === 1 ? 'Changer' : climateClassRaw.value === 2 ? 'Starter' : 'Talker')
    : null;
  const classColor = climateClass === 'Changer' ? '#00A67E' : climateClass === 'Starter' ? '#F59E0B' : '#E5484D';

  // Auto-generated insights (max 3)
  const insights: { text: string; color: string }[] = [];
  if (co2) {
    const level = co2.value > 10 ? 'high' : co2.value > 5 ? 'above average' : co2.value > 2 ? 'moderate' : 'low';
    insights.push({ text: `CO\u2082 at ${co2.value.toFixed(1)}t per capita \u2014 ${level} by global standards`, color: co2.value > 5 ? '#E5484D' : '#00A67E' });
  }
  if (renewable) {
    let txt = `Renewable electricity at ${renewable.value.toFixed(1)}%`;
    if (renewableChange != null) {
      txt += renewableChange > 0
        ? `, up ${renewableChange.toFixed(1)}pp over 5 years`
        : `, down ${Math.abs(renewableChange).toFixed(1)}pp over 5 years`;
    }
    insights.push({ text: txt, color: renewable.value > 30 ? '#00A67E' : '#F59E0B' });
  }
  if (ndVuln) {
    const vb = getVulnerabilityBadge(ndVuln.value);
    insights.push({ text: `Climate vulnerability: ${vb.label.toLowerCase()} (ND-GAIN ${ndVuln.value.toFixed(3)})`, color: vb.dotColor });
  }

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

      {/* Context bar */}
      <nav className="border-b border-[--border-card] bg-[--bg-section] px-4 py-2.5">
        <div className="mx-auto flex max-w-[1200px] items-center gap-1.5 text-xs text-[--text-muted]">
          <Link href="/explore" className="transition-colors hover:text-[--accent-primary]">Explore</Link>
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          <span>{country.sub_region || country.region}</span>
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          <span className="font-medium text-[--text-secondary]">{country.name}</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-[--border-card] bg-white px-4 pt-8 pb-10 sm:pt-12 sm:pb-12">
        <div className="mx-auto max-w-[1200px]">
          {/* Identity + Score snapshot */}
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: flag + name + meta */}
            <div className="flex items-start gap-5">
              {country.flag_url && (
                <Image
                  src={country.flag_url}
                  alt={`${country.name} flag`}
                  width={72}
                  height={54}
                  className="mt-1 rounded-lg shadow-sm"
                  unoptimized
                />
              )}
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[--text-primary] sm:text-4xl">{country.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[--text-secondary]">
                  <span>{country.sub_region || country.region}</span>
                  {country.income_group && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">{country.income_group}</span>
                  )}
                  {country.population && (
                    <span className="text-[--text-muted]">
                      {'Pop. '}
                      {(() => {
                        const n = Number(country.population);
                        if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
                        if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
                        if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
                        return n.toLocaleString();
                      })()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: core score card */}
            {grade && (
              <Link
                href={`/report/${country.iso3}`}
                className="group flex items-center gap-5 rounded-2xl border border-[--border-card] bg-white px-6 py-5 transition-shadow hover:shadow-md"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div
                  className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full border-[3px]"
                  style={{ borderColor: gradeColor, backgroundColor: gradeBg }}
                >
                  <span className="font-mono text-2xl font-bold" style={{ color: gradeColor }}>{grade}</span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[--text-muted]">Climate Score</p>
                  <p className="font-mono text-2xl font-bold text-[--text-primary]">
                    {reportTotal ? Math.round(reportTotal.value) : '\u2014'}
                    <span className="text-sm font-normal text-[--text-muted]"> / 100</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {climateClass && (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: classColor }}
                      >
                        {climateClass}
                      </span>
                    )}
                    {vulnerability && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${vulnerability.bgColor} ${vulnerability.textColor}`}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: vulnerability.dotColor }} />
                        {vulnerability.label}
                      </span>
                    )}
                  </div>
                </div>
                <svg className="ml-1 h-4 w-4 flex-shrink-0 text-[--text-muted] opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </Link>
            )}
          </div>

          {/* Key metrics */}
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="CO\u2082 per capita"
              value={co2 ? co2.value.toFixed(1) : '\u2014'}
              unit="t CO\u2082e"
              source={co2 ? `${co2.source} (${co2.year})` : undefined}
            />
            <StatCard
              title="GDP"
              value={gdp && country.population ? formatGdpTotal(gdp.value, Number(country.population)) : (gdp ? `$${gdp.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '\u2014')}
              unit={gdp && country.population ? `($${(gdp.value / 1000).toFixed(1)}k/capita)` : 'per capita'}
              source={gdp ? `World Bank (${gdp.year})` : undefined}
            />
            <StatCard
              title="Renewable electricity"
              value={renewable ? renewable.value.toFixed(1) : '\u2014'}
              unit="%"
              trend={renewableChange != null ? { direction: renewableChange > 0 ? 'up' : 'down', label: `${renewableChange > 0 ? '+' : ''}${renewableChange.toFixed(1)}pp (5yr)` } : undefined}
              source={renewable ? `Ember (${renewable.year})` : undefined}
            />
            <StatCard
              title="Vulnerability"
              value={ndVuln ? ndVuln.value.toFixed(3) : '\u2014'}
              unit="ND-GAIN index"
              source={ndVuln ? `ND-GAIN (${ndVuln.year})` : undefined}
            />
          </div>

          {/* Top 3 insights */}
          {insights.length > 0 && (
            <div className="mt-6 rounded-xl border border-[--border-card] bg-[--bg-section] px-5 py-4">
              <ul className="space-y-2.5">
                {insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[--text-secondary]">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: ins.color }} />
                    <span>{ins.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
        carbonIntensity={carbonIntensity}
        initialExtra={extraData}
        climateGapData={climateGapData}
      />

      {/* Data Sources (accordion by category) */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-12">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">Data Sources</h2>
          {/* Derived Indicators Methodology */}
          <details className="group mb-4 rounded-xl border border-[--border-card] bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-[--text-primary] hover:bg-gray-50">
              <span>Derived Indicators — Methodology</span>
              <svg className="h-4 w-4 text-[--text-muted] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </summary>
            <div className="border-t border-[--border-card] px-5 py-4 space-y-4 text-sm text-[--text-secondary]">
              <div>
                <p className="font-semibold text-[--text-primary] mb-1">Carbon Intensity of GDP <span className="font-mono text-xs text-[--text-muted]">(DERIVED.CO2_PER_GDP)</span></p>
                <p className="font-mono text-xs bg-[--bg-section] rounded px-3 py-1.5">CO₂_per_capita ÷ GDP_per_capita × 1,000</p>
                <p className="mt-1 text-xs text-[--text-muted]">Unit: tCO₂ per $1,000 GDP. Lower = cleaner economy. 2023 range: DEU 0.13 → KOR 0.32.</p>
              </div>
              <div>
                <p className="font-semibold text-[--text-primary] mb-1">Decoupling Index <span className="font-mono text-xs text-[--text-muted]">(DERIVED.DECOUPLING)</span></p>
                <p className="font-mono text-xs bg-[--bg-section] rounded px-3 py-1.5">GDP_growth_rate(%) − CO₂_growth_rate(%)</p>
                <p className="mt-1 text-xs text-[--text-muted]">Unit: percentage points. Positive = economy growing faster than emissions.</p>
              </div>
              <div>
                <p className="font-semibold text-[--text-primary] mb-1">Energy Transition Momentum <span className="font-mono text-xs text-[--text-muted]">(DERIVED.ENERGY_TRANSITION)</span></p>
                <p className="font-mono text-xs bg-[--bg-section] rounded px-3 py-1.5">RENEWABLE_PCT(t) − RENEWABLE_PCT(t−5)</p>
                <p className="mt-1 text-xs text-[--text-muted]">Unit: pp over 5 years. 2023: DEU +19.2pp, BRA +6.6pp, USA +5.2pp, KOR +4.9pp.</p>
              </div>
            </div>
          </details>

          {(() => {
            const CATEGORY_CODES: Record<string, string[]> = {
              'Emissions':    ['EN.GHG.CO2.PC.CE.AR5', 'CT.GHG.TOTAL', 'DERIVED.DECOUPLING', 'DERIVED.CO2_PER_GDP', 'DERIVED.EMISSIONS_INTENSITY'],
              'Energy':       ['EMBER.RENEWABLE.PCT', 'EMBER.FOSSIL.PCT', 'EMBER.CARBON.INTENSITY', 'EG.USE.PCAP.KG.OE', 'DERIVED.ENERGY_TRANSITION'],
              'Economy':      ['NY.GDP.PCAP.CD'],
              'Climate Risk': ['NDGAIN.VULNERABILITY', 'NDGAIN.READINESS', 'EN.ATM.PM25.MC.M3', 'AG.LND.FRST.ZS'],
              'Derived':      [],
            };
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
