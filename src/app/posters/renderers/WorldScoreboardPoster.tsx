import { WorldScoreboard, type CountryClass } from '@/components/charts/WorldScoreboard';

export function WorldScoreboardPoster({ scoreboardData }: { scoreboardData: CountryClass[] }) {
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
        Climate action classification &middot; CO&#x2082; CAGR 2015&#x2013;2023 + Renewable growth 2018&#x2013;2023
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
        Source: World Bank WDI CO&#x2082; / Ember Climate Renewable % &middot; VisualClimate classification &middot; visualclimate.org
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
