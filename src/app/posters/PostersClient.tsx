'use client';

import dynamic from 'next/dynamic';

const ClimateSankey = dynamic(
  () => import('@/components/charts/ClimateSankey').then(m => ({ default: m.ClimateSankey })),
  { ssr: false, loading: () => <div className="aspect-[2/1] animate-pulse rounded-xl bg-[--bg-section]" /> }
);

const ClimateGap = dynamic(
  () => import('@/components/charts/ClimateGap').then(m => ({ default: m.ClimateGap })),
  { ssr: false, loading: () => <div className="aspect-[3/2] animate-pulse rounded-xl bg-[--bg-section]" /> }
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
  energyMix: { source: string; value: number; type: string }[];
  totalCO2: number;
}

// Hardcoded energy mix (fossil, renewable, nuclear %) — Ember 2023
const ENERGY_MIX: Record<string, { fossil: number; renewable: number; nuclear: number }> = {
  KOR: { fossil: 61.2, renewable:  9.6, nuclear: 29.2 },
  USA: { fossil: 59.1, renewable: 22.7, nuclear: 18.2 },
  DEU: { fossil: 44.2, renewable: 54.4, nuclear:  1.4 },
  BRA: { fossil:  9.0, renewable: 89.0, nuclear:  2.0 },
  NGA: { fossil: 77.1, renewable: 22.9, nuclear:  0.0 },
  BGD: { fossil: 98.4, renewable:  1.6, nuclear:  0.0 },
};

interface PostersClientProps {
  countriesData: CountryPosterData[];
}

export function PostersClient({ countriesData }: PostersClientProps) {
  return (
    <div className="space-y-16">
      {/* Pre-Paris vs Post-Paris slope chart — all 6 countries */}
      <div className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">All 6 Countries</h3>
        <ClimateGap />
      </div>

      {/* Per-country sections */}
      {countriesData.map((c) => {
        const mix = ENERGY_MIX[c.iso3] ?? { fossil: 0, renewable: 0, nuclear: 0 };
        return (
          <div key={c.iso3} className="space-y-6">
            <h3 className="text-lg font-semibold text-[--text-primary]">
              {c.flag} {c.name}
            </h3>
            <p className="text-sm text-[--text-secondary] italic">{c.hook}</p>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sankey */}
              <div className="rounded-xl border border-[--border-card] bg-white p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                <ClimateSankey
                  country={c.name}
                  fossil={mix.fossil}
                  renewable={mix.renewable}
                  nuclear={mix.nuclear}
                />
              </div>

              {/* Gap chart with this country highlighted */}
              <div className="rounded-xl border border-[--border-card] bg-white p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                <ClimateGap highlightIso3={c.iso3} />
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'CO\u2082 per capita', value: `${c.co2.toFixed(1)} t`, color: 'text-red-500' },
                { label: 'Renewable', value: `${mix.renewable.toFixed(1)}%`, color: 'text-emerald-600' },
                { label: 'Fossil', value: `${mix.fossil.toFixed(1)}%`, color: 'text-[--text-secondary]' },
                { label: 'PM2.5', value: `${c.pm25.toFixed(1)} \u00b5g/m\u00b3`, color: 'text-[--text-secondary]' },
              ].map(m => (
                <div key={m.label} className="rounded-lg border border-[--border-card] bg-white p-3"
                  style={{ boxShadow: 'var(--shadow-card)' }}>
                  <p className="text-xs text-[--text-muted]">{m.label}</p>
                  <p className={`mt-1 font-mono text-lg font-bold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
