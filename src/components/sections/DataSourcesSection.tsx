'use client';

import React from 'react';
import {
  ScrollFadeIn,
  SummaryFan,
} from '@/components/climate';
import { signed } from '@/components/sections/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DataSourcesSectionProps {
  countryName: string;
  latestCo2: number | null;
  parisData: {
    post_paris_cagr_pct: number;
  } | null;
  emberMix: { renewable: number; fossil: number; other: number; year: number; source: string } | null;
  decouplingScore: number | null;
  myScatter: { iso3: string; name: string; vulnerability: number; readiness: number } | null;
  riskProfile: {
    risk_level: string;
  } | null;
}

export function DataSourcesSection({
  countryName,
  latestCo2,
  parisData,
  emberMix,
  decouplingScore,
  myScatter,
  riskProfile,
}: DataSourcesSectionProps) {
  return (
    <>
      {/* ═══════════════════════════════════════ KEY TAKEAWAYS ═══════════════════════════════════════ */}
      <SummaryFan
        title="Key Takeaways"
        subtitle={`${countryName} at a glance`}
        cards={[
          {
            title: 'Emissions',
            content: (
              <p>
                {`CO₂/capita: ${latestCo2 != null ? latestCo2.toFixed(1) + 't' : '\u2014'}. ${parisData ? `Post-Paris trend: ${signed(parisData.post_paris_cagr_pct)}%/yr.` : 'Emissions trajectory under review.'}`}
              </p>
            ),
            bgClass: 'bg-emerald-600',
            textClass: 'text-white',
          },
          {
            title: 'Diagnosis',
            content: (
              <div className="space-y-1.5">
                <p>{emberMix ? `Renewable: ${emberMix.renewable.toFixed(1)}%` : 'Energy data pending.'}</p>
                <p>{emberMix ? `Fossil: ${emberMix.fossil.toFixed(1)}%` : ''}</p>
                <p>{decouplingScore != null ? `Decoupling: ${signed(decouplingScore)}.` : ''}</p>
              </div>
            ),
            bgClass: 'bg-blue-700',
            textClass: 'text-white',
          },
          {
            title: 'Outlook',
            content: (
              <p>
                {`${myScatter ? `Vulnerability: ${myScatter.vulnerability.toFixed(3)}. Readiness: ${myScatter.readiness.toFixed(3)}.` : 'Vulnerability data pending.'} ${riskProfile ? `${riskProfile.risk_level} risk.` : ''}`}
              </p>
            ),
            bgClass: 'bg-amber-500',
            textClass: 'text-white',
          },
        ]}
      />

      {/* ═══════════════════════════════════════ DATA SOURCES ═══════════════════════════════════════ */}
      <ScrollFadeIn className="mt-16" scale>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Data Sources</h3>
          <p className="mb-5 text-xs text-slate-400">
            All data for {countryName} sourced from World Bank WDI, Ember, ND-GAIN, Our World in Data, and Climate TRACE (2000-2023).
          </p>

          <div className="mb-6 flex flex-wrap gap-4">
            <button className="rounded-lg bg-[#0066FF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0052CC]">
              Download as PNG
            </button>
            <a
              href="/compare"
              className="inline-block rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Compare with other countries
            </a>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-[#0066FF]">
              View detailed source list
            </summary>
            <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">WDI</span>
                <span>World Bank World Development Indicators -- CO₂/capita (EN.GHG.CO2.PC.CE.AR5), GDP/capita, forest area, energy use, PM2.5</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">Ember</span>
                <span>Ember Global Electricity Review -- Renewable %, fossil %, carbon intensity (gCO₂/kWh)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">ND-GAIN</span>
                <span>Notre Dame Global Adaptation Initiative -- Vulnerability index, readiness index</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">OWID</span>
                <span>Our World in Data -- Consumption CO₂, fuel breakdown, cumulative CO₂, temperature contribution, methane, N₂O, total GHG</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">CTRACE</span>
                <span>Climate TRACE v7 -- Satellite-based sector emissions (power, transport, manufacturing, agriculture, etc.)</span>
              </div>
            </div>
          </details>
        </div>
      </ScrollFadeIn>

      {/* Footer CTA */}
      <ScrollFadeIn className="mt-12 flex justify-center" scale>
        <a
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:shadow-md"
        >
          View all countries
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="transition-transform group-hover:translate-x-1"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </ScrollFadeIn>
    </>
  );
}
