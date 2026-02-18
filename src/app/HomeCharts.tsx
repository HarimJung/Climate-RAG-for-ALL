'use client';

import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';

interface HomeChartsProps {
  co2Data: { year: number; value: number }[];
  countryBar: { label: string; value: number; color: string; href: string }[];
}

export function HomeCharts({ co2Data, countryBar }: HomeChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <LineChart
          data={co2Data}
          title="Global CO2 Trend (pilot avg)"
          unit="metric tons per capita"
          color="#0066FF"
        />
      </div>
      <div className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <BarChart
          data={countryBar}
          title="CO2 per Capita by Country (latest)"
          unit="metric tons"
        />
      </div>
    </div>
  );
}
