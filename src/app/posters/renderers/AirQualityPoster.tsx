import { PosterShell } from './PosterShell';
import type { CountryMeta, Metrics } from '../poster-data';

export function AirQualityPoster({ country, metrics }: { country: CountryMeta; metrics: Metrics }) {
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
    <PosterShell source="Source: World Bank WDI PM2.5 &middot; WHO guideline: 5 &micro;g/m&sup3; annual mean &middot; visualclimate.org">
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
          <text x={W * 0.27} y={H / 2 + 11} textAnchor="middle" fontSize={11} fill="#059669" fontFamily="monospace">5 &micro;g/m&sup3;</text>
          <text x={W / 2} y={H / 2 + 6} textAnchor="middle" fontSize={20} fill="#94A3B8" fontFamily="Inter, system-ui, sans-serif">vs</text>
          <circle cx={W * 0.73} cy={H / 2} r={cntR} fill="#EF4444" opacity={0.1} />
          <circle cx={W * 0.73} cy={H / 2} r={cntR} fill="none" stroke="#EF4444" strokeWidth={2.5} />
          <text x={W * 0.73} y={H / 2 - 8} textAnchor="middle" fontSize={12} fontWeight="700" fill="#DC2626" fontFamily="Inter, system-ui, sans-serif">{country.name}</text>
          <text x={W * 0.73} y={H / 2 + 12} textAnchor="middle" fontSize={15} fontWeight="800" fill="#DC2626" fontFamily="monospace">{pm25.toFixed(1)} &micro;g/m&sup3;</text>
        </svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
        <span style={{ fontSize: '50px', fontWeight: 800, color: pm25 > WHO ? '#EF4444' : '#10B981', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>
          {pm25.toFixed(1)}
        </span>
        <span style={{ fontSize: '15px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>
          &micro;g/m&sup3; &nbsp;&middot;&nbsp; WHO safe limit: 5 &micro;g/m&sup3;
        </span>
      </div>
    </PosterShell>
  );
}
