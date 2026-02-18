'use client';

import { useState } from 'react';
import { IndicatorSelector } from '@/components/IndicatorSelector';
import { CLIMATE_INDICATORS, CHART_COLORS } from '@/lib/constants';

const COUNTRY_NAMES: Record<string, string> = {
  KOR: 'South Korea', USA: 'United States', DEU: 'Germany',
  BRA: 'Brazil', NGA: 'Nigeria', BGD: 'Bangladesh',
};

interface DashboardClientProps {
  indicatorData: Record<string, { iso3: string; name: string; value: number; year: number }[]>;
  lastUpdated: string;
}

interface CompRow {
  label: string;
  value: number;
  color: string;
  href?: string;
}

/** Ranked comparison list — no bar chart, just ranked values */
function ComparisonList({ data, unit }: { data: CompRow[]; unit: string }) {
  if (data.length === 0) return <p className="py-8 text-center text-sm text-[--text-muted]">No data available</p>;

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const max = sorted[0].value;

  return (
    <div className="space-y-2.5">
      {sorted.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-right font-mono text-xs text-[--text-muted]">{i + 1}</span>
          <a
            href={d.href ?? '#'}
            className="w-32 shrink-0 truncate text-sm font-medium text-[--text-primary] hover:text-[--accent-primary]"
          >
            {d.label}
          </a>
          <div className="flex-1 overflow-hidden rounded-full bg-[--bg-section]" style={{ height: '8px' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
          <span className="w-28 shrink-0 text-right font-mono text-sm text-[--text-primary]">
            {d.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="ml-1 text-xs text-[--text-muted]">{unit}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardClient({ indicatorData, lastUpdated }: DashboardClientProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<string>(CLIMATE_INDICATORS[0].code);

  const currentIndicator = CLIMATE_INDICATORS.find(i => i.code === selectedIndicator) || CLIMATE_INDICATORS[0];
  const currentData: CompRow[] = (indicatorData[selectedIndicator] || []).map((d, i) => ({
    label: COUNTRY_NAMES[d.iso3] || d.iso3,
    value: d.value,
    color: CHART_COLORS[i % CHART_COLORS.length],
    href: `/country/${d.iso3}`,
  }));

  return (
    <div className="space-y-12">
      {/* Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[--text-primary]">Climate Indicators</h2>
          <p className="mt-1 text-sm text-[--text-secondary]">
            Select an indicator to compare across 6 pilot countries
          </p>
        </div>
        <IndicatorSelector value={selectedIndicator} onChange={setSelectedIndicator} />
      </div>

      {/* Selected indicator comparison */}
      <div className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h3 className="mb-5 text-sm font-medium text-[--text-secondary]">
          {currentIndicator.name}
          <span className="ml-2 text-[--text-muted]">({currentIndicator.unit})</span>
        </h3>
        <ComparisonList data={currentData} unit={currentIndicator.unit} />
      </div>

      {/* All indicators grid */}
      <div>
        <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">All Indicators at a Glance</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CLIMATE_INDICATORS.map((ind) => {
            const rows: CompRow[] = (indicatorData[ind.code] || []).map((d, i) => ({
              label: COUNTRY_NAMES[d.iso3] || d.iso3,
              value: d.value,
              color: CHART_COLORS[i % CHART_COLORS.length],
              href: `/country/${d.iso3}`,
            }));
            return (
              <div key={ind.code} className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="mb-4 text-sm font-medium text-[--text-secondary]">{ind.name}</h3>
                <ComparisonList data={rows} unit={ind.unit} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-sm text-[--text-muted]">
        Source: World Bank, Climate Watch, Ember, ND-GAIN. Last updated: {lastUpdated}
      </div>
    </div>
  );
}
