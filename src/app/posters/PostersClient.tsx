'use client';

import dynamic from 'next/dynamic';
import type { EnergySource } from '@/components/charts/ClimateSankey';

const ClimatePoster = dynamic(
  () => import('@/components/charts/ClimatePoster').then(m => ({ default: m.ClimatePoster })),
  { ssr: false, loading: () => <div className="aspect-square animate-pulse rounded-xl bg-[--bg-section]" /> }
);
const ClimateGap = dynamic(
  () => import('@/components/charts/ClimateGap').then(m => ({ default: m.ClimateGap })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-[--bg-section]" /> }
);
const ClimateSankey = dynamic(
  () => import('@/components/charts/ClimateSankey').then(m => ({ default: m.ClimateSankey })),
  { ssr: false, loading: () => <div className="aspect-square animate-pulse rounded-xl bg-[--bg-section]" /> }
);

interface CountryPosterData {
  iso3: string;
  name: string;
  flag: string;
  hook: string;
  co2: number;
  renewable: number;
  pm25: number;
  vulnerability: number;
  stripesData: { year: number; value: number }[];
  energyMix: EnergySource[];
  totalCO2: number;
}

interface PostersClientProps {
  countriesData: CountryPosterData[];
}

export function PostersClient({ countriesData }: PostersClientProps) {
  return (
    <div className="space-y-16">
      {/* Slope chart — all countries */}
      <div className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <ClimateGap />
      </div>

      {/* Per-country posters */}
      {countriesData.map((c) => (
        <div key={c.iso3} className="space-y-6">
          <h3 className="text-lg font-semibold text-[--text-primary]">
            {c.flag} {c.name}
          </h3>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Poster */}
            <div className="rounded-xl border border-[--border-card] bg-white p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <ClimatePoster
                country={c.name}
                iso3={c.iso3}
                flag={c.flag}
                hook={c.hook}
                co2={c.co2}
                renewable={c.renewable}
                pm25={c.pm25}
                vulnerability={c.vulnerability}
                stripesData={c.stripesData}
              />
            </div>

            {/* Sankey */}
            <div className="rounded-xl border border-[--border-card] bg-white p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <ClimateSankey
                country={c.name}
                iso3={c.iso3}
                energyMix={c.energyMix}
                totalCO2={c.totalCO2}
              />
            </div>
          </div>

          {/* Gap for this country */}
          <div className="rounded-xl border border-[--border-card] bg-white p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <ClimateGap highlightIso3={c.iso3} />
          </div>
        </div>
      ))}
    </div>
  );
}
