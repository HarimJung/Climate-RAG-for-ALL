import { PosterShell } from './PosterShell';
import type { CountryMeta, Metrics } from '../poster-data';

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

export function CarbonInequalityPoster({
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
        CO&#x2082; per capita comparison &middot; 2023
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
          <text x={gridX + gridW / 2} y={gridY + gridH + (ratio > show ? 34 : 18)} textAnchor="middle" fontSize={12} fontWeight="700" fill="#3B82F6" fontFamily="Inter, system-ui, sans-serif">{smallCountry.flag} {smallCO2.toFixed(1)} t &times; {ratio}</text>
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
        <span style={{ fontSize: '48px', fontWeight: 800, color: '#1A1A2E', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>{ratio}&times;</span>
        <span style={{ fontSize: '16px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>{smallCO2.toFixed(1)} t vs {bigCO2.toFixed(1)} t per capita</span>
      </div>
    </PosterShell>
  );
}
