'use client';

import React from 'react';
import {
  SectionHeader,
  StoryBlock,
  ChartCard,
} from '@/components/climate';
import { ClimateGap } from '@/components/charts/ClimateGap';
import { NDCGapChart } from '@/components/charts/NDCGapChart';
import { SafeChart, ChartErrorBoundary, InsightPanel, SourceLabel, ordinal, signed } from '@/components/sections/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FuelSeriesEntry {
  key: string;
  label: string;
  color: string;
}

export interface EmissionsSectionProps {
  countryName: string;
  iso3: string;
  wbCo2Series: { year: number; value: number }[];
  consumptionCo2: { year: number; value: number }[];
  co2Comparison: { year: number; wb: number; ct: number }[];
  parisData: {
    pre_paris_cagr_pct: number;
    post_paris_cagr_pct: number;
    acceleration: number;
    value_2023: number;
  } | null;
  cagrData: {
    cagr_pct: number;
    total_change_pct: number;
  } | null;
  accelRank: number | null;
  latestCo2: number | null;
  latestYear: number;
  emberMix: { renewable: number; fossil: number; other: number; year: number; source: string } | null;
  showNdcGap: boolean;
  ctraceBarsWithPct: { label: string; value: number; color: string; pct: number }[];
  ctraceTotal: number;
  ctraceYear: number | null;
  hasFuelData: boolean;
  fuelYears: number[];
  fuelData: Record<number, Record<string, number>>;
  FUEL_SERIES: FuelSeriesEntry[];
  climateGapData?: { iso3: string; name: string; pre: number; post: number }[];
  // Chart components passed as render props
  EmissionsLineChart: React.ComponentType<{
    production: { year: number; value: number }[];
    consumption?: { year: number; value: number }[];
    countryName: string;
    strokeW?: number;
  }>;
  IndexedDualLineChart: React.ComponentType<{
    data: { year: number; a: number; b: number }[];
    aColor: string;
    bColor: string;
    aLabel: string;
    bLabel: string;
    yAxisLabel?: string;
  }>;
  HorizontalBarChart: React.ComponentType<{
    bars: { label: string; value: number; color: string; pct: number }[];
  }>;
  StackedAreaChart: React.ComponentType<{
    years: number[];
    seriesDef: { key: string; label: string; color: string }[];
    data: Record<number, Record<string, number>>;
  }>;
}

export function EmissionsSection({
  countryName,
  iso3,
  wbCo2Series,
  consumptionCo2,
  co2Comparison,
  parisData,
  cagrData,
  accelRank,
  latestCo2,
  latestYear,
  emberMix,
  showNdcGap,
  ctraceBarsWithPct,
  ctraceTotal,
  ctraceYear,
  hasFuelData,
  fuelYears,
  fuelData,
  FUEL_SERIES,
  climateGapData,
  EmissionsLineChart,
  IndexedDualLineChart,
  HorizontalBarChart,
  StackedAreaChart,
}: EmissionsSectionProps) {
  return (
    <>
      {/* ═══════════════════════════════════════ EMISSIONS ═══════════════════════════════════════ */}
      <SectionHeader
        category="emissions"
        title="Emissions Trajectory"
        subtitle="Emissions are shifting. But is it enough?"
      />

      {/* CO₂ per capita line chart */}
      <StoryBlock
        layout="text-left"
        insight={
          <InsightPanel tag="Pre-Paris (2000-2014)" tagColor="text-emerald-600">
            <p>
              {parisData
                ? <><strong>{countryName}&apos;s emissions</strong> grew at <span className="font-mono font-bold">{signed(parisData.pre_paris_cagr_pct)}%/yr</span>.{cagrData ? ` The long-term CAGR (2000-2023) was ${signed(cagrData.cagr_pct)}%/yr.` : ''}</>
                : <>{countryName}&apos;s emissions trajectory is being tracked across multiple data sources.</>
              }
            </p>
            {parisData && (
              <p className="mt-3">
                Post-Paris, the rate shifted to{' '}
                <strong className={parisData.post_paris_cagr_pct < 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {signed(parisData.post_paris_cagr_pct)}%/yr
                </strong>{' '}
                &mdash; a <strong>{signed(parisData.acceleration)}pp shift</strong>.
                {cagrData ? ` Per capita emissions reached ${parisData.value_2023.toFixed(1)}t in 2023.` : ''}
              </p>
            )}
          </InsightPanel>
        }
      >
        <ChartCard
          category="emissions"
          title={`${countryName} \u2014 CO\u2082 per capita (2000-${latestYear})`}
          subtitle={`Source: World Bank WDI${consumptionCo2.length > 0 ? ' + OWID Consumption' : ''}`}
        >
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 rounded bg-[#EF4444]" />
              <span className="text-slate-500">Production-based</span>
            </span>
            {consumptionCo2.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 rounded bg-[#8B5CF6]" style={{ borderTop: '2px dashed #8B5CF6', background: 'transparent' }} />
                <span className="text-slate-500">Consumption-based</span>
              </span>
            )}
          </div>
          <SafeChart name="Emissions">
            <EmissionsLineChart production={wbCo2Series} consumption={consumptionCo2} countryName={countryName} />
          </SafeChart>
        </ChartCard>
      </StoryBlock>

      {/* Pre-Paris vs Post-Paris */}
      <StoryBlock
        layout="text-right"
        delay={0.05}
        insight={
          <InsightPanel tag="Post-Paris Shift" tagColor="text-emerald-600">
            <p>
              {accelRank !== null
                ? `This ranks ${ordinal(accelRank)} largest deceleration among tracked countries.`
                : `${countryName}'s emissions trajectory reflects ongoing energy transition dynamics.`}
              {cagrData ? ` Overall change since 2000: ${cagrData.total_change_pct > 0 ? '+' : ''}${cagrData.total_change_pct.toFixed(1)}%.` : ''}
            </p>
          </InsightPanel>
        }
      >
        <ChartCard
          category="emissions"
          title="Pre-Paris vs Post-Paris CAGR"
          badge="Key Comparison"
        >
          <SafeChart name="Climate Gap">
            <ClimateGap highlightIso3={iso3} serverData={climateGapData} />
          </SafeChart>
          <SourceLabel>Source: World Bank WDI</SourceLabel>
        </ChartCard>
      </StoryBlock>

      {/* WB vs Climate TRACE comparison */}
      {co2Comparison.length > 0 && (
        <StoryBlock layout="full" delay={0.05}>
          <ChartCard
            category="emissions"
            title="World Bank vs Climate TRACE"
            subtitle="CO₂ per capita comparison"
          >
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 rounded bg-[#0066FF]" />
                <span className="text-slate-500">World Bank (WDI)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 rounded bg-[#EF4444]" style={{ borderTop: '2px dashed #EF4444', background: 'transparent' }} />
                <span className="text-slate-500">Climate TRACE</span>
              </span>
            </div>
            <SafeChart name="WB vs CT">
              <IndexedDualLineChart
                data={co2Comparison.map(d => ({ year: d.year, a: d.wb, b: d.ct }))}
                aColor="#0066FF" bColor="#EF4444"
                aLabel="World Bank" bLabel="Climate TRACE"
                yAxisLabel="t CO₂e/capita"
              />
            </SafeChart>
            <SourceLabel>Source: World Bank WDI vs Climate TRACE v7</SourceLabel>
          </ChartCard>
        </StoryBlock>
      )}

      {/* NDC Gap if available */}
      {showNdcGap && (
        <StoryBlock layout="full" delay={0.05}>
          <ChartErrorBoundary fallback={null}>
            <ChartCard
              category="emissions"
              title={`${countryName} \u2014 NDC Target vs Projection`}
              subtitle="Source: UNFCCC NDC Registry"
            >
              <NDCGapChart iso3={iso3} />
            </ChartCard>
          </ChartErrorBoundary>
        </StoryBlock>
      )}

      {/* Emissions by Sector */}
      {ctraceBarsWithPct.length > 0 && (
        <>
          <StoryBlock
            layout="text-left"
            delay={0.05}
            insight={
              <InsightPanel tag="Sector Breakdown" tagColor="text-emerald-600">
                <p>
                  {ctraceBarsWithPct[0] && (
                    <><strong>{ctraceBarsWithPct[0].label}</strong> dominates at <strong>{ctraceBarsWithPct[0].pct.toFixed(1)}%</strong> of total emissions. </>
                  )}
                  {ctraceBarsWithPct[1] && (
                    <><strong>{ctraceBarsWithPct[1].label}</strong> follows at <strong>{ctraceBarsWithPct[1].pct.toFixed(1)}%</strong>.</>
                  )}
                  {ctraceTotal > 0 && (
                    <> Total: {ctraceTotal >= 1000 ? `${(ctraceTotal / 1000).toFixed(2)} Gt` : `${ctraceTotal.toFixed(1)} Mt`} CO₂e.</>
                  )}
                </p>
              </InsightPanel>
            }
          >
            <ChartCard
              category="emissions"
              title={`Emissions by Sector ${ctraceYear ? `(${ctraceYear})` : ''}`}
              subtitle="Source: Climate TRACE v7"
              badge={ctraceTotal > 0 ? `${ctraceTotal >= 1000 ? `${(ctraceTotal / 1000).toFixed(2)} Gt` : `${ctraceTotal.toFixed(1)} Mt`}` : undefined}
            >
              <SafeChart name="Sector Emissions">
                <HorizontalBarChart bars={ctraceBarsWithPct} />
              </SafeChart>
            </ChartCard>
          </StoryBlock>
        </>
      )}

      {/* Fossil CO₂ by Fuel */}
      {hasFuelData && (
        <StoryBlock
          layout="text-left"
          delay={0.05}
          insight={
            <InsightPanel tag="Fossil Fuel Mix" tagColor="text-emerald-600">
              <p>
                {emberMix ? (
                  <>Fossil fuels still make up <strong>{emberMix.fossil.toFixed(1)}%</strong> of the electricity mix.</>
                ) : (
                  <>Historical fossil fuel CO₂ breakdown shows the evolving energy mix.</>
                )}
                {FUEL_SERIES[0] && fuelYears.length > 0 && (() => {
                  const lastYear = fuelYears[fuelYears.length - 1];
                  const vals = FUEL_SERIES.map(f => ({
                    label: f.label,
                    value: fuelData[lastYear]?.[f.key] ?? 0,
                  })).sort((a, b) => b.value - a.value);
                  const top = vals[0];
                  return top.value > 0
                    ? ` In ${lastYear}, ${top.label} was the dominant source at ${top.value.toFixed(1)} Mt CO₂.`
                    : '';
                })()}
              </p>
            </InsightPanel>
          }
        >
          <ChartCard
            category="emissions"
            title="Fossil CO₂ by Fuel Type"
            subtitle="Source: Our World in Data"
          >
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
              {FUEL_SERIES.map(f => (
                <span key={f.key} className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: f.color }} />
                  <span className="text-slate-500">{f.label}</span>
                </span>
              ))}
            </div>
            <SafeChart name="Fuel Breakdown">
              <StackedAreaChart years={fuelYears} seriesDef={FUEL_SERIES} data={fuelData} />
            </SafeChart>
          </ChartCard>
        </StoryBlock>
      )}
    </>
  );
}
