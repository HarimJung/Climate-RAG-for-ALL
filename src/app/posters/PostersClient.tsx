'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LayoutGroup } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { iso3ToFlag } from '@/lib/iso3ToFlag';
import { ClimateGap } from '@/components/charts/ClimateGap';
import { WorldScoreboard, type CountryClass } from '@/components/charts/WorldScoreboard';

import { PosterHeroSection } from '@/components/posters/hero-section';
import { BentoSection, type BentoPoster } from '@/components/posters/bento-section';
import { Toolbar, type ViewMode, type FilterType } from '@/components/posters/toolbar';
import { PosterExplorer, type PosterType, POSTER_DEFS } from '@/components/posters/poster-explorer';
import { PosterLightbox } from '@/components/posters/poster-lightbox';

// ── Country registry ──────────────────────────────────────────────────────────
const COUNTRIES = [
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

interface CountryMeta { iso3: string; name: string; adj: string; flag: string }
interface Metrics { fossil: number; renewable: number; nuclear: number; co2: number; pm25: number }

// ── Hardcoded fallback for 6 pilot countries ──────────────────────────────────
const PILOT_DATA: Record<string, Metrics> = {
  KOR: { fossil: 61.2, renewable:  9.6, nuclear: 29.2, co2: 11.4, pm25: 25.9 },
  USA: { fossil: 59.1, renewable: 22.7, nuclear: 18.2, co2: 13.7, pm25:  7.8 },
  DEU: { fossil: 44.2, renewable: 54.4, nuclear:  1.4, co2:  7.1, pm25: 10.3 },
  BRA: { fossil:  9.0, renewable: 89.0, nuclear:  2.0, co2:  2.3, pm25: 12.2 },
  NGA: { fossil: 77.1, renewable: 22.9, nuclear:  0.0, co2:  0.6, pm25: 56.5 },
  BGD: { fossil: 98.4, renewable:  1.6, nuclear:  0.0, co2:  0.7, pm25: 42.4 },
};

// ── Per-country Energy Flow headlines ────────────────────────────────────────
const ENERGY_HEADLINES: Record<string, string> = {
  KOR: 'South Korea burns 61% fossil fuel. Only 9.6% is clean.',
  USA: 'America still runs on 59% fossil. But 22.7% is renewable now.',
  DEU: 'Germany crossed 50% renewable. The Energiewende works.',
  BRA: '89% of Brazil electricity is renewable. The greenest grid on Earth.',
  NGA: '77% fossil. Zero nuclear. Nigeria energy crisis.',
  BGD: '98.4% fossil. Bangladesh is almost entirely carbon-powered.',
  CHN: 'China: 35% renewable but still 65% fossil. The world watches.',
  IND: 'India runs on 78% fossil. 1.4 billion people, one energy challenge.',
  JPN: 'Japan: 70% fossil after Fukushima. Nuclear debate continues.',
  GBR: 'UK crossed 40% renewable. Island nation leading transition.',
  FRA: 'France: 70% nuclear. Lowest carbon grid in Europe.',
  CAN: 'Canada: 68% renewable. Hydropower nation.',
  AUS: 'Australia: 32% renewable. From coal country to solar frontier.',
};

function energyHeadline(iso3: string, fossil: number, renewable: number, name: string): string {
  if (ENERGY_HEADLINES[iso3]) return ENERGY_HEADLINES[iso3];
  return `${name}: ${fossil.toFixed(0)}% fossil, ${renewable.toFixed(0)}% renewable.`;
}

// ── Supabase fetchers ─────────────────────────────────────────────────────────
async function fetchMetrics(iso3: string): Promise<Metrics | null> {
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

async function fetchAllRenewable(): Promise<{ iso3: string; name: string; flag: string; renewable: number }[]> {
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

async function fetchCountriesFromDB(): Promise<CountryMeta[]> {
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

// ── Poster shell: 1:1 square ──────────────────────────────────────────────────
function PosterShell({ source, children }: { source: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid #E2E8F0', borderRadius: '16px',
      boxShadow: '0 4px 32px rgba(0,0,0,0.07)', padding: '36px',
      aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column',
      maxWidth: '560px', margin: '0 auto', overflow: 'hidden',
    }}>
      <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.05em', marginBottom: '14px' }}>
        visualclimate.org
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </div>
      <div style={{ fontSize: '11px', color: '#CBD5E1', fontFamily: 'Inter, system-ui, sans-serif', marginTop: '14px' }}>
        {source}
      </div>
      <div style={{
        height: '4px',
        marginTop: '12px',
        marginLeft: '-36px',
        marginRight: '-36px',
        marginBottom: '-36px',
        background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%)',
      }} />
    </div>
  );
}

// ── 1. Energy Flow ────────────────────────────────────────────────────────────

function MiniSankey({ fossil, renewable, nuclear }: { fossil: number; renewable: number; nuclear: number }) {
  const total = fossil + renewable + nuclear || 100;
  const f = fossil    / total * 100;
  const r = renewable / total * 100;
  const n = nuclear   / total * 100;

  const S = 1.9; const NW = 18; const LX = 58; const RX = 380;
  const GAP = 10; const TOP = 18;

  const fH = Math.max(f * S, 5);
  const rH = Math.max(r * S, 5);
  const nH = n > 0 ? Math.max(n * S, 5) : 0;
  const fY = TOP;
  const rY = fY + fH + GAP;
  const nY = n > 0 ? rY + rH + GAP : rY + rH;

  const rBY = TOP;
  const rBH = fH + rH + nH + (n > 0 ? GAP : 0) + GAP;
  const fRY = rBY; const rRY = fRY + fH; const nRY = rRY + rH;

  function bez(lx: number, ly1: number, ly2: number, rx: number, ry1: number, ry2: number) {
    const cx = (lx + rx) / 2;
    return `M${lx},${ly1} C${cx},${ly1} ${cx},${ry1} ${rx},${ry1} L${rx},${ry2} C${cx},${ry2} ${cx},${ly2} ${lx},${ly2} Z`;
  }

  const svgH = Math.max(nY + nH + TOP, rBH + 2 * TOP);

  return (
    <svg viewBox={`0 0 440 ${svgH}`} style={{ width: '100%', height: '100%', display: 'block' }}>
      <path d={bez(LX + NW, fY, fY + fH, RX, fRY, fRY + fH)} fill="#78716C" opacity={0.22} />
      <path d={bez(LX + NW, rY, rY + rH, RX, rRY, rRY + rH)} fill="#10B981" opacity={0.22} />
      {n > 0 && <path d={bez(LX + NW, nY, nY + nH, RX, nRY, nRY + nH)} fill="#8B5CF6" opacity={0.22} />}

      <rect x={LX} y={fY} width={NW} height={fH} fill="#78716C" rx={3} />
      <rect x={LX} y={rY} width={NW} height={rH} fill="#10B981" rx={3} />
      {n > 0 && <rect x={LX} y={nY} width={NW} height={nH} fill="#8B5CF6" rx={3} />}

      <rect x={RX} y={fRY} width={NW} height={fH} fill="#78716C" />
      <rect x={RX} y={rRY} width={NW} height={rH} fill="#10B981" />
      {n > 0 && <rect x={RX} y={nRY} width={NW} height={nH} fill="#8B5CF6" />}
      <rect x={RX} y={rBY} width={NW} height={rBH} fill="none" stroke="#E2E8F0" strokeWidth={1} rx={2} />

      <text x={LX - 8} y={fY + fH / 2 + 4} textAnchor="end" fontSize={12} fontWeight="600" fill="#78716C" fontFamily="Inter, system-ui, sans-serif">Fossil {f.toFixed(1)}%</text>
      <text x={LX - 8} y={rY + rH / 2 + 4} textAnchor="end" fontSize={12} fontWeight="600" fill="#10B981" fontFamily="Inter, system-ui, sans-serif">Renewable {r.toFixed(1)}%</text>
      {n > 0 && <text x={LX - 8} y={nY + nH / 2 + 4} textAnchor="end" fontSize={12} fontWeight="600" fill="#8B5CF6" fontFamily="Inter, system-ui, sans-serif">Nuclear {n.toFixed(1)}%</text>}
      <text x={RX + NW + 8} y={rBY + rBH / 2 + 4} fontSize={12} fontWeight="600" fill="#3B82F6" fontFamily="Inter, system-ui, sans-serif">Electricity</text>
    </svg>
  );
}

function EnergyFlowPoster({ country, metrics }: { country: CountryMeta; metrics: Metrics }) {
  const headline = energyHeadline(country.iso3, metrics.fossil, metrics.renewable, country.name);
  const fs = headline.length > 65 ? '22px' : '26px';
  return (
    <PosterShell source="Source: Ember Climate 2023 \u00b7 visualclimate.org">
      <div style={{ fontSize: fs, fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {country.flag}&nbsp;&nbsp;{headline}
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Electricity mix by source \u00b7 {country.name} \u00b7 2023
      </div>
      <div style={{ flex: 1, marginTop: '16px', minHeight: 0 }}>
        <MiniSankey fossil={metrics.fossil} renewable={metrics.renewable} nuclear={metrics.nuclear} />
      </div>
      <div style={{ display: 'flex', gap: '28px', marginTop: '8px' }}>
        {[
          { val: metrics.fossil,    label: 'Fossil',    color: '#EF4444' },
          { val: metrics.renewable, label: 'Renewable', color: '#10B981' },
          ...(metrics.nuclear > 0 ? [{ val: metrics.nuclear, label: 'Nuclear', color: '#8B5CF6' }] : []),
        ].map(m => (
          <div key={m.label}>
            <div style={{ fontSize: '40px', fontWeight: 800, color: m.color, fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>
              {m.val.toFixed(0)}%
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'Inter, system-ui, sans-serif', marginTop: '2px' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </PosterShell>
  );
}

// ── 2. Carbon Inequality ──────────────────────────────────────────────────────

function PersonIcon({ size, color, x, y }: { size: number; color: string; x: number; y: number }) {
  const r = size * 0.26;
  const hw = size * 0.36;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={size / 2} cy={r} r={r} fill={color} />
      <path d={`M${size / 2 - hw},${r * 2.4} Q${size / 2 - hw * 0.9},${size * 0.6} ${size / 2 - hw * 0.3},${size * 0.65} L${size / 2 - hw * 0.15},${size} L${size / 2 + hw * 0.15},${size} L${size / 2 + hw * 0.3},${size * 0.65} Q${size / 2 + hw * 0.9},${size * 0.6} ${size / 2 + hw},${r * 2.4} Z`} fill={color} />
    </g>
  );
}

function CarbonInequalityPoster({
  country, compCountry, metrics, compMetrics,
}: { country: CountryMeta; compCountry: CountryMeta; metrics: Metrics; compMetrics: Metrics }) {
  const aCO2 = metrics.co2;
  const bCO2 = compMetrics.co2;
  const bigIsA     = aCO2 >= bCO2;
  const bigCountry  = bigIsA ? country     : compCountry;
  const smallCountry = bigIsA ? compCountry : country;
  const bigCO2   = bigIsA ? aCO2 : bCO2;
  const smallCO2 = bigIsA ? bCO2 : aCO2;
  const ratio = smallCO2 > 0 ? Math.max(1, Math.round(bigCO2 / smallCO2)) : 1;
  const show  = Math.min(ratio, 20);
  const cols  = 4;
  const rows  = Math.ceil(show / cols);
  const bigSz = 120; const smSz = 40; const smGap = 5;
  const W = 460; const H = 290; const cy = H / 2;
  const bigX = 20; const bigY = cy - bigSz / 2;
  const gridW = cols * (smSz + smGap) - smGap;
  const gridH = rows * smSz + (rows > 1 ? (rows - 1) * smGap : 0);
  const gridX = 195; const gridY = cy - gridH / 2;

  const headline = ratio <= 1
    ? `${bigCountry.adj} and ${smallCountry.adj} emit nearly the same CO\u2082.`
    : `One ${bigCountry.adj} citizen emits as much CO\u2082 as ${ratio}\u00a0${smallCountry.adj} citizens.`;

  return (
    <PosterShell source="Source: World Bank WDI 2023 \u00b7 visualclimate.org">
      <div style={{ fontSize: headline.length > 55 ? '21px' : '25px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {headline}
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        CO\u2082 per capita comparison \u00b7 2023
      </div>
      <div style={{ flex: 1, marginTop: '12px', minHeight: 0, overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
          <PersonIcon size={bigSz} color="#EF4444" x={bigX} y={bigY} />
          <text x={bigX + bigSz / 2} y={bigY + bigSz + 16} textAnchor="middle" fontSize={12} fontWeight="700" fill="#EF4444" fontFamily="Inter, system-ui, sans-serif">{bigCountry.flag} {bigCO2.toFixed(1)} t</text>
          <text x={163} y={cy + 6} textAnchor="middle" fontSize={24} fill="#CBD5E1" fontFamily="Inter, system-ui, sans-serif">=</text>
          {Array.from({ length: show }).map((_, i) => (
            <PersonIcon key={i} size={smSz} color="#3B82F6"
              x={gridX + (i % cols) * (smSz + smGap)}
              y={gridY + Math.floor(i / cols) * (smSz + smGap)} />
          ))}
          {ratio > show && (
            <text x={gridX + gridW / 2} y={gridY + gridH + 18} textAnchor="middle" fontSize={11} fill="#94A3B8" fontFamily="Inter, system-ui, sans-serif">+{ratio - show} more ({ratio} total)</text>
          )}
          <text x={gridX + gridW / 2} y={gridY + gridH + (ratio > show ? 34 : 18)} textAnchor="middle" fontSize={12} fontWeight="700" fill="#3B82F6" fontFamily="Inter, system-ui, sans-serif">{smallCountry.flag} {smallCO2.toFixed(1)} t \u00d7 {ratio}</text>
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
        <span style={{ fontSize: '48px', fontWeight: 800, color: '#1A1A2E', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>{ratio}\u00d7</span>
        <span style={{ fontSize: '16px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>{smallCO2.toFixed(1)} t vs {bigCO2.toFixed(1)} t per capita</span>
      </div>
    </PosterShell>
  );
}

// ── 3. Paris Gap ──────────────────────────────────────────────────────────────

function ParisGapPoster({ country }: { country: CountryMeta }) {
  return (
    <PosterShell source="Source: World Bank WDI CO\u2082 per capita 2000\u20132023 \u00b7 visualclimate.org">
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {country.flag}&nbsp;&nbsp;Paris promised change. Here is who delivered.
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        CO\u2082 per capita CAGR before vs after the Paris Agreement
      </div>
      <div style={{ flex: 1, marginTop: '12px', minHeight: 0 }}>
        <ClimateGap highlightIso3={country.iso3} />
      </div>
    </PosterShell>
  );
}

// ── 4. Air Quality ────────────────────────────────────────────────────────────

function AirQualityPoster({ country, metrics }: { country: CountryMeta; metrics: Metrics }) {
  const WHO  = 5;
  const pm25 = metrics.pm25 > 0 ? metrics.pm25 : WHO;
  const ratio = Math.max(1, Math.round(pm25 / WHO));
  const maxR = 90;
  const cntR = maxR;
  const W = 460; const H = 220;

  const headline = pm25 <= WHO * 1.1
    ? `${country.name} meets WHO air quality standards.`
    : `${country.name} breathes air ${ratio}\u00d7 dirtier than WHO allows.`;

  return (
    <PosterShell source="Source: World Bank WDI PM2.5 \u00b7 WHO guideline: 5 \u00b5g/m\u00b3 annual mean \u00b7 visualclimate.org">
      <div style={{ fontSize: headline.length > 55 ? '21px' : '25px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {country.flag}&nbsp;&nbsp;{headline}
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Annual mean PM2.5 concentration, 2023
      </div>
      <div style={{ flex: 1, marginTop: '12px', minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width={W} height={H} fill={`rgba(120,100,80,${Math.min(0.12, pm25 / 100 * 0.15)})`} rx={12} />
          <circle cx={W * 0.27} cy={H / 2} r={Math.sqrt(WHO / pm25) * maxR} fill="#10B981" opacity={0.18} />
          <circle cx={W * 0.27} cy={H / 2} r={Math.sqrt(WHO / pm25) * maxR} fill="none" stroke="#10B981" strokeWidth={2} strokeDasharray="5,3" />
          <text x={W * 0.27} y={H / 2 - 5} textAnchor="middle" fontSize={12} fontWeight="700" fill="#059669" fontFamily="Inter, system-ui, sans-serif">WHO</text>
          <text x={W * 0.27} y={H / 2 + 11} textAnchor="middle" fontSize={11} fill="#059669" fontFamily="monospace">5 \u00b5g/m\u00b3</text>
          <text x={W / 2} y={H / 2 + 6} textAnchor="middle" fontSize={20} fill="#94A3B8" fontFamily="Inter, system-ui, sans-serif">vs</text>
          <circle cx={W * 0.73} cy={H / 2} r={cntR} fill="#EF4444" opacity={0.1} />
          <circle cx={W * 0.73} cy={H / 2} r={cntR} fill="none" stroke="#EF4444" strokeWidth={2.5} />
          <text x={W * 0.73} y={H / 2 - 8} textAnchor="middle" fontSize={12} fontWeight="700" fill="#DC2626" fontFamily="Inter, system-ui, sans-serif">{country.name}</text>
          <text x={W * 0.73} y={H / 2 + 12} textAnchor="middle" fontSize={15} fontWeight="800" fill="#DC2626" fontFamily="monospace">{pm25.toFixed(1)} \u00b5g/m\u00b3</text>
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
        <span style={{ fontSize: '50px', fontWeight: 800, color: pm25 > WHO ? '#EF4444' : '#10B981', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>
          {pm25.toFixed(1)}
        </span>
        <span style={{ fontSize: '15px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>
          \u00b5g/m\u00b3 &nbsp;\u00b7&nbsp; WHO safe limit: 5 \u00b5g/m\u00b3
        </span>
      </div>
    </PosterShell>
  );
}

// ── 5. Transition Race ────────────────────────────────────────────────────────

interface RaceEntry { iso3: string; name: string; flag: string; renewable: number }

function TransitionRacePoster({ raceData, highlightIso3 }: { raceData: RaceEntry[]; highlightIso3: string }) {
  if (raceData.length === 0) {
    return (
      <PosterShell source="Source: Ember Climate / OWID Energy 2023 \u00b7 visualclimate.org">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'Inter, system-ui, sans-serif' }}>
          Loading race data&hellip;
        </div>
      </PosterShell>
    );
  }

  const sorted = [...raceData].sort((a, b) => b.renewable - a.renewable);
  const max    = sorted[0]?.renewable || 100;
  const W = 460; const ROW = 21; const PAD = 20;
  const H = sorted.length * ROW + PAD * 2;
  const bStart = 120; const bMax = W - bStart - 56;

  function barColor(i: number, iso3: string): string {
    if (iso3 === highlightIso3) return '#0066FF';
    if (i < 3)  return '#10B981';
    if (i >= sorted.length - 3) return '#EF4444';
    return '#94A3B8';
  }

  return (
    <PosterShell source="Source: Ember Climate / OWID Energy 2023 \u00b7 visualclimate.org">
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        The renewable race: who is winning?
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Share of electricity from renewables \u00b7 20 countries \u00b7 2023
      </div>
      <div style={{ flex: 1, marginTop: '12px', minHeight: 0, overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          {sorted.map((c, i) => {
            const y     = PAD + i * ROW;
            const barW  = (c.renewable / max) * bMax;
            const isHL  = c.iso3 === highlightIso3;
            const color = barColor(i, c.iso3);
            const label = c.name.length > 14 ? c.name.slice(0, 13) + '\u2026' : c.name;
            return (
              <g key={c.iso3}>
                <text x={0} y={y + 13} fontSize={10} fill="#CBD5E1" fontFamily="monospace">{String(i + 1).padStart(2, '\u00a0')}.</text>
                <text x={18} y={y + 13} fontSize={11} fill={isHL ? '#0066FF' : '#4A4A6A'} fontWeight={isHL ? '700' : '400'} fontFamily="Inter, system-ui, sans-serif">
                  {c.flag} {label}
                </text>
                <rect x={bStart} y={y + 3} width={bMax} height={11} rx={5} fill="#F1F5F9" />
                <rect x={bStart} y={y + 3} width={barW} height={11} rx={5} fill={color} opacity={isHL ? 1 : 0.75} />
                <text x={bStart + barW + 5} y={y + 13} fontSize={11} fontWeight="700" fill={color} fontFamily="monospace">
                  {c.renewable.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </PosterShell>
  );
}

// ── 6. World Scoreboard ───────────────────────────────────────────────────────

const CLASS_NAME: Record<number, CountryClass['cls']> = { 1: 'Changer', 2: 'Starter', 3: 'Talker' };

async function fetchScoreboardData(): Promise<CountryClass[]> {
  const supabase = createClient();
  const { data: clsRows } = await supabase
    .from('country_data')
    .select('country_iso3, value')
    .eq('indicator_code', 'DERIVED.CLIMATE_CLASS')
    .eq('year', 2023);

  const { data: metricRows } = await supabase
    .from('country_data')
    .select('country_iso3, indicator_code, year, value')
    .in('indicator_code', ['EN.GHG.CO2.PC.CE.AR5', 'EMBER.RENEWABLE.PCT'])
    .gte('year', 2018)
    .order('year', { ascending: false });

  const { data: cntRows } = await supabase
    .from('countries')
    .select('iso3, name');

  const nameMap = new Map<string, string>((cntRows ?? []).map((c: { iso3: string; name: string }) => [c.iso3, c.name]));
  const clsMap  = new Map<string, number>((clsRows ?? []).map((r: { country_iso3: string; value: number }) => [r.country_iso3, r.value]));

  const co2Map = new Map<string, number>();
  const renMap = new Map<string, number>();
  for (const r of (metricRows ?? []) as { country_iso3: string; indicator_code: string; year: number; value: number }[]) {
    if (r.indicator_code === 'EN.GHG.CO2.PC.CE.AR5' && !co2Map.has(r.country_iso3)) co2Map.set(r.country_iso3, Number(r.value));
    if (r.indicator_code === 'EMBER.RENEWABLE.PCT'   && !renMap.has(r.country_iso3)) renMap.set(r.country_iso3, Number(r.value));
  }

  const results: CountryClass[] = [];
  for (const [iso3, clsVal] of clsMap) {
    results.push({
      iso3,
      name:      nameMap.get(iso3) ?? iso3,
      cls:       CLASS_NAME[clsVal] ?? 'Talker',
      co2:       co2Map.get(iso3),
      renewable: renMap.get(iso3),
    });
  }
  for (const [iso3, name] of nameMap) {
    if (!clsMap.has(iso3)) results.push({ iso3, name, cls: 'NoData' });
  }
  return results;
}

function WorldScoreboardPoster({ scoreboardData }: { scoreboardData: CountryClass[] }) {
  const counts = { Changer: 0, Starter: 0, Talker: 0 };
  for (const c of scoreboardData) if (c.cls !== 'NoData') counts[c.cls as keyof typeof counts]++;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid #E2E8F0', borderRadius: '16px',
      boxShadow: '0 4px 32px rgba(0,0,0,0.07)', padding: '32px',
      maxWidth: '900px', margin: '0 auto', overflow: 'hidden',
    }}>
      <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.05em', marginBottom: '12px' }}>
        visualclimate.org
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif', marginBottom: '6px' }}>
        Who is actually reducing emissions?
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif', marginBottom: '16px' }}>
        Climate action classification \u00b7 CO\u2082 CAGR 2015\u20132023 + Renewable growth 2018\u20132023
      </div>
      <WorldScoreboard countries={scoreboardData} width={836} height={428} />
      <div style={{ display: 'flex', gap: '32px', marginTop: '16px' }}>
        {[
          { label: 'Changers', val: counts.Changer, color: '#10B981', desc: '\u2193CO\u2082 + \u2191Renewable' },
          { label: 'Starters', val: counts.Starter, color: '#F59E0B', desc: 'One condition met'  },
          { label: 'Talkers',  val: counts.Talker,  color: '#EF4444', desc: 'Neither condition'  },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.val}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E', fontFamily: 'Inter, system-ui, sans-serif' }}>{s.label}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'Inter, system-ui, sans-serif' }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '11px', color: '#CBD5E1', fontFamily: 'Inter, system-ui, sans-serif', marginTop: '16px' }}>
        Source: World Bank WDI CO\u2082 / Ember Climate Renewable % \u00b7 VisualClimate classification \u00b7 visualclimate.org
      </div>
      <div style={{
        height: '4px',
        marginTop: '16px',
        marginLeft: '-32px',
        marginRight: '-32px',
        marginBottom: '-32px',
        background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%)',
      }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main PostersClient ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// Category filter definitions (from poster types)
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'scoreboard',  label: 'Global' },
  { value: 'energy',      label: 'Energy' },
  { value: 'gap',         label: 'Paris Gap' },
  { value: 'race',        label: 'Transition' },
  { value: 'inequality',  label: 'Inequality' },
  { value: 'air',         label: 'Air Quality' },
];

export function PostersClient() {
  const [iso3,     setIso3]     = useState('KOR');
  const [compIso3, setCompIso3] = useState('BGD');
  const [loading,  setLoading]  = useState(false);
  const [metrics,  setMetrics]  = useState<Metrics>(PILOT_DATA.KOR);
  const [compMet,  setCompMet]  = useState<Metrics>(PILOT_DATA.BGD);
  const [raceData,       setRaceData]       = useState<RaceEntry[]>([]);
  const [scoreboardData, setScoreboardData] = useState<CountryClass[]>([]);
  const [countriesList,  setCountriesList]  = useState<CountryMeta[]>(COUNTRIES);
  const [downloading,    setDownloading]    = useState<PosterType | null>(null);
  const [lightbox,       setLightbox]       = useState<PosterType | null>(null);
  const [viewMode,       setViewMode]       = useState<ViewMode>('grid');
  const [filter,         setFilter]         = useState<FilterType>('all');

  const refs = useRef<Partial<Record<PosterType, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (PILOT_DATA[iso3]) { setMetrics(PILOT_DATA[iso3]); return; }
    setLoading(true);
    fetchMetrics(iso3).then(m => { if (m) setMetrics(m); }).finally(() => setLoading(false));
  }, [iso3]);

  useEffect(() => {
    if (PILOT_DATA[compIso3]) { setCompMet(PILOT_DATA[compIso3]); return; }
    fetchMetrics(compIso3).then(m => { if (m) setCompMet(m); });
  }, [compIso3]);

  useEffect(() => {
    fetchAllRenewable().then(setRaceData);
    fetchScoreboardData().then(setScoreboardData);
    fetchCountriesFromDB().then(list => { if (list.length > 0) setCountriesList(list); });
  }, []);

  const country     = countriesList.find(c => c.iso3 === iso3)     ?? countriesList[0];
  const compCountry = countriesList.find(c => c.iso3 === compIso3) ?? countriesList[Math.min(5, countriesList.length - 1)];

  const handleDownload = useCallback(async (type: PosterType) => {
    const el = refs.current[type];
    if (!el) return;
    setDownloading(type);
    try {
      const { exportHtmlAsPng } = await import('@/lib/exportPng');
      const filename = type === 'inequality'
        ? `visualclimate-${type}-${iso3}-vs-${compIso3}.png`
        : `visualclimate-${type}-${iso3}.png`;
      await exportHtmlAsPng(el, filename);
    } finally {
      setDownloading(null);
    }
  }, [iso3, compIso3]);

  function renderPoster(type: PosterType) {
    if (loading && type !== 'scoreboard' && type !== 'race') {
      return <div className="flex aspect-square items-center justify-center text-sm text-[#8888A0]">Loading\u2026</div>;
    }
    switch (type) {
      case 'energy':     return <EnergyFlowPoster country={country} metrics={metrics} />;
      case 'inequality': return <CarbonInequalityPoster country={country} compCountry={compCountry} metrics={metrics} compMetrics={compMet} />;
      case 'gap':        return <ParisGapPoster country={country} />;
      case 'air':        return <AirQualityPoster country={country} metrics={metrics} />;
      case 'race':       return <TransitionRacePoster raceData={raceData} highlightIso3={iso3} />;
      case 'scoreboard': return <WorldScoreboardPoster scoreboardData={scoreboardData} />;
    }
  }

  function renderPosterRef(type: PosterType) {
    return (el: HTMLDivElement | null) => { refs.current[type] = el; };
  }

  // Build lightbox stats based on type — all from Supabase state
  function getLightboxStats(type: PosterType) {
    switch (type) {
      case 'energy':
        return [
          { label: 'Fossil', value: `${metrics.fossil.toFixed(1)}%`, color: '#EF4444' },
          { label: 'Renewable', value: `${metrics.renewable.toFixed(1)}%`, color: '#10B981' },
          ...(metrics.nuclear > 0 ? [{ label: 'Nuclear', value: `${metrics.nuclear.toFixed(1)}%`, color: '#8B5CF6' }] : []),
        ];
      case 'inequality':
        return [
          { label: `${country.name} CO\u2082/cap`, value: `${metrics.co2.toFixed(1)} t`, color: '#EF4444' },
          { label: `${compCountry.name} CO\u2082/cap`, value: `${compMet.co2.toFixed(1)} t`, color: '#3B82F6' },
        ];
      case 'air':
        return [
          { label: 'PM2.5', value: `${metrics.pm25.toFixed(1)} \u00b5g/m\u00b3`, color: metrics.pm25 > 5 ? '#EF4444' : '#10B981' },
          { label: 'WHO Guideline', value: '5 \u00b5g/m\u00b3', color: '#10B981' },
        ];
      case 'race':
        return [
          { label: 'Countries ranked', value: `${raceData.length}`, color: '#7C3AED' },
          { label: 'Top renewable', value: raceData[0] ? `${raceData[0].renewable.toFixed(1)}%` : '-', color: '#10B981' },
        ];
      case 'scoreboard': {
        const counts = { Changer: 0, Starter: 0, Talker: 0 };
        for (const c of scoreboardData) if (c.cls !== 'NoData') counts[c.cls as keyof typeof counts]++;
        return [
          { label: 'Changers', value: String(counts.Changer), color: '#10B981' },
          { label: 'Starters', value: String(counts.Starter), color: '#F59E0B' },
          { label: 'Talkers',  value: String(counts.Talker),  color: '#EF4444' },
        ];
      }
      case 'gap':
        return [
          { label: 'CO\u2082/cap', value: `${metrics.co2.toFixed(1)} t`, color: '#D97706' },
        ];
      default:
        return [];
    }
  }

  const lightboxDef = lightbox ? POSTER_DEFS.find(d => d.id === lightbox) : null;

  // Filter poster defs
  const filteredDefs = useMemo(() => {
    if (filter === 'all') return POSTER_DEFS;
    return POSTER_DEFS.filter(p => p.id === filter);
  }, [filter]);

  // ── Bento section data ──────────────────────────────────────────────────
  const bentoPosters: BentoPoster[] = [
    {
      id: 'scoreboard',
      title: 'World Scoreboard',
      subtitle: 'Climate action classification for 100+ countries',
      badge: 'Global',
      badgeColor: '#3B5998',
      bgColor: '#F0F4FF',
      content: <WorldScoreboardPoster scoreboardData={scoreboardData} />,
      onDownload: () => handleDownload('scoreboard'),
      downloading: downloading === 'scoreboard',
      refCallback: (el) => { refs.current.scoreboard = el; },
    },
    {
      id: 'energy',
      title: 'Energy Flow',
      subtitle: `${country.name} electricity mix`,
      badge: 'Energy',
      badgeColor: '#059669',
      bgColor: '#ECFDF5',
      content: <EnergyFlowPoster country={country} metrics={metrics} />,
      onDownload: () => handleDownload('energy'),
      downloading: downloading === 'energy',
      refCallback: (el) => { refs.current.energy = el; },
    },
    {
      id: 'gap',
      title: 'Paris Gap',
      subtitle: 'CO\u2082 CAGR before vs after Paris',
      badge: 'Paris Gap',
      badgeColor: '#D97706',
      bgColor: '#FFFBEB',
      content: <ParisGapPoster country={country} />,
      onDownload: () => handleDownload('gap'),
      downloading: downloading === 'gap',
      refCallback: (el) => { refs.current.gap = el; },
    },
    {
      id: 'race',
      title: 'Transition Race',
      subtitle: 'Renewable % ranking',
      badge: 'Transition',
      badgeColor: '#7C3AED',
      bgColor: '#F5F3FF',
      content: <TransitionRacePoster raceData={raceData} highlightIso3={iso3} />,
      onDownload: () => handleDownload('race'),
      downloading: downloading === 'race',
      refCallback: (el) => { refs.current.race = el; },
    },
    {
      id: 'inequality',
      title: 'Carbon Inequality',
      subtitle: `${country.name} vs ${compCountry.name}`,
      badge: 'Inequality',
      badgeColor: '#E11D48',
      bgColor: '#FFF1F2',
      content: <CarbonInequalityPoster country={country} compCountry={compCountry} metrics={metrics} compMetrics={compMet} />,
      onDownload: () => handleDownload('inequality'),
      downloading: downloading === 'inequality',
      refCallback: (el) => { refs.current.inequality = el; },
    },
    {
      id: 'air',
      title: 'Air Quality',
      subtitle: `${country.name} PM2.5 vs WHO`,
      badge: 'Air Quality',
      badgeColor: '#0D9488',
      bgColor: '#F0FDFA',
      content: <AirQualityPoster country={country} metrics={metrics} />,
      onDownload: () => handleDownload('air'),
      downloading: downloading === 'air',
      refCallback: (el) => { refs.current.air = el; },
    },
  ];

  // Handle poster click for lightbox — accept PosterType or string id
  const handlePosterClick = useCallback((id: string) => {
    const posterType = id as PosterType;
    setLightbox(posterType);
  }, []);

  return (
    <LayoutGroup>
      <div className="min-h-screen bg-white">
        {/* 1. Hero with scroll-driven fan-to-grid animation */}
        <PosterHeroSection
          totalPosters={6}
          totalCountries={countriesList.length}
        />

        {/* 2. Bento showcase: left sticky description + right 5-card bento grid */}
        <BentoSection
          posters={bentoPosters}
          totalTypes={6}
          totalCountries={countriesList.length}
          onPosterClick={handlePosterClick}
        />

        {/* 3. Toolbar (sticky) */}
        <Toolbar
          activeCategory={filter}
          onCategoryChange={setFilter}
          activeCountry={iso3}
          onCountryChange={setIso3}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          countriesList={countriesList}
          categories={CATEGORIES}
        />

        {/* 4. Explorer with 3 view modes */}
        <PosterExplorer
          countriesList={countriesList}
          iso3={iso3}
          compIso3={compIso3}
          setCompIso3={setCompIso3}
          onClickPoster={setLightbox}
          renderPoster={renderPoster}
          renderPosterRef={renderPosterRef}
          downloading={downloading}
          onDownload={handleDownload}
          viewMode={viewMode}
          filteredDefs={filteredDefs}
          countryName={country.name}
        />

        {/* 5. Lightbox overlay */}
        <PosterLightbox
          open={lightbox !== null}
          onClose={() => setLightbox(null)}
          title={lightboxDef?.title ?? ''}
          subtitle={`${country.flag} ${country.name}`}
          categoryLabel={lightboxDef?.category}
          categoryColor={lightboxDef?.categoryColor}
          bgColor={lightboxDef?.bgColor}
          stats={lightbox ? getLightboxStats(lightbox) : []}
          downloading={downloading === lightbox}
          onDownload={lightbox ? () => handleDownload(lightbox) : undefined}
        >
          {lightbox && (
            <div ref={renderPosterRef(lightbox)}>
              {renderPoster(lightbox)}
            </div>
          )}
        </PosterLightbox>
      </div>
    </LayoutGroup>
  );
}
