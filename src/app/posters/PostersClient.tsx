'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const ClimateSankey = dynamic(
  () => import('@/components/charts/ClimateSankey').then(m => ({ default: m.ClimateSankey })),
  { ssr: false, loading: () => <div className="aspect-[9/5] animate-pulse rounded-xl bg-gray-100" /> },
);

const ClimateGap = dynamic(
  () => import('@/components/charts/ClimateGap').then(m => ({ default: m.ClimateGap })),
  { ssr: false, loading: () => <div className="aspect-[3/2] animate-pulse rounded-xl bg-gray-100" /> },
);

const ClimateSpiral = dynamic(
  () => import('@/components/charts/ClimateSpiral').then(m => ({ default: m.ClimateSpiral })),
  { ssr: false, loading: () => <div className="aspect-square animate-pulse rounded-xl bg-gray-100" /> },
);

const ClimateDivide = dynamic(
  () => import('@/components/charts/ClimateDivide').then(m => ({ default: m.ClimateDivide })),
  { ssr: false, loading: () => <div className="aspect-[9/5] animate-pulse rounded-xl bg-gray-100" /> },
);

// ── Pilot countries ──────────────────────────────────────────────────────────
const COUNTRIES = [
  { iso3: 'KOR', name: 'South Korea',   flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  { iso3: 'USA', name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { iso3: 'DEU', name: 'Germany',       flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { iso3: 'BRA', name: 'Brazil',        flag: '\uD83C\uDDE7\uD83C\uDDF7' },
  { iso3: 'NGA', name: 'Nigeria',       flag: '\uD83C\uDDF3\uD83C\uDDEC' },
  { iso3: 'BGD', name: 'Bangladesh',    flag: '\uD83C\uDDE7\uD83C\uDDE9' },
] as const;

type Iso3 = typeof COUNTRIES[number]['iso3'];

// ── Hardcoded current data (Ember 2023, WB WDI, ND-GAIN) ─────────────────────
const DATA: Record<Iso3, { fossil: number; renewable: number; nuclear: number; co2: number; pm25: number; vulnerability: number }> = {
  KOR: { fossil: 61.2, renewable:  9.6, nuclear: 29.2, co2: 11.4, pm25: 25.9, vulnerability: 0.357 },
  USA: { fossil: 59.1, renewable: 22.7, nuclear: 18.2, co2: 13.7, pm25:  7.8, vulnerability: 0.312 },
  DEU: { fossil: 44.2, renewable: 54.4, nuclear:  1.4, co2:  7.1, pm25: 10.3, vulnerability: 0.301 },
  BRA: { fossil:  9.0, renewable: 89.0, nuclear:  2.0, co2:  2.3, pm25: 12.2, vulnerability: 0.369 },
  NGA: { fossil: 77.1, renewable: 22.9, nuclear:  0.0, co2:  0.6, pm25: 56.5, vulnerability: 0.481 },
  BGD: { fossil: 98.4, renewable:  1.6, nuclear:  0.0, co2:  0.7, pm25: 42.4, vulnerability: 0.568 },
};

// ── CO2 per capita time series 2000-2023 (World Bank WDI, approximate) ───────
const SPIRAL_DATA: Record<Iso3, { year: number; value: number }[]> = {
  KOR: [
    { year: 2000, value: 8.2 },  { year: 2001, value: 8.4 },  { year: 2002, value: 9.1 },
    { year: 2003, value: 9.6 },  { year: 2004, value: 9.9 },  { year: 2005, value: 9.7 },
    { year: 2006, value: 10.3 }, { year: 2007, value: 10.7 }, { year: 2008, value: 10.4 },
    { year: 2009, value: 10.3 }, { year: 2010, value: 11.1 }, { year: 2011, value: 11.4 },
    { year: 2012, value: 11.1 }, { year: 2013, value: 11.3 }, { year: 2014, value: 11.2 },
    { year: 2015, value: 11.3 }, { year: 2016, value: 11.5 }, { year: 2017, value: 11.7 },
    { year: 2018, value: 11.7 }, { year: 2019, value: 11.0 }, { year: 2020, value: 10.2 },
    { year: 2021, value: 11.0 }, { year: 2022, value: 11.4 }, { year: 2023, value: 11.4 },
  ],
  USA: [
    { year: 2000, value: 20.0 }, { year: 2001, value: 19.7 }, { year: 2002, value: 19.7 },
    { year: 2003, value: 19.5 }, { year: 2004, value: 19.6 }, { year: 2005, value: 19.5 },
    { year: 2006, value: 19.0 }, { year: 2007, value: 19.3 }, { year: 2008, value: 18.4 },
    { year: 2009, value: 17.1 }, { year: 2010, value: 17.6 }, { year: 2011, value: 16.8 },
    { year: 2012, value: 16.4 }, { year: 2013, value: 16.5 }, { year: 2014, value: 16.5 },
    { year: 2015, value: 15.9 }, { year: 2016, value: 15.5 }, { year: 2017, value: 15.2 },
    { year: 2018, value: 15.5 }, { year: 2019, value: 15.2 }, { year: 2020, value: 13.2 },
    { year: 2021, value: 14.3 }, { year: 2022, value: 14.0 }, { year: 2023, value: 13.7 },
  ],
  DEU: [
    { year: 2000, value: 10.4 }, { year: 2001, value: 10.1 }, { year: 2002, value:  9.8 },
    { year: 2003, value: 10.0 }, { year: 2004, value:  9.8 }, { year: 2005, value:  9.6 },
    { year: 2006, value:  9.6 }, { year: 2007, value:  9.8 }, { year: 2008, value:  9.5 },
    { year: 2009, value:  8.7 }, { year: 2010, value:  9.3 }, { year: 2011, value:  8.9 },
    { year: 2012, value:  9.0 }, { year: 2013, value:  9.2 }, { year: 2014, value:  8.4 },
    { year: 2015, value:  8.5 }, { year: 2016, value:  8.5 }, { year: 2017, value:  8.3 },
    { year: 2018, value:  8.0 }, { year: 2019, value:  7.7 }, { year: 2020, value:  6.9 },
    { year: 2021, value:  7.4 }, { year: 2022, value:  7.0 }, { year: 2023, value:  7.1 },
  ],
  BRA: [
    { year: 2000, value: 1.9 }, { year: 2001, value: 1.9 }, { year: 2002, value: 1.9 },
    { year: 2003, value: 1.9 }, { year: 2004, value: 2.0 }, { year: 2005, value: 2.0 },
    { year: 2006, value: 2.0 }, { year: 2007, value: 2.1 }, { year: 2008, value: 2.2 },
    { year: 2009, value: 2.1 }, { year: 2010, value: 2.2 }, { year: 2011, value: 2.3 },
    { year: 2012, value: 2.3 }, { year: 2013, value: 2.4 }, { year: 2014, value: 2.5 },
    { year: 2015, value: 2.4 }, { year: 2016, value: 2.3 }, { year: 2017, value: 2.3 },
    { year: 2018, value: 2.3 }, { year: 2019, value: 2.3 }, { year: 2020, value: 2.1 },
    { year: 2021, value: 2.2 }, { year: 2022, value: 2.3 }, { year: 2023, value: 2.3 },
  ],
  NGA: [
    { year: 2000, value: 0.3 }, { year: 2001, value: 0.3 }, { year: 2002, value: 0.3 },
    { year: 2003, value: 0.3 }, { year: 2004, value: 0.3 }, { year: 2005, value: 0.4 },
    { year: 2006, value: 0.4 }, { year: 2007, value: 0.4 }, { year: 2008, value: 0.4 },
    { year: 2009, value: 0.4 }, { year: 2010, value: 0.5 }, { year: 2011, value: 0.5 },
    { year: 2012, value: 0.5 }, { year: 2013, value: 0.5 }, { year: 2014, value: 0.5 },
    { year: 2015, value: 0.5 }, { year: 2016, value: 0.5 }, { year: 2017, value: 0.5 },
    { year: 2018, value: 0.6 }, { year: 2019, value: 0.6 }, { year: 2020, value: 0.5 },
    { year: 2021, value: 0.6 }, { year: 2022, value: 0.6 }, { year: 2023, value: 0.6 },
  ],
  BGD: [
    { year: 2000, value: 0.2 }, { year: 2001, value: 0.2 }, { year: 2002, value: 0.2 },
    { year: 2003, value: 0.2 }, { year: 2004, value: 0.3 }, { year: 2005, value: 0.3 },
    { year: 2006, value: 0.3 }, { year: 2007, value: 0.3 }, { year: 2008, value: 0.3 },
    { year: 2009, value: 0.3 }, { year: 2010, value: 0.4 }, { year: 2011, value: 0.4 },
    { year: 2012, value: 0.4 }, { year: 2013, value: 0.4 }, { year: 2014, value: 0.5 },
    { year: 2015, value: 0.5 }, { year: 2016, value: 0.5 }, { year: 2017, value: 0.5 },
    { year: 2018, value: 0.5 }, { year: 2019, value: 0.6 }, { year: 2020, value: 0.5 },
    { year: 2021, value: 0.6 }, { year: 2022, value: 0.6 }, { year: 2023, value: 0.7 },
  ],
};

type ChartType = 'sankey' | 'gap' | 'card' | 'spiral' | 'divide';

const TABS: { id: ChartType; label: string; allCountries?: boolean }[] = [
  { id: 'sankey',  label: 'Energy Flow'  },
  { id: 'gap',     label: 'Paris Gap'    },
  { id: 'card',    label: 'Country Card' },
  { id: 'spiral',  label: 'CO\u2082 Spiral' },
  { id: 'divide',  label: 'CO\u2082 Divide', allCountries: true },
];

// ── Dark poster card ─────────────────────────────────────────────────────────
function CountryCardView({ iso3, name, flag, data }: {
  iso3: string;
  name: string;
  flag: string;
  data: typeof DATA.KOR;
}) {
  const MAX: Record<string, number> = { co2: 20, renewable: 100, fossil: 100, pm25: 70, vulnerability: 1 };
  const metrics = [
    { label: 'CO\u2082 per capita',      value: `${data.co2.toFixed(1)} t`,        raw: data.co2,           max: MAX.co2,           color: '#EF4444' },
    { label: 'Renewable %',              value: `${data.renewable.toFixed(1)}%`,    raw: data.renewable,     max: MAX.renewable,     color: '#10B981' },
    { label: 'Fossil %',                 value: `${data.fossil.toFixed(1)}%`,       raw: data.fossil,        max: MAX.fossil,        color: '#78716C' },
    { label: 'PM2.5 \u00b5g/m\u00b3',   value: data.pm25.toFixed(1),               raw: data.pm25,          max: MAX.pm25,          color: '#F59E0B' },
    { label: 'Vulnerability',            value: data.vulnerability.toFixed(3),     raw: data.vulnerability, max: MAX.vulnerability, color: '#8B5CF6' },
  ];

  return (
    <div className="mx-auto flex aspect-square max-w-[480px] flex-col justify-between rounded-2xl bg-[#0F172A] p-8 text-white">
      <div>
        <div className="text-5xl">{flag}</div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">{name}</h2>
        <p className="mt-1 text-sm text-slate-400">Climate Profile 2023 &nbsp;&middot;&nbsp; {iso3}</p>
      </div>

      <div className="space-y-4">
        {metrics.map(m => (
          <div key={m.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-400">{m.label}</span>
              <span className="font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (m.raw / m.max) * 100).toFixed(1)}%`,
                  backgroundColor: m.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-700">
        visualclimate.org &nbsp;&middot;&nbsp; Sources: Ember, WB WDI, ND-GAIN 2023
      </p>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export function PostersClient() {
  const [iso3, setIso3]               = useState<Iso3>('KOR');
  const [chartType, setChartType]     = useState<ChartType>('sankey');
  const [downloading, setDownloading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const country   = COUNTRIES.find(c => c.iso3 === iso3)!;
  const data      = DATA[iso3];
  const activeTab = TABS.find(t => t.id === chartType)!;

  async function handleDownload() {
    if (!chartRef.current) return;
    setDownloading(true);
    try {
      const { exportHtmlAsPng } = await import('@/lib/exportPng');
      await exportHtmlAsPng(chartRef.current, `visualclimate-${chartType}-${iso3}.png`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Country dropdown — hidden for 'divide' (all-country chart) */}
        {!activeTab.allCountries && (
          <select
            value={iso3}
            onChange={e => setIso3(e.target.value as Iso3)}
            className="rounded-lg border border-[--border-card] bg-white px-4 py-2.5 text-sm font-medium text-[--text-primary] shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {COUNTRIES.map(c => (
              <option key={c.iso3} value={c.iso3}>{c.flag} {c.name}</option>
            ))}
          </select>
        )}
        {activeTab.allCountries && (
          <span className="rounded-lg border border-[--border-card] bg-gray-50 px-4 py-2.5 text-sm text-[--text-muted]">
            All 6 countries
          </span>
        )}

        {/* Chart type tabs */}
        <div className="flex flex-wrap overflow-hidden rounded-lg border border-[--border-card] bg-white shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setChartType(tab.id)}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors',
                chartType === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-[--text-secondary] hover:bg-gray-50',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div
        className="overflow-hidden rounded-xl border border-[--border-card] bg-white"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div ref={chartRef} className="p-6">
          {chartType === 'sankey' && (
            <ClimateSankey
              country={country.name}
              fossil={data.fossil}
              renewable={data.renewable}
              nuclear={data.nuclear}
            />
          )}
          {chartType === 'gap' && (
            <ClimateGap highlightIso3={iso3} />
          )}
          {chartType === 'card' && (
            <CountryCardView
              iso3={iso3}
              name={country.name}
              flag={country.flag}
              data={data}
            />
          )}
          {chartType === 'spiral' && (
            <ClimateSpiral
              country={country.name}
              iso3={iso3}
              data={SPIRAL_DATA[iso3]}
            />
          )}
          {chartType === 'divide' && (
            <ClimateDivide />
          )}
        </div>
      </div>

      {/* Download */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
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
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </>
          )}
        </button>
        <span className="text-xs text-[--text-muted]">
          {activeTab.allCountries
            ? `All 6 countries \u2014 ${activeTab.label}`
            : `${country.flag} ${country.name} \u2014 ${activeTab.label}`
          }
        </span>
      </div>

    </div>
  );
}
