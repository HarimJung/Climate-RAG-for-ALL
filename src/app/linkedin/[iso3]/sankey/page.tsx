import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { SankeyCardClient } from './SankeyCardClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ iso3: string }>;
}

export default async function SankeyPage({ params }: Props) {
  const { iso3 } = await params;
  const upper = iso3.toUpperCase();

  const supabase = createServiceClient();

  // Fetch country name
  const { data: country } = await supabase
    .from('countries')
    .select('name')
    .eq('iso3', upper)
    .single();

  if (!country) notFound();

  // Fetch ember data
  const { data: rows } = await supabase
    .from('country_data')
    .select('indicator_code, year, value')
    .eq('country_iso3', upper)
    .in('indicator_code', ['EMBER.RENEWABLE.PCT', 'EMBER.FOSSIL.PCT'])
    .order('year', { ascending: false })
    .limit(10);

  if (!rows || rows.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <p className="text-lg text-[#4A4A6A]">No Ember energy data available for {country.name}.</p>
      </div>
    );
  }

  // Find latest year where both indicators exist
  const byYear: Record<number, { renewable?: number; fossil?: number }> = {};
  for (const r of rows) {
    if (r.value == null) continue;
    if (!byYear[r.year]) byYear[r.year] = {};
    if (r.indicator_code === 'EMBER.RENEWABLE.PCT') byYear[r.year].renewable = Number(r.value);
    if (r.indicator_code === 'EMBER.FOSSIL.PCT') byYear[r.year].fossil = Number(r.value);
  }

  const validYear = Object.entries(byYear)
    .filter(([, v]) => v.renewable != null && v.fossil != null)
    .sort(([a], [b]) => Number(b) - Number(a))[0];

  if (!validYear) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <p className="text-lg text-[#4A4A6A]">Incomplete Ember data for {country.name}.</p>
      </div>
    );
  }

  const year = Number(validYear[0]);
  const renewable = validYear[1].renewable!;
  const fossil = validYear[1].fossil!;
  const nuclear = Math.max(0, 100 - renewable - fossil);

  return (
    <SankeyCardClient
      countryName={country.name}
      iso3={upper}
      fossil={fossil}
      renewable={renewable}
      nuclear={nuclear}
      year={year}
    />
  );
}
