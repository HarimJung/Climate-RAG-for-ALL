import type { ReactNode } from 'react';

export function PosterShell({ source, children }: { source: string; children: ReactNode }) {
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
