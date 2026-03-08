'use client';

import React from 'react';
import {
  SectionHeader,
  StoryBlock,
  ChartCard,
} from '@/components/climate';
import { ClimateSankey } from '@/components/charts/ClimateSankey';
import { SafeChart, InsightPanel, MetricRow, ordinal } from '@/components/sections/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EnergySectionProps {
  countryName: string;
  emberMix: { renewable: number; fossil: number; other: number; year: number; source: string };
  renewableChange: number | null;
  carbonIntensity: number | null;
  transitionEntry: { rank: number; country: string } | null;
}

export function EnergySection({
  countryName,
  emberMix,
  renewableChange,
  carbonIntensity,
  transitionEntry,
}: EnergySectionProps) {
  return (
    <>
      <SectionHeader
        category="energy"
        title="Energy Transition"
        subtitle="The energy transition is underway."
      />

      <StoryBlock
        layout="text-right"
        insight={
          <InsightPanel tag="Renewables Progress" tagColor="text-amber-600">
            <p>
              <strong className="text-emerald-600">{emberMix.renewable.toFixed(1)}%</strong> of electricity
              comes from renewables.
              {renewableChange != null && (
                <> That is <strong className={renewableChange > 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {renewableChange > 0 ? '+' : ''}{renewableChange.toFixed(1)}pp
                </strong> over 5 years.</>
              )}
              {' '}Fossil fuels still make up <strong>{emberMix.fossil.toFixed(1)}%</strong>.
            </p>
            <p className="mt-3">
              {carbonIntensity != null ? (
                <>Carbon intensity: <strong className={carbonIntensity < 100 ? 'text-emerald-600' : carbonIntensity < 300 ? 'text-amber-600' : 'text-red-600'}>{carbonIntensity.toFixed(0)} gCO₂/kWh</strong>.</>
              ) : (
                <>Nuclear and other sources make up <strong>{emberMix.other.toFixed(1)}%</strong> of the mix.</>
              )}
              {transitionEntry && ` Renewable transition ranks ${ordinal(transitionEntry.rank)}.`}
            </p>
          </InsightPanel>
        }
      >
        <ChartCard
          category="energy"
          title={`Electricity Generation Mix (${emberMix.year})`}
          subtitle={`Source: Ember Global Electricity Review (${emberMix.year})`}
        >
          <SafeChart name="Sankey">
            <ClimateSankey
              country={countryName}
              fossil={emberMix.fossil}
              renewable={emberMix.renewable}
              nuclear={emberMix.other}
            />
          </SafeChart>
        </ChartCard>
      </StoryBlock>

      {/* Energy stat metrics */}
      <StoryBlock layout="full" delay={0.05}>
        <MetricRow
          metrics={[
            { value: `${emberMix.renewable.toFixed(1)}%`, label: 'Renewable Share', sub: renewableChange != null ? `${renewableChange > 0 ? '+' : ''}${renewableChange.toFixed(1)}pp over 5yr` : undefined },
            { value: `${emberMix.fossil.toFixed(1)}%`, label: 'Fossil Fuel Share' },
            { value: `${emberMix.other.toFixed(1)}%`, label: 'Nuclear & Other' },
            ...(carbonIntensity != null ? [{ value: `${carbonIntensity.toFixed(0)}`, label: 'gCO₂/kWh', sub: carbonIntensity < 100 ? 'Low-carbon' : carbonIntensity < 300 ? 'Moderate' : 'High-carbon' }] : []),
          ]}
        />
      </StoryBlock>
    </>
  );
}
