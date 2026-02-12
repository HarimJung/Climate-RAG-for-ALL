'use client';

import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';

interface CountryClientProps {
  co2Series: { year: number; value: number }[];
  countryName: string;
  renewablePercent: number | null;
  forestPercent: number | null;
}

export function CountryClient({ co2Series, countryName, renewablePercent, forestPercent }: CountryClientProps) {
  const energyMix = renewablePercent != null
    ? [
        { label: 'Renewable', value: renewablePercent, color: '#22c55e' },
        { label: 'Non-renewable', value: Math.max(0, 100 - renewablePercent), color: '#64748b' },
      ]
    : [];

  const landUse = forestPercent != null
    ? [
        { label: 'Forest', value: forestPercent, color: '#22c55e' },
        { label: 'Other land', value: Math.max(0, 100 - forestPercent), color: '#64748b' },
      ]
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* CO2 Line Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <LineChart
          data={co2Series}
          title={`${countryName} — CO2 per capita (2000\u20132023)`}
          unit="metric tons"
          color="#34d399"
        />
      </div>

      {/* Energy Mix Donut */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <DonutChart data={energyMix} title="Energy Mix" />
      </div>

      {/* Land Use Donut */}
      {landUse.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <DonutChart data={landUse} title="Land Cover" />
        </div>
      )}
    </div>
  );
}
