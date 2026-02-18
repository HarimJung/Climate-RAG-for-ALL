'use client';

// D3 poster components disabled — re-enable after SSR fix
// import dynamic from 'next/dynamic';
// import type { EnergySource } from '@/components/charts/ClimateSankey';
// const ClimatePoster = dynamic(() => import('@/components/charts/ClimatePoster').then(m => ({ default: m.ClimatePoster })), { ssr: false });
// const ClimateGap = dynamic(() => import('@/components/charts/ClimateGap').then(m => ({ default: m.ClimateGap })), { ssr: false });
// const ClimateSankey = dynamic(() => import('@/components/charts/ClimateSankey').then(m => ({ default: m.ClimateSankey })), { ssr: false });

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
  energyMix: { source: string; value: number; type: string }[];
  totalCO2: number;
}

interface PostersClientProps {
  countriesData: CountryPosterData[];
}

export function PostersClient({ countriesData }: PostersClientProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-[--text-secondary]">
        Poster charts are temporarily disabled while we resolve a rendering issue. Check back soon.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {countriesData.map((c) => (
          <div
            key={c.iso3}
            className="rounded-xl border border-[--border-card] bg-white p-5"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <p className="text-lg font-semibold text-[--text-primary]">{c.flag} {c.name}</p>
            <div className="mt-3 space-y-1 text-sm text-[--text-secondary]">
              <p>CO₂: <span className="font-mono font-semibold text-[--text-primary]">{c.co2.toFixed(1)} t</span></p>
              <p>Renewable: <span className="font-mono font-semibold text-[--accent-positive]">{c.renewable.toFixed(1)}%</span></p>
              <p className="text-xs text-[--text-muted] italic">{c.hook}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
