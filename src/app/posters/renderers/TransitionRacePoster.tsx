import { PosterShell } from './PosterShell';

export interface RaceEntry { iso3: string; name: string; flag: string; renewable: number }

export function TransitionRacePoster({ raceData, highlightIso3 }: { raceData: RaceEntry[]; highlightIso3: string }) {
  if (raceData.length === 0) {
    return (
      <PosterShell source="Source: Ember Climate / OWID Energy 2023 &middot; visualclimate.org">
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
    <PosterShell source="Source: Ember Climate / OWID Energy 2023 &middot; visualclimate.org">
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        The renewable race: who is winning?
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Share of electricity from renewables &middot; 20 countries &middot; 2023
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
