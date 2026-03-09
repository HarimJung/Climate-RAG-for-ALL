import { PosterShell } from './PosterShell';
import type { CountryMeta, Metrics } from '../poster-data';

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

export function EnergyFlowPoster({ country, metrics }: { country: CountryMeta; metrics: Metrics }) {
  const headline = energyHeadline(country.iso3, metrics.fossil, metrics.renewable, country.name);
  const fs = headline.length > 65 ? '22px' : '26px';
  return (
    <PosterShell source="Source: Ember Climate 2023 \u00b7 visualclimate.org">
      <div style={{ fontSize: fs, fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {country.flag}&nbsp;&nbsp;{headline}
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Electricity mix by source &middot; {country.name} &middot; 2023
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
