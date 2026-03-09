'use client';

import { useRouter } from 'next/navigation';
import { WorldScoreboard, type CountryClass } from '@/components/charts/WorldScoreboard';

export function HomeMap({ countries, width, height }: { countries: CountryClass[]; width: number; height: number }) {
  const router = useRouter();
  return (
    <div className="overflow-hidden rounded-xl border border-[--border-card]" style={{ boxShadow: 'var(--shadow-card)' }}>
      <WorldScoreboard
        countries={countries}
        width={width}
        height={height}
        onCountryClick={(iso3) => router.push(`/report/${iso3}`)}
      />
    </div>
  );
}
