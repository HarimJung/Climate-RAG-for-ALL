'use client';

import { createClient } from '@/lib/supabase/client';
import { iso3ToFlag } from '@/lib/iso3ToFlag';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CountryMeta { iso3: string; name: string; adj: string; flag: string }
export interface Metrics { fossil: number; renewable: number; nuclear: number; co2: number; pm25: number }

// ── Country registry ──────────────────────────────────────────────────────────
export const COUNTRIES: CountryMeta[] = [
  { iso3: 'KOR', name: 'South Korea',   adj: 'Korean',        flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  { iso3: 'USA', name: 'United States', adj: 'American',      flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { iso3: 'DEU', name: 'Germany',       adj: 'German',        flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { iso3: 'BRA', name: 'Brazil',        adj: 'Brazilian',     flag: '\uD83C\uDDE7\uD83C\uDDF7' },
  { iso3: 'NGA', name: 'Nigeria',       adj: 'Nigerian',      flag: '\uD83C\uDDF3\uD83C\uDDEC' },
  { iso3: 'BGD', name: 'Bangladesh',    adj: 'Bangladeshi',   flag: '\uD83C\uDDE7\uD83C\uDDE9' },
  { iso3: 'CHN', name: 'China',         adj: 'Chinese',       flag: '\uD83C\uDDE8\uD83C\uDDF3' },
  { iso3: 'IND', name: 'India',         adj: 'Indian',        flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { iso3: 'JPN', name: 'Japan',         adj: 'Japanese',      flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  { iso3: 'GBR', name: 'United Kingdom',adj: 'British',       flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { iso3: 'FRA', name: 'France',        adj: 'French',        flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { iso3: 'CAN', name: 'Canada',        adj: 'Canadian',      flag: '\uD83C\uDDE8\uD83C\uDDE6' },
  { iso3: 'AUS', name: 'Australia',     adj: 'Australian',    flag: '\uD83C\uDDE6\uD83C\uDDFA' },
  { iso3: 'IDN', name: 'Indonesia',     adj: 'Indonesian',    flag: '\uD83C\uDDEE\uD83C\uDDE9' },
  { iso3: 'SAU', name: 'Saudi Arabia',  adj: 'Saudi',         flag: '\uD83C\uDDF8\uD83C\uDDE6' },
  { iso3: 'ZAF', name: 'South Africa',  adj: 'South African', flag: '\uD83C\uDDFF\uD83C\uDDE6' },
  { iso3: 'MEX', name: 'Mexico',        adj: 'Mexican',       flag: '\uD83C\uDDF2\uD83C\uDDFD' },
  { iso3: 'RUS', name: 'Russia',        adj: 'Russian',       flag: '\uD83C\uDDF7\uD83C\uDDFA' },
  { iso3: 'TUR', name: 'Turkey',        adj: 'Turkish',       flag: '\uD83C\uDDF9\uD83C\uDDF7' },
  { iso3: 'EGY', name: 'Egypt',         adj: 'Egyptian',      flag: '\uD83C\uDDEA\uD83C\uDDEC' },
];

// ── Hardcoded fallback for 6 pilot countries ──────────────────────────────────
export const PILOT_DATA: Record<string, Metrics> = {
  KOR: { fossil: 61.2, renewable:  9.6, nuclear: 29.2, co2: 11.4, pm25: 25.9 },
  USA: { fossil: 59.1, renewable: 22.7, nuclear: 18.2, co2: 13.7, pm25:  7.8 },
  DEU: { fossil: 44.2, renewable: 54.4, nuclear:  1.4, co2:  7.1, pm25: 10.3 },
  BRA: { fossil:  9.0, renewable: 89.0, nuclear:  2.0, co2:  2.3, pm25: 12.2 },
  NGA: { fossil: 77.1, renewable: 22.9, nuclear:  0.0, co2:  0.6, pm25: 56.5 },
  BGD: { fossil: 98.4, renewable:  1.6, nuclear:  0.0, co2:  0.7, pm25: 42.4 },
};

// ── Supabase fetchers ─────────────────────────────────────────────────────────
export async function fetchMetrics(iso3: string): Promise<Metrics | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('country_data')
    .select('indicator_code, year, value')
    .eq('country_iso3', iso3)
    .in('indicator_code', ['EMBER.FOSSIL.PCT', 'EMBER.RENEWABLE.PCT', 'EN.GHG.CO2.PC.CE.AR5', 'EN.ATM.PM25.MC.M3'])
    .order('year', { ascending: false });
  if (!data || data.length === 0) return null;
  const latest = (code: string) => {
    const row = data.find(r => r.indicator_code === code && r.value != null);
    return row ? Number(row.value) : 0;
  };
  const fossil    = latest('EMBER.FOSSIL.PCT');
  const renewable = latest('EMBER.RENEWABLE.PCT');
  return {
    fossil, renewable,
    nuclear: Math.max(0, Math.round((100 - fossil - renewable) * 10) / 10),
    co2:     latest('EN.GHG.CO2.PC.CE.AR5'),
    pm25:    latest('EN.ATM.PM25.MC.M3'),
  };
}

export async function fetchAllRenewable(): Promise<{ iso3: string; name: string; flag: string; renewable: number }[]> {
  const supabase = createClient();
  const [{ data: renData }, { data: cntData }] = await Promise.all([
    supabase
      .from('country_data')
      .select('country_iso3, year, value')
      .eq('indicator_code', 'EMBER.RENEWABLE.PCT')
      .order('year', { ascending: false }),
    supabase.from('countries').select('iso3, name'),
  ]);
  const nameMap = new Map<string, string>((cntData ?? []).map((c: { iso3: string; name: string }) => [c.iso3, c.name]));
  const seen = new Map<string, number>();
  for (const row of (renData ?? [])) {
    if (!seen.has(row.country_iso3) && row.value != null) seen.set(row.country_iso3, Number(row.value));
  }
  return Array.from(seen.entries()).map(([iso3, renewable]) => {
    const seed = COUNTRIES.find(c => c.iso3 === iso3);
    return {
      iso3,
      name: seed?.name ?? nameMap.get(iso3) ?? iso3,
      flag: seed?.flag ?? iso3ToFlag(iso3),
      renewable,
    };
  }).sort((a, b) => b.renewable - a.renewable);
}

export async function fetchCountriesFromDB(): Promise<CountryMeta[]> {
  const supabase = createClient();
  const [{ data: renData }, { data: cntData }] = await Promise.all([
    supabase
      .from('country_data')
      .select('country_iso3')
      .eq('indicator_code', 'EMBER.RENEWABLE.PCT'),
    supabase.from('countries').select('iso3, name'),
  ]);
  const nameMap = new Map<string, string>((cntData ?? []).map((c: { iso3: string; name: string }) => [c.iso3, c.name]));
  const isos = [...new Set((renData ?? []).map((r: { country_iso3: string }) => r.country_iso3))];
  return isos
    .map(iso3 => {
      const seed = COUNTRIES.find(c => c.iso3 === iso3);
      return seed ?? { iso3, name: nameMap.get(iso3) ?? iso3, adj: nameMap.get(iso3) ?? iso3, flag: iso3ToFlag(iso3) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
