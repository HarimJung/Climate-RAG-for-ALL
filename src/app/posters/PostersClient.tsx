'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ClimateGap } from '@/components/charts/ClimateGap';

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

function energyHeadline(iso3: string, fossil: number, renewable: number): string {
  if (ENERGY_HEADLINES[iso3]) return ENERGY_HEADLINES[iso3];
  const name = COUNTRIES.find(c => c.iso3 === iso3)?.name ?? iso3;
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
  const isos = COUNTRIES.map(c => c.iso3);
  const { data } = await supabase
    .from('country_data')
    .select('country_iso3, year, value')
    .eq('indicator_code', 'EMBER.RENEWABLE.PCT')
    .in('country_iso3', isos)
    .order('year', { ascending: false });
  const seen = new Map<string, number>();
  for (const row of (data ?? [])) {
    if (!seen.has(row.country_iso3) && row.value != null) seen.set(row.country_iso3, Number(row.value));
  }
  return COUNTRIES.map(c => ({
    iso3: c.iso3, name: c.name, flag: c.flag,
    renewable: seen.get(c.iso3) ?? (PILOT_DATA[c.iso3]?.renewable ?? 0),
  })).sort((a, b) => b.renewable - a.renewable);
}

// ── Poster shell: 1:1 square ──────────────────────────────────────────────────
function PosterShell({ source, children }: { source: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#FAFAF9', border: '1px solid #E2E8F0', borderRadius: '16px',
      boxShadow: '0 4px 32px rgba(0,0,0,0.07)', padding: '36px',
      aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column',
      maxWidth: '560px', margin: '0 auto',
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
  const headline = energyHeadline(country.iso3, metrics.fossil, metrics.renewable);
  const fs = headline.length > 65 ? '22px' : '26px';
  return (
    <PosterShell source="Source: Ember Climate 2023 · visualclimate.org">
      <div style={{ fontSize: fs, fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {country.flag}&nbsp;&nbsp;{headline}
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Electricity mix by source · {country.name} · 2023
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
  const ratio = compMetrics.co2 > 0 ? Math.max(1, Math.round(metrics.co2 / compMetrics.co2)) : 1;
  const show  = Math.min(ratio, 35);
  const cols  = show <= 5 ? show : show <= 12 ? 6 : 7;
  const rows  = Math.ceil(show / cols);
  const smSz = 25; const smGap = 4;
  const gridW = cols * (smSz + smGap) - smGap;
  const gridH = rows * (smSz + smGap + 6);
  const W = 460; const H = 230;
  const cy = H / 2;
  const bigSz = 80;
  const bigX = 18; const bigY = cy - bigSz / 2;
  const gridX = 205; const gridY = cy - gridH / 2;

  const headline = ratio <= 1
    ? `${country.adj} and ${compCountry.adj} emit nearly the same CO\u2082.`
    : `One ${country.adj} emits as much CO\u2082 as ${ratio}\u00a0${compCountry.adj}${ratio > 1 ? 's' : ''}.`;

  return (
    <PosterShell source="Source: World Bank WDI 2023 · visualclimate.org">
      <div style={{ fontSize: headline.length > 55 ? '21px' : '25px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {headline}
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        CO\u2082 per capita comparison · 2023
      </div>
      <div style={{ flex: 1, marginTop: '12px', minHeight: 0, overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
          <PersonIcon size={bigSz} color="#EF4444" x={bigX} y={bigY} />
          <text x={bigX + bigSz / 2} y={bigY + bigSz + 16} textAnchor="middle" fontSize={12} fontWeight="700" fill="#EF4444" fontFamily="Inter, system-ui, sans-serif">{country.flag} {metrics.co2.toFixed(1)} t</text>
          <text x={180} y={cy + 6} textAnchor="middle" fontSize={24} fill="#CBD5E1" fontFamily="Inter, system-ui, sans-serif">=</text>
          {Array.from({ length: show }).map((_, i) => (
            <PersonIcon key={i} size={smSz} color="#3B82F6"
              x={gridX + (i % cols) * (smSz + smGap)}
              y={gridY + Math.floor(i / cols) * (smSz + smGap + 6)} />
          ))}
          {ratio > show && (
            <text x={gridX + gridW / 2} y={gridY + gridH + 14} textAnchor="middle" fontSize={11} fill="#94A3B8" fontFamily="Inter, system-ui, sans-serif">+{ratio - show} more ({ratio} total)</text>
          )}
          <text x={gridX + gridW / 2} y={gridY + gridH + (ratio > show ? 28 : 14)} textAnchor="middle" fontSize={12} fontWeight="700" fill="#3B82F6" fontFamily="Inter, system-ui, sans-serif">{compCountry.flag} {compMetrics.co2.toFixed(2)} t × {ratio}</text>
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
        <span style={{ fontSize: '50px', fontWeight: 800, color: '#1A1A2E', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>{ratio}×</span>
        <span style={{ fontSize: '15px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>{metrics.co2.toFixed(1)} t vs {compMetrics.co2.toFixed(2)} t per capita</span>
      </div>
    </PosterShell>
  );
}

// ── 3. Paris Gap ──────────────────────────────────────────────────────────────

function ParisGapPoster({ country }: { country: CountryMeta }) {
  return (
    <PosterShell source="Source: World Bank WDI CO\u2082 per capita 2000\u20132023 · visualclimate.org">
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
  const whoR = Math.sqrt(WHO / pm25) * maxR;
  const cntR = maxR;
  const W = 460; const H = 220;

  const headline = pm25 <= WHO * 1.1
    ? `${country.name} meets WHO air quality standards.`
    : `${country.name} breathes air ${ratio}\u00d7 dirtier than WHO allows.`;

  return (
    <PosterShell source="Source: World Bank WDI PM2.5 · WHO guideline: 5 \u00b5g/m\u00b3 annual mean · visualclimate.org">
      <div style={{ fontSize: headline.length > 55 ? '21px' : '25px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {country.flag}&nbsp;&nbsp;{headline}
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Annual mean PM2.5 concentration, 2023
      </div>
      <div style={{ flex: 1, marginTop: '12px', minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
          {/* Haze fill proportional to PM2.5 */}
          <rect width={W} height={H} fill={`rgba(120,100,80,${Math.min(0.12, pm25 / 100 * 0.15)})`} rx={12} />

          {/* WHO circle */}
          <circle cx={W * 0.27} cy={H / 2} r={whoR} fill="#10B981" opacity={0.18} />
          <circle cx={W * 0.27} cy={H / 2} r={whoR} fill="none" stroke="#10B981" strokeWidth={2} strokeDasharray="5,3" />
          <text x={W * 0.27} y={H / 2 - 5} textAnchor="middle" fontSize={12} fontWeight="700" fill="#059669" fontFamily="Inter, system-ui, sans-serif">WHO</text>
          <text x={W * 0.27} y={H / 2 + 11} textAnchor="middle" fontSize={11} fill="#059669" fontFamily="monospace">5 \u00b5g/m\u00b3</text>

          {/* vs */}
          <text x={W / 2} y={H / 2 + 6} textAnchor="middle" fontSize={20} fill="#94A3B8" fontFamily="Inter, system-ui, sans-serif">vs</text>

          {/* Country circle */}
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
      <PosterShell source="Source: Ember Climate / OWID Energy 2023 · visualclimate.org">
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
    <PosterShell source="Source: Ember Climate / OWID Energy 2023 · visualclimate.org">
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

// ── Main PostersClient ────────────────────────────────────────────────────────

type PosterType = 'energy' | 'inequality' | 'gap' | 'air' | 'race';
const TABS: { id: PosterType; label: string; noCountry?: boolean }[] = [
  { id: 'energy',     label: 'Energy Flow'      },
  { id: 'inequality', label: 'Carbon Inequality' },
  { id: 'gap',        label: 'Paris Gap'         },
  { id: 'air',        label: 'Air Quality'       },
  { id: 'race',       label: 'Transition Race', noCountry: true },
];

export function PostersClient() {
  const [iso3,     setIso3]     = useState('KOR');
  const [compIso3, setCompIso3] = useState('BGD');
  const [poster,   setPoster]   = useState<PosterType>('energy');
  const [loading,  setLoading]  = useState(false);
  const [metrics,  setMetrics]  = useState<Metrics>(PILOT_DATA.KOR);
  const [compMet,  setCompMet]  = useState<Metrics>(PILOT_DATA.BGD);
  const [raceData, setRaceData] = useState<RaceEntry[]>([]);
  const [downloading, setDownloading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const country     = COUNTRIES.find(c => c.iso3 === iso3)     ?? COUNTRIES[0];
  const compCountry = COUNTRIES.find(c => c.iso3 === compIso3) ?? COUNTRIES[5];
  const activeTab   = TABS.find(t => t.id === poster)!;

  async function handleDownload() {
    if (!chartRef.current) return;
    setDownloading(true);
    try {
      const { exportHtmlAsPng } = await import('@/lib/exportPng');
      const filename = poster === 'inequality'
        ? `visualclimate-${poster}-${iso3}-vs-${compIso3}.png`
        : `visualclimate-${poster}-${iso3}.png`;
      await exportHtmlAsPng(chartRef.current, filename);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">

        {!activeTab.noCountry && (
          <select value={iso3} onChange={e => setIso3(e.target.value)}
            className="rounded-lg border border-[--border-card] bg-white px-4 py-2.5 text-sm font-medium text-[--text-primary] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {COUNTRIES.map(c => <option key={c.iso3} value={c.iso3}>{c.flag} {c.name}</option>)}
          </select>
        )}

        {poster === 'inequality' && (
          <>
            <span className="text-sm text-[--text-muted]">vs</span>
            <select value={compIso3} onChange={e => setCompIso3(e.target.value)}
              className="rounded-lg border border-[--border-card] bg-white px-4 py-2.5 text-sm font-medium text-[--text-primary] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {COUNTRIES.filter(c => c.iso3 !== iso3).map(c => <option key={c.iso3} value={c.iso3}>{c.flag} {c.name}</option>)}
            </select>
          </>
        )}

        <div className="flex flex-wrap overflow-hidden rounded-lg border border-[--border-card] bg-white shadow-sm">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setPoster(tab.id)}
              className={['px-4 py-2.5 text-sm font-medium transition-colors',
                poster === tab.id ? 'bg-blue-600 text-white' : 'text-[--text-secondary] hover:bg-gray-50',
              ].join(' ')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Poster canvas */}
      <div ref={chartRef}>
        {loading ? (
          <div className="flex aspect-square max-w-[560px] mx-auto items-center justify-center rounded-2xl border bg-[#FAFAF9] text-sm text-[--text-muted]">
            Loading data&hellip;
          </div>
        ) : (
          <>
            {poster === 'energy'     && <EnergyFlowPoster country={country} metrics={metrics} />}
            {poster === 'inequality' && <CarbonInequalityPoster country={country} compCountry={compCountry} metrics={metrics} compMetrics={compMet} />}
            {poster === 'gap'        && <ParisGapPoster country={country} />}
            {poster === 'air'        && <AirQualityPoster country={country} metrics={metrics} />}
            {poster === 'race'       && <TransitionRacePoster raceData={raceData} highlightIso3={iso3} />}
          </>
        )}
      </div>

      {/* Download */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={handleDownload} disabled={downloading || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
          {downloading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Preparing&hellip;
            </>
          ) : (
            <>
              Download PNG
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </>
          )}
        </button>
        <span className="text-xs text-[--text-muted]">
          {poster === 'race'
            ? 'Transition Race \u2014 20 countries'
            : poster === 'inequality'
            ? `${country.flag} ${country.name} vs ${compCountry.flag} ${compCountry.name}`
            : `${country.flag} ${country.name} \u2014 ${activeTab.label}`}
        </span>
      </div>

    </div>
  );
}
