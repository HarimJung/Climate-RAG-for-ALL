import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country   = searchParams.get('country')   || 'VisualClimate';
  const chartType = searchParams.get('chartType') || 'Climate Data';
  const title     = searchParams.get('title')     || `${country} — ${chartType}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'Inter, system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Green top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: '#10B981',
          }}
        />

        {/* Icon row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginRight: '16px',
            }}
          >
            🌍
          </div>
          <div style={{ fontSize: '18px', color: '#64748B', letterSpacing: '0.05em' }}>
            VISUALCLIMATE
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: '900px',
          }}
        >
          {title.length > 40 ? title.slice(0, 40) + '…' : title}
        </div>

        {/* Sub-label */}
        <div
          style={{
            fontSize: '28px',
            color: '#94A3B8',
            marginTop: '20px',
            textAlign: 'center',
          }}
        >
          {chartType !== 'Climate Data' && chartType !== title ? chartType : 'Open Climate Data Platform'}
        </div>

        {/* Domain badge */}
        <div
          style={{
            marginTop: '48px',
            padding: '10px 28px',
            borderRadius: '100px',
            border: '1.5px solid #10B981',
            fontSize: '18px',
            color: '#10B981',
            letterSpacing: '0.04em',
          }}
        >
          visualclimate.org
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
