'use client';

import { LineChart } from '@/components/charts/LineChart';

interface HomeChartsProps {
  co2Data: { year: number; value: number }[];
}

export function HomeCharts({ co2Data }: HomeChartsProps) {
  return (
    <div className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
      <LineChart
        data={co2Data}
        title="CO₂ Trend — pilot country average"
        unit="metric tons per capita"
        color="#0066FF"
      />
    </div>
  );
}
