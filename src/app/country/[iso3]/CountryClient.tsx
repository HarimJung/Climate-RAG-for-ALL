'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageWrapper, HeroSection } from '@/components/climate';

// Chart components
import { EmissionsLineChart } from '@/components/charts/EmissionsLineChart';
import { IndexedDualLineChart, IndexedTripleLineChart } from '@/components/charts/IndexedLineCharts';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { StackedAreaChart } from '@/components/charts/StackedAreaChart';
import { DualYLineChart } from '@/components/charts/DualYLineChart';
import { VulnerabilityScatter } from '@/components/charts/VulnerabilityScatter';

// Section components
import { EmissionsSection } from '@/components/sections/EmissionsSection';
import { EnergySection } from '@/components/sections/EnergySection';
import { EconomySection } from '@/components/sections/EconomySection';
import { ResilienceSection } from '@/components/sections/ResilienceSection';
import { DataSourcesSection } from '@/components/sections/DataSourcesSection';

// Shared helpers
import { SafeChart, signed } from '@/components/sections/shared';

// Data imports
import emissionsTrend from '../../../../data/analysis/emissions-trend-6countries.json';
import riskProfileKOR from '../../../../data/analysis/risk-profile-KOR.json';
import riskProfileUSA from '../../../../data/analysis/risk-profile-USA.json';
import riskProfileDEU from '../../../../data/analysis/risk-profile-DEU.json';
import riskProfileBRA from '../../../../data/analysis/risk-profile-BRA.json';
import riskProfileNGA from '../../../../data/analysis/risk-profile-NGA.json';
import riskProfileBGD from '../../../../data/analysis/risk-profile-BGD.json';

const RISK_PROFILES = {
  KOR: riskProfileKOR, USA: riskProfileUSA, DEU: riskProfileDEU,
  BRA: riskProfileBRA, NGA: riskProfileNGA, BGD: riskProfileBGD,
} as const;

// ── CTRACE sector metadata ────────────────────────────────────────────────────
const SECTOR_META: Record<string, { label: string; color: string }> = {
  'CTRACE.POWER':                  { label: 'Power',           color: '#EF4444' },
  'CTRACE.TRANSPORTATION':         { label: 'Transportation',   color: '#F59E0B' },
  'CTRACE.MANUFACTURING':          { label: 'Manufacturing',    color: '#8B5CF6' },
  'CTRACE.AGRICULTURE':            { label: 'Agriculture',      color: '#10B981' },
  'CTRACE.FOSSIL-FUEL-OPERATIONS': { label: 'Fossil Fuel Ops', color: '#78716C' },
  'CTRACE.BUILDINGS':              { label: 'Buildings',        color: '#3B82F6' },
  'CTRACE.WASTE':                  { label: 'Waste',            color: '#6B7280' },
  'CTRACE.FORESTRY':               { label: 'Forestry',         color: '#059669' },
  'CTRACE.MINERAL-EXTRACTION':     { label: 'Minerals',         color: '#D97706' },
};
const CTRACE_CODES = Object.keys(SECTOR_META);

const FUEL_SERIES = [
  { key: 'OWID.COAL_CO2',    label: 'Coal',    color: '#374151' },
  { key: 'OWID.OIL_CO2',     label: 'Oil',     color: '#92400E' },
  { key: 'OWID.GAS_CO2',     label: 'Gas',     color: '#F59E0B' },
  { key: 'OWID.CEMENT_CO2',  label: 'Cement',  color: '#9CA3AF' },
  { key: 'OWID.FLARING_CO2', label: 'Flaring', color: '#DC2626' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExtraData {
  consumptionCo2: { year: number; value: number }[];
  ctraceByCode: Record<string, number>;
  ctraceYear: number | null;
  fuelSeries: Record<string, { year: number; value: number }[]>;
  cumulativeCo2: number | null;
  shareCumulative: number | null;
  tempGhg: number | null;
  tempCo2: number | null;
  tempCh4: number | null;
  tempN2o: number | null;
  methaneSeries: { year: number; value: number }[];
  n2oSeries: { year: number; value: number }[];
  totalGhgLatest: number | null;
  ghgPerCapitaLatest: number | null;
  co2PerGdpSeries: { year: number; value: number }[];
}

const EMPTY_EXTRA: ExtraData = {
  consumptionCo2: [], ctraceByCode: {}, ctraceYear: null,
  fuelSeries: {}, cumulativeCo2: null, shareCumulative: null,
  tempGhg: null, tempCo2: null, tempCh4: null, tempN2o: null,
  methaneSeries: [], n2oSeries: [], totalGhgLatest: null,
  ghgPerCapitaLatest: null, co2PerGdpSeries: [],
};

export interface CountryClientProps {
  countryName: string;
  iso3: string;
  wbCo2Series: { year: number; value: number }[];
  co2Comparison: { year: number; wb: number; ct: number }[];
  gdpVsCo2: { year: number; gdp: number; co2: number }[];
  emberMix: { renewable: number; fossil: number; other: number; year: number; source: string } | null;
  renewableChange: number | null;
  scatterData: { iso3: string; name: string; vulnerability: number; readiness: number }[];
  decouplingSeries: { year: number; value: number }[];
  decouplingScore: number | null;
  pm25?: number | null;
  carbonIntensity?: number | null;
  initialExtra?: ExtraData;
  climateGapData?: { iso3: string; name: string; pre: number; post: number }[];
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CountryClient({
  countryName, iso3, wbCo2Series, co2Comparison, gdpVsCo2,
  emberMix, renewableChange, scatterData, decouplingSeries, decouplingScore, pm25 = null,
  carbonIntensity = null, initialExtra, climateGapData,
}: CountryClientProps) {

  const [extra, setExtra] = useState<ExtraData>(initialExtra ?? EMPTY_EXTRA);
  const [showNdcGap, setShowNdcGap] = useState(false);
  const [showKaya, setShowKaya] = useState(false);
  const [showEquity, setShowEquity] = useState(false);

  useEffect(() => {
    // Skip OWID/CTRACE client-side fetch if server provided initial data
    const hasServerExtra = initialExtra &&
      (Object.keys(initialExtra.ctraceByCode).length > 0 ||
       initialExtra.methaneSeries.length > 0 ||
       initialExtra.cumulativeCo2 != null ||
       Object.values(initialExtra.fuelSeries).some(s => s.length > 0));

    if (!hasServerExtra) {
    const supabase = createClient();
    const codes = [
      'OWID.CONSUMPTION_CO2_PER_CAPITA',
      ...CTRACE_CODES,
      'CTRACE.TOTAL',
      ...FUEL_SERIES.map(f => f.key),
      'OWID.CUMULATIVE_CO2', 'OWID.SHARE_GLOBAL_CUMULATIVE_CO2',
      'OWID.TEMPERATURE_CHANGE_FROM_GHG', 'OWID.TEMPERATURE_CHANGE_FROM_CO2',
      'OWID.TEMPERATURE_CHANGE_FROM_CH4', 'OWID.TEMPERATURE_CHANGE_FROM_N2O',
      'OWID.METHANE', 'OWID.NITROUS_OXIDE', 'OWID.TOTAL_GHG', 'OWID.GHG_PER_CAPITA',
      'OWID.CO2_PER_GDP',
    ];

    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('country_data')
          .select('indicator_code, year, value')
          .eq('country_iso3', iso3)
          .in('indicator_code', codes)
          .order('year', { ascending: true });
        if (error) {
          console.error('[Supabase extra fetch] API error:', error.message, error);
          return;
        }
        if (!rows || rows.length === 0) {
          console.warn('[Supabase extra fetch] no rows for', iso3);
          return;
        }
        const grouped: Record<string, { year: number; value: number }[]> = {};
        const latest: Record<string, { year: number; value: number }> = {};
        for (const r of rows) {
          if (r.value == null) continue;
          const v = Number(r.value);
          if (isNaN(v)) continue;
          if (!grouped[r.indicator_code]) grouped[r.indicator_code] = [];
          grouped[r.indicator_code].push({ year: r.year, value: v });
          if (!latest[r.indicator_code] || r.year > latest[r.indicator_code].year) {
            latest[r.indicator_code] = { year: r.year, value: v };
          }
        }
        const ctraceByCode: Record<string, number> = {};
        for (const code of CTRACE_CODES) {
          if (latest[code]) ctraceByCode[code] = latest[code].value;
        }
        const fuelSeries: Record<string, { year: number; value: number }[]> = {};
        for (const f of FUEL_SERIES) { fuelSeries[f.key] = grouped[f.key] ?? []; }
        setExtra({
          consumptionCo2: grouped['OWID.CONSUMPTION_CO2_PER_CAPITA'] ?? [],
          ctraceByCode, ctraceYear: latest['CTRACE.POWER']?.year ?? null,
          fuelSeries,
          cumulativeCo2: latest['OWID.CUMULATIVE_CO2']?.value ?? null,
          shareCumulative: latest['OWID.SHARE_GLOBAL_CUMULATIVE_CO2']?.value ?? null,
          tempGhg: latest['OWID.TEMPERATURE_CHANGE_FROM_GHG']?.value ?? null,
          tempCo2: latest['OWID.TEMPERATURE_CHANGE_FROM_CO2']?.value ?? null,
          tempCh4: latest['OWID.TEMPERATURE_CHANGE_FROM_CH4']?.value ?? null,
          tempN2o: latest['OWID.TEMPERATURE_CHANGE_FROM_N2O']?.value ?? null,
          methaneSeries: grouped['OWID.METHANE'] ?? [],
          n2oSeries: grouped['OWID.NITROUS_OXIDE'] ?? [],
          totalGhgLatest: latest['OWID.TOTAL_GHG']?.value ?? null,
          ghgPerCapitaLatest: latest['OWID.GHG_PER_CAPITA']?.value ?? null,
          co2PerGdpSeries: grouped['OWID.CO2_PER_GDP'] ?? [],
        });
      } catch (err) {
        console.error('[Supabase extra fetch] caught:', err);
      }
    })();
    } // end if (!hasServerExtra)

    // Check for NDC Gap data
    fetch(`/data/ndc-gap/${iso3}.json`)
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (d?.historical?.length > 0) setShowNdcGap(true); })
      .catch(() => { /* no NDC data */ });

    // Check for Kaya data
    fetch(`/data/kaya/${iso3}.json`)
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (d?.waterfall?.length > 0) setShowKaya(true); })
      .catch(() => { /* no Kaya data */ });

    // Check for Equity data
    fetch('/data/equity-scatter.json')
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (d?.countries?.length > 0) setShowEquity(true); })
      .catch(() => { /* no equity data */ });
  }, [iso3]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: emissions-trend JSON ───────────────────────────────────────────
  const preParisRaw = emissionsTrend.pre_paris_vs_post_paris;
  const parisData = iso3 in preParisRaw ? preParisRaw[iso3 as keyof typeof preParisRaw] : null;
  const cagrRaw = emissionsTrend.cagr_2000_2023;
  const cagrData = iso3 in cagrRaw ? cagrRaw[iso3 as keyof typeof cagrRaw] : null;
  const decouplingRaw = emissionsTrend.decoupling_score;
  const decouplingEntry = iso3 in decouplingRaw ? decouplingRaw[iso3 as keyof typeof decouplingRaw] : null;
  const transitionEntry = emissionsTrend.energy_transition_ranking.find(d => d.country === iso3) ?? null;
  const sortedAccels = Object.values(preParisRaw).map(d => d.acceleration).sort((a, b) => a - b);
  const accelRank = parisData ? sortedAccels.indexOf(parisData.acceleration) + 1 : null;
  const riskProfile = iso3 in RISK_PROFILES ? RISK_PROFILES[iso3 as keyof typeof RISK_PROFILES] : null;
  const myScatter = scatterData.find(d => d.iso3 === iso3) ?? null;
  const readinessRank = myScatter
    ? [...scatterData].sort((a, b) => b.readiness - a.readiness).findIndex(d => d.iso3 === iso3) + 1
    : null;

  // ── Derived: CTRACE bars ────────────────────────────────────────────────────
  const ctraceBars = Object.entries(extra.ctraceByCode)
    .filter(([code]) => SECTOR_META[code])
    .map(([code, value]) => ({
      label: SECTOR_META[code].label,
      color: SECTOR_META[code].color,
      value,
    }))
    .sort((a, b) => b.value - a.value);
  const ctraceTotal = extra.ctraceByCode['CTRACE.TOTAL'] ?? ctraceBars.reduce((s, b) => s + b.value, 0);
  const ctraceBarsWithPct = ctraceBars.map(b => ({ ...b, pct: ctraceTotal > 0 ? (b.value / ctraceTotal) * 100 : 0 }));

  // ── Derived: Fuel stacked area ──────────────────────────────────────────────
  const fuelYears = [...new Set(
    FUEL_SERIES.flatMap(f => (extra.fuelSeries[f.key] ?? []).map(d => d.year))
  )].sort((a, b) => a - b);
  const fuelData: Record<number, Record<string, number>> = {};
  for (const y of fuelYears) {
    fuelData[y] = {};
    for (const f of FUEL_SERIES) {
      const row = (extra.fuelSeries[f.key] ?? []).find(d => d.year === y);
      if (row) fuelData[y][f.key] = row.value;
    }
  }
  const hasFuelData = fuelYears.length > 0;

  const latestCo2 = wbCo2Series.length > 0 ? wbCo2Series[wbCo2Series.length - 1].value : null;
  const latestYear = wbCo2Series.length > 0 ? wbCo2Series[wbCo2Series.length - 1].year : 2023;
  const latestRenewable = emberMix?.renewable ?? null;

  // Build hero stats dynamically
  const heroStats: { label: string; value: string }[] = [];
  if (latestCo2 != null) heroStats.push({ label: 'CO\u2082/capita', value: `${latestCo2.toFixed(1)}t` });
  if (latestRenewable != null) heroStats.push({ label: 'Renewable', value: `${latestRenewable.toFixed(1)}%` });
  if (decouplingScore != null) heroStats.push({ label: 'Decoupling', value: signed(decouplingScore) });

  return (
    <PageWrapper>
      {/* ═══════════════════════════════════════ HERO ═══════════════════════════════════════ */}
      <HeroSection
        countryName={countryName}
        heroNumber={latestCo2 ?? 0}
        heroDecimals={1}
        heroSuffix="t"
        heroLabel={`CO\u2082 per capita, ${latestYear}`}
        stats={heroStats}
        backgroundContent={
          <div className="w-full max-w-[1400px]">
            <SafeChart name="Emissions">
              <EmissionsLineChart production={wbCo2Series} consumption={extra.consumptionCo2} countryName={countryName} strokeW={3} />
            </SafeChart>
          </div>
        }
      />

      <EmissionsSection
        countryName={countryName}
        iso3={iso3}
        wbCo2Series={wbCo2Series}
        consumptionCo2={extra.consumptionCo2}
        co2Comparison={co2Comparison}
        parisData={parisData}
        cagrData={cagrData}
        accelRank={accelRank}
        latestCo2={latestCo2}
        latestYear={latestYear}
        emberMix={emberMix}
        showNdcGap={showNdcGap}
        ctraceBarsWithPct={ctraceBarsWithPct}
        ctraceTotal={ctraceTotal}
        ctraceYear={extra.ctraceYear}
        hasFuelData={hasFuelData}
        fuelYears={fuelYears}
        fuelData={fuelData}
        FUEL_SERIES={FUEL_SERIES}
        climateGapData={climateGapData}
        EmissionsLineChart={EmissionsLineChart}
        IndexedDualLineChart={IndexedDualLineChart}
        HorizontalBarChart={HorizontalBarChart}
        StackedAreaChart={StackedAreaChart}
      />

      {emberMix && (
        <EnergySection
          countryName={countryName}
          emberMix={emberMix}
          renewableChange={renewableChange}
          carbonIntensity={carbonIntensity ?? null}
          transitionEntry={transitionEntry}
        />
      )}

      {(gdpVsCo2.length > 0 || extra.cumulativeCo2 != null || extra.methaneSeries.length > 0) && (
        <EconomySection
          countryName={countryName}
          gdpVsCo2={gdpVsCo2}
          cumulativeCo2={extra.cumulativeCo2}
          shareCumulative={extra.shareCumulative}
          tempGhg={extra.tempGhg}
          tempCo2={extra.tempCo2}
          tempCh4={extra.tempCh4}
          tempN2o={extra.tempN2o}
          totalGhgLatest={extra.totalGhgLatest}
          ghgPerCapitaLatest={extra.ghgPerCapitaLatest}
          co2PerGdpSeries={extra.co2PerGdpSeries}
          methaneSeries={extra.methaneSeries}
          n2oSeries={extra.n2oSeries}
          decouplingScore={decouplingScore}
          decouplingEntry={decouplingEntry}
          accelRank={accelRank}
          IndexedTripleLineChart={IndexedTripleLineChart}
          DualYLineChart={DualYLineChart}
        />
      )}

      <ResilienceSection
        countryName={countryName}
        iso3={iso3}
        scatterData={scatterData}
        myScatter={myScatter}
        readinessRank={readinessRank}
        riskProfile={riskProfile}
        emberMix={emberMix}
        showKaya={showKaya}
        showEquity={showEquity}
        VulnerabilityScatter={VulnerabilityScatter}
      />

      <DataSourcesSection
        countryName={countryName}
        latestCo2={latestCo2}
        parisData={parisData}
        emberMix={emberMix}
        decouplingScore={decouplingScore}
        myScatter={myScatter}
        riskProfile={riskProfile}
      />
    </PageWrapper>
  );
}
