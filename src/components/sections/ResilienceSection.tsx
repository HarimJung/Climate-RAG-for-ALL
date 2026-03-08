'use client';

import React from 'react';
import {
  SectionHeader,
  StoryBlock,
  ChartCard,
  ScrollFadeIn,
} from '@/components/climate';
import { KayaWaterfall } from '@/components/charts/KayaWaterfall';
import { EquityScatter } from '@/components/charts/EquityScatter';
import { SafeChart, InsightPanel, ordinal } from '@/components/sections/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResilienceSectionProps {
  countryName: string;
  iso3: string;
  scatterData: { iso3: string; name: string; vulnerability: number; readiness: number }[];
  myScatter: { iso3: string; name: string; vulnerability: number; readiness: number } | null;
  readinessRank: number | null;
  riskProfile: {
    risk_level: string;
    summary: string;
    key_vulnerabilities: string[];
    strengths: string[];
  } | null;
  emberMix: { renewable: number; fossil: number; other: number; year: number; source: string } | null;
  showKaya: boolean;
  showEquity: boolean;
  // Chart component passed as render prop
  VulnerabilityScatter: React.ComponentType<{
    data: { iso3: string; name: string; vulnerability: number; readiness: number }[];
    highlightIso3: string;
  }>;
}

export function ResilienceSection({
  countryName,
  iso3,
  scatterData,
  myScatter,
  readinessRank,
  riskProfile,
  emberMix,
  showKaya,
  showEquity,
  VulnerabilityScatter,
}: ResilienceSectionProps) {
  return (
    <>
      {/* ═══════════════════════════════════════ VULNERABILITY ═══════════════════════════════════════ */}
      <SectionHeader
        category="vulnerability"
        title="Climate Vulnerability & Resilience"
        subtitle={`How prepared is ${countryName}?`}
      />

      {/* Kaya Waterfall */}
      {showKaya && (
        <StoryBlock layout="full">
          <ChartCard
            category="vulnerability"
            title={`Why Did Emissions Change? \u2014 ${countryName} LMDI Factor Decomposition`}
            subtitle="Source: World Bank WDI + Ember + OWID (Kaya Identity)"
          >
            <SafeChart name="Kaya Waterfall">
              <KayaWaterfall iso3={iso3} />
            </SafeChart>
          </ChartCard>
        </StoryBlock>
      )}

      {/* Vulnerability Scatter */}
      <StoryBlock
        layout="text-left"
        insight={
          <InsightPanel tag="Readiness & Vulnerability" tagColor="text-rose-600">
            <p>
              {myScatter ? (
                <>
                  <strong>{countryName} ranks {ordinal(readinessRank!)} in climate readiness</strong> (score: {myScatter.readiness.toFixed(3)}).{' '}
                  Vulnerability stands at <strong>{myScatter.vulnerability.toFixed(3)}</strong> &mdash;{' '}
                  {myScatter.vulnerability < 0.35
                    ? 'indicating relatively stronger resilience.'
                    : myScatter.vulnerability < 0.45
                      ? 'indicating moderate climate exposure.'
                      : 'reflecting significant climate exposure.'}
                </>
              ) : (
                <>{countryName}&apos;s vulnerability and readiness data is being updated.</>
              )}
            </p>
            {riskProfile && (
              <p className="mt-3">
                <strong>{riskProfile.risk_level} risk.</strong> {riskProfile.summary}
                {emberMix && ` Fossil fuel dependency (${emberMix.fossil.toFixed(1)}%) remains a key driver.`}
              </p>
            )}
          </InsightPanel>
        }
      >
        <ChartCard
          category="vulnerability"
          title="Vulnerability vs Readiness"
          subtitle="Source: ND-GAIN Country Index 2023"
        >
          {scatterData.length > 0 ? (
            <SafeChart name="Vulnerability Scatter">
              <VulnerabilityScatter data={scatterData} highlightIso3={iso3} />
            </SafeChart>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg bg-slate-50">
              <p className="text-sm text-slate-400">Data not available</p>
            </div>
          )}
        </ChartCard>
      </StoryBlock>

      {/* Climate Equity */}
      {showEquity && (
        <StoryBlock layout="full" delay={0.05}>
          <ChartCard
            category="vulnerability"
            title="Climate Equity: Who Polluted vs Who Suffers"
            subtitle="Source: OWID Cumulative CO₂ + ND-GAIN Vulnerability"
          >
            <SafeChart name="Equity Scatter">
              <EquityScatter highlightIso3={iso3} />
            </SafeChart>
          </ChartCard>
        </StoryBlock>
      )}

      {/* Risk Profile cards */}
      {riskProfile && (
        <StoryBlock layout="full" delay={0.05}>
          <div className="grid gap-4 md:grid-cols-2">
            <ScrollFadeIn delay={0} direction="left">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Key Vulnerabilities</h3>
                <ul className="space-y-2">
                  {riskProfile.key_vulnerabilities.map((v: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 shrink-0 text-red-500">&#x25B8;</span>{v}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn delay={0.1} direction="right">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Strengths</h3>
                <ul className="space-y-2">
                  {riskProfile.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 shrink-0 text-emerald-500">&#x25B8;</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollFadeIn>
          </div>
        </StoryBlock>
      )}
    </>
  );
}
