import { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import { createMetaTags } from '@/components/seo/MetaTags';
import { PostersClient } from './PostersClient';

export const metadata: Metadata = createMetaTags({
  title: 'Climate Posters',
  description: 'Downloadable climate data posters for 6 pilot countries. Share on LinkedIn.',
  path: '/posters',
});

export const dynamic = 'force-dynamic';

const PILOTS = [
  { iso3: 'KOR', name: 'South Korea', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  { iso3: 'USA', name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { iso3: 'DEU', name: 'Germany', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { iso3: 'BRA', name: 'Brazil', flag: '\uD83C\uDDE7\uD83C\uDDF7' },
  { iso3: 'NGA', name: 'Nigeria', flag: '\uD83C\uDDF3\uD83C\uDDEC' },
  { iso3: 'BGD', name: 'Bangladesh', flag: '\uD83C\uDDE7\uD83C\uDDE9' },
];

const COUNTRY_HOOKS: Record<string, string> = {
  KOR: 'Post-Paris deceleration -2.85pp. Renewables at OECD low 9.6%.',
  USA: 'Largest historical emitter. Decoupling leader at +6.35pp/yr.',
  DEU: '54.4% renewable electricity. Energiewende in action.',
  BRA: '89% renewable power. Forest cover loss remains major risk.',
  NGA: "PM2.5 at 11\u00D7 WHO limit. Africa's largest economy.",
  BGD: 'CO\u2082 +246% since 2000. 1/17 of US per capita.',
};

async function getPostersData() {
  try {
    const supabase = createServiceClient();
    const isos = PILOTS.map(c => c.iso3);

    const { data: rows } = await supabase
      .from('country_data')
      .select('country_iso3, indicator_code, year, value')
      .in('country_iso3', isos)
      .in('indicator_code', [
        'EN.GHG.CO2.PC.CE.AR5',
        'EMBER.RENEWABLE.PCT',
        'EMBER.FOSSIL.PCT',
        'EN.ATM.PM25.MC.M3',
        'NDGAIN.VULNERABILITY',
      ])
      .order('year', { ascending: false });

    const latest: Record<string, Record<string, number>> = {};
    for (const r of rows || []) {
      if (r.value == null) continue;
      if (!latest[r.country_iso3]) latest[r.country_iso3] = {};
      if (!(r.indicator_code in latest[r.country_iso3])) {
        latest[r.country_iso3][r.indicator_code] = Number(r.value);
      }
    }

    // CO2 stripes data
    const { data: co2Rows } = await supabase
      .from('country_data')
      .select('country_iso3, year, value')
      .in('country_iso3', isos)
      .eq('indicator_code', 'EN.GHG.CO2.PC.CE.AR5')
      .gte('year', 2000)
      .lte('year', 2023)
      .order('year', { ascending: true });

    const stripesByCountry: Record<string, { year: number; value: number }[]> = {};
    for (const r of co2Rows || []) {
      if (r.value == null) continue;
      if (!stripesByCountry[r.country_iso3]) stripesByCountry[r.country_iso3] = [];
      stripesByCountry[r.country_iso3].push({ year: r.year, value: Number(r.value) });
    }

    // Energy mix
    const { data: emberRows } = await supabase
      .from('country_data')
      .select('country_iso3, indicator_code, year, value')
      .in('country_iso3', isos)
      .in('indicator_code', ['EMBER.RENEWABLE.PCT', 'EMBER.FOSSIL.PCT'])
      .order('year', { ascending: false });

    const emberLatest: Record<string, { renewable?: number; fossil?: number }> = {};
    for (const r of emberRows || []) {
      if (r.value == null) continue;
      if (!emberLatest[r.country_iso3]) emberLatest[r.country_iso3] = {};
      const em = emberLatest[r.country_iso3];
      if (r.indicator_code === 'EMBER.RENEWABLE.PCT' && em.renewable == null) em.renewable = Number(r.value);
      if (r.indicator_code === 'EMBER.FOSSIL.PCT' && em.fossil == null) em.fossil = Number(r.value);
    }

    return PILOTS.map(p => {
      const l = latest[p.iso3] || {};
      const em = emberLatest[p.iso3] || {};
      const renewableVal = em.renewable ?? 0;
      const fossilVal = em.fossil ?? 0;
      const otherVal = Math.max(0, 100 - renewableVal - fossilVal);
      return {
        iso3: p.iso3,
        name: p.name,
        flag: p.flag,
        hook: COUNTRY_HOOKS[p.iso3] ?? '',
        co2: l['EN.GHG.CO2.PC.CE.AR5'] ?? 0,
        renewable: l['EMBER.RENEWABLE.PCT'] ?? 0,
        pm25: l['EN.ATM.PM25.MC.M3'] ?? 0,
        vulnerability: l['NDGAIN.VULNERABILITY'] ?? 0,
        stripesData: stripesByCountry[p.iso3] || [],
        energyMix: [
          { source: 'Fossil', value: fossilVal, type: 'fossil' as const },
          { source: 'Renewable', value: renewableVal, type: 'renewable' as const },
          { source: 'Nuclear & Other', value: otherVal, type: 'nuclear' as const },
        ],
        totalCO2: l['EN.GHG.CO2.PC.CE.AR5'] ?? 0,
      };
    });
  } catch {
    return [];
  }
}

export default async function PostersPage() {
  const countriesData = await getPostersData();

  return (
    <div className="bg-[--bg-primary]">
      <section className="px-4 py-14">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="mb-2 text-3xl font-bold text-[--text-primary]">Climate Posters</h1>
          <p className="mb-10 text-[--text-secondary]">
            Downloadable 1080px climate data visuals for 6 pilot countries. Click the PNG button on any chart to download.
          </p>
        </div>
      </section>

      {/* Paris Gap — all countries */}
      <section className="border-t border-[--border-card] bg-[--bg-section] px-4 py-12">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">Pre-Paris vs Post-Paris Emissions</h2>
          <PostersClient countriesData={countriesData} />
        </div>
      </section>
    </div>
  );
}
