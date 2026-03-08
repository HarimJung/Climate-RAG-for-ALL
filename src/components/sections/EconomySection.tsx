'use client';

import React from 'react';
import {
  SectionHeader,
  StoryBlock,
  ChartCard,
} from '@/components/climate';
import { SafeChart, InsightPanel, SourceLabel, MetricRow, ordinal, signed } from '@/components/sections/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EconomySectionProps {
  countryName: string;
  gdpVsCo2: { year: number; gdp: number; co2: number }[];
  cumulativeCo2: number | null;
  shareCumulative: number | null;
  tempGhg: number | null;
  tempCo2: number | null;
  tempCh4: number | null;
  tempN2o: number | null;
  totalGhgLatest: number | null;
  ghgPerCapitaLatest: number | null;
  co2PerGdpSeries: { year: number; value: number }[];
  methaneSeries: { year: number; value: number }[];
  n2oSeries: { year: number; value: number }[];
  decouplingScore: number | null;
  decouplingEntry: {
    interpretation: string;
    avg_decoupling_2015_2023: number;
    rank: number;
  } | null;
  accelRank: number | null;
  // Chart components passed as render props
  IndexedTripleLineChart: React.ComponentType<{
    gdpCo2: { year: number; gdp: number; co2: number }[];
    co2PerGdp: { year: number; value: number }[];
    baseYear: number;
  }>;
  DualYLineChart: React.ComponentType<{
    leftData: { year: number; value: number }[];
    rightData: { year: number; value: number }[];
    leftColor: string;
    rightColor: string;
    leftUnit: string;
    rightUnit: string;
  }>;
}

export function EconomySection({
  countryName,
  gdpVsCo2,
  cumulativeCo2,
  shareCumulative,
  tempGhg,
  tempCo2,
  tempCh4,
  tempN2o,
  totalGhgLatest,
  ghgPerCapitaLatest,
  co2PerGdpSeries,
  methaneSeries,
  n2oSeries,
  decouplingScore,
  decouplingEntry,
  accelRank,
  IndexedTripleLineChart,
  DualYLineChart,
}: EconomySectionProps) {
  // ── Derived: Temperature contribution stack bar ─────────────────────────────
  const tempTotal = (tempCo2 ?? 0) + (tempCh4 ?? 0) + (tempN2o ?? 0);
  const tempBar = tempTotal > 0 ? [
    { label: 'CO\u2082', value: tempCo2 ?? 0, color: '#EF4444' },
    { label: 'CH\u2084', value: tempCh4 ?? 0, color: '#F59E0B' },
    { label: 'N\u2082O', value: tempN2o ?? 0, color: '#8B5CF6' },
  ] : [];

  return (
    <>
      <SectionHeader
        category="economy"
        title="Economic Decoupling"
        subtitle="Is GDP growth decoupled from emissions growth?"
      />

      {/* GDP vs CO₂ Triple Line */}
      {gdpVsCo2.length > 0 && (
        <StoryBlock
          layout="text-right"
          insight={
            <InsightPanel tag="Decoupling Score" tagColor="text-blue-600">
              <p>
                {decouplingScore != null ? (
                  <>Score: <strong className="text-emerald-600">{signed(decouplingScore)}</strong>.</>
                ) : (
                  <>GDP and CO₂ trends reveal the decoupling trajectory.</>
                )}
                {decouplingEntry && (
                  <> {countryName} shows <strong>{decouplingEntry.interpretation.toLowerCase()}</strong>. GDP grew faster than emissions by <strong>{signed(decouplingEntry.avg_decoupling_2015_2023)}pp/yr</strong> since 2015 ({ordinal(decouplingEntry.rank)} among tracked countries).</>
                )}
              </p>
            </InsightPanel>
          }
        >
          <ChartCard
            category="economy"
            title="GDP vs CO₂ Growth"
            badge="Decoupling"
            subtitle={`Indexed to ${gdpVsCo2[0]?.year ?? 2000}=100`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#00A67E]" />
                <span className="text-slate-500">GDP per capita</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#E5484D]" />
                <span className="text-slate-500">CO₂ per capita</span>
              </span>
              {co2PerGdpSeries.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
                  <span className="text-slate-500">Carbon Intensity of GDP</span>
                </span>
              )}
            </div>
            <SafeChart name="GDP vs CO₂">
              <IndexedTripleLineChart
                gdpCo2={gdpVsCo2}
                co2PerGdp={co2PerGdpSeries}
                baseYear={gdpVsCo2[0]?.year ?? 2000}
              />
            </SafeChart>
            <SourceLabel>Source: World Bank WDI{co2PerGdpSeries.length > 0 ? ' + OWID CO₂/GDP' : ''}</SourceLabel>
          </ChartCard>
        </StoryBlock>
      )}

      {/* Historical Responsibility Metrics */}
      {(cumulativeCo2 != null || shareCumulative != null || tempGhg != null) && (
        <StoryBlock layout="full" delay={0.05}>
          <MetricRow
            metrics={[
              { value: cumulativeCo2 != null ? `${(cumulativeCo2 / 1000).toFixed(1)} Gt` : '\u2014', label: 'Cumulative CO₂', sub: 'Total since 1850' },
              { value: shareCumulative != null ? `${shareCumulative.toFixed(2)}%` : '\u2014', label: 'Share of global', sub: 'Cumulative share since 1850' },
              { value: tempGhg != null ? `${tempGhg.toFixed(3)}\u00B0C` : '\u2014', label: 'Warming caused', sub: 'by this country' },
            ]}
          />
        </StoryBlock>
      )}

      {/* Temperature Contribution by Gas */}
      {tempBar.length > 0 && (
        <StoryBlock
          layout="text-left"
          delay={0.05}
          insight={
            <InsightPanel tag="Gas Breakdown" tagColor="text-amber-600">
              <p>
                CO₂ dominates the warming contribution, followed by methane. N₂O contribution is relatively small.
                {tempGhg != null && ` Total warming contribution: ${tempGhg.toFixed(3)}°C.`}
              </p>
            </InsightPanel>
          }
        >
          <ChartCard
            category="energy"
            title="Temperature Contribution by Gas"
            subtitle="Source: Our World in Data"
          >
            <div className="space-y-3">
              {tempBar.map(g => (
                <div key={g.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: g.color }} />
                      <span className="text-slate-500">{g.label}</span>
                    </span>
                    <span className="font-mono font-medium text-slate-700">{g.value.toFixed(3)}°C ({tempTotal > 0 ? ((g.value / tempTotal) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="h-4 rounded-full bg-slate-100">
                    <div className="h-4 rounded-full" style={{ width: `${tempTotal > 0 ? (g.value / tempTotal) * 100 : 0}%`, backgroundColor: g.color, opacity: 0.85 }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </StoryBlock>
      )}

      {/* GHG Stats */}
      {(totalGhgLatest != null || ghgPerCapitaLatest != null) && (
        <StoryBlock layout="full" delay={0.05}>
          <MetricRow
            metrics={[
              ...(totalGhgLatest != null ? [{
                value: totalGhgLatest >= 1000 ? `${(totalGhgLatest / 1000).toFixed(2)} Gt` : `${totalGhgLatest.toFixed(1)} Mt`,
                label: 'Total GHG',
                sub: 'All greenhouse gases',
              }] : []),
              ...(ghgPerCapitaLatest != null ? [{
                value: `${ghgPerCapitaLatest.toFixed(1)}`,
                label: 'tCO₂e/capita',
                sub: 'Total GHG per person',
              }] : []),
              ...(accelRank != null ? [{
                value: ordinal(accelRank),
                label: 'Global rank',
                sub: 'Largest deceleration',
              }] : []),
            ]}
          />
        </StoryBlock>
      )}

      {/* Methane & N₂O */}
      {methaneSeries.length > 0 && n2oSeries.length > 0 && (
        <StoryBlock layout="full" delay={0.05}>
          <ChartCard
            category="energy"
            title="Methane & Nitrous Oxide"
            subtitle="Source: Our World in Data"
          >
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#F59E0B]" />
                <span className="text-slate-500">Methane (left axis)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-[#8B5CF6]" />
                <span className="text-slate-500">Nitrous Oxide (right axis)</span>
              </span>
            </div>
            <SafeChart name="Methane & N₂O">
              <DualYLineChart
                leftData={methaneSeries} rightData={n2oSeries}
                leftColor="#F59E0B" rightColor="#8B5CF6"
                leftUnit="CH₄ Mt" rightUnit="N₂O Mt"
              />
            </SafeChart>
          </ChartCard>
        </StoryBlock>
      )}
    </>
  );
}
