import { PosterShell } from './PosterShell';
import { ClimateGap } from '@/components/charts/ClimateGap';
import type { CountryMeta } from '../poster-data';

export function ParisGapPoster({ country }: { country: CountryMeta }) {
  return (
    <PosterShell source="Source: World Bank WDI CO&#x2082; per capita 2000&#x2013;2023 &middot; visualclimate.org">
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {country.flag}&nbsp;&nbsp;Paris promised change. Here is who delivered.
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        CO&#x2082; per capita CAGR before vs after the Paris Agreement
      </div>
      <div style={{ flex: 1, marginTop: '12px', minHeight: 0 }}>
        <ClimateGap highlightIso3={country.iso3} />
      </div>
    </PosterShell>
  );
}
