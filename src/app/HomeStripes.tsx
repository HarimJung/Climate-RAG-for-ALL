'use client';

import dynamic from 'next/dynamic';
import type { CountryStripeData } from '@/components/charts/ClimateStripes';

const ClimateStripes = dynamic(
  () => import('@/components/charts/ClimateStripes').then(m => ({ default: m.ClimateStripes })),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-xl bg-[--bg-section]" /> }
);

interface HomeStripesProps {
  allData: CountryStripeData[];
}

export function HomeStripes({ allData }: HomeStripesProps) {
  if (allData.every(d => d.data.length === 0)) return null;
  return (
    <ClimateStripes
      mode="stacked"
      allData={allData}
      indicator="CO₂ per capita · 2000–2023 · Source: World Bank WDI"
    />
  );
}
