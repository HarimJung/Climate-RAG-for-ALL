import type { Metadata } from 'next';
import emissionsTrend from '../../../../data/analysis/emissions-trend-6countries.json';
import { EmissionsTrendChart } from './chart';

export const metadata: Metadata = {
  title: 'Emissions Trend Analysis (2000-2023)',
  description: 'CO2 per capita trajectories for 6 pilot countries. Includes CAGR analysis, Paris Agreement impact comparison, GDP-emissions decoupling, and energy transition speed rankings.',
};

const COUNTRY_NAMES: Record<string, string> = {
  KOR: 'South Korea', USA: 'United States', DEU: 'Germany',
  BRA: 'Brazil', NGA: 'Nigeria', BGD: 'Bangladesh',
};

const cagrData = Object.entries(emissionsTrend.cagr_2000_2023)
  .map(([iso3, d]) => ({ country: COUNTRY_NAMES[iso3] ?? iso3, iso3, ...d }))
  .sort((a, b) => b.cagr_pct - a.cagr_pct);

const parisData = Object.entries(emissionsTrend.pre_paris_vs_post_paris)
  .map(([iso3, d]) => ({ iso3, country: COUNTRY_NAMES[iso3] ?? iso3, ...d }));

const decouplingData = Object.entries(emissionsTrend.decoupling_score)
  .map(([iso3, d]) => ({ country: COUNTRY_NAMES[iso3] ?? iso3, iso3, ...d }))
  .sort((a, b) => a.rank - b.rank);

const transitionData = emissionsTrend.energy_transition_ranking.map(d => ({
  country: d.country_name,
  iso3: d.country,
  speed: d.energy_transition_value,
  current: d.renewable_pct_latest,
}));

export default function EmissionsTrendPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-12">
        <p className="text-sm text-[--accent-primary] font-medium">Climate Insights</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Emissions Trend Analysis
        </h1>
        <p className="mt-3 text-[--text-secondary]">
          6 pilot countries &middot; 2000-2023 &middot; CO2 per capita (metric tons CO2eq)
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[--text-muted]">
          <span>Sources: Climate TRACE, WDI, Ember</span>
          <span>&middot;</span>
          <span>Confidence: HIGH (3-source cross-validation)</span>
        </div>
      </div>

      {/* D3 Multi-line Chart */}
      <section className="rounded-xl border border-[--border-card] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">CO2 per Capita Trajectories</h2>
        <EmissionsTrendChart />
      </section>

      {/* CAGR Table */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Compound Annual Growth Rate (2000-2023)</h2>
        <p className="mt-1 text-sm text-[--text-secondary]">23-year CAGR of CO2 per capita emissions</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--border-card] text-left text-[--text-secondary]">
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4 text-right">2000</th>
                <th className="pb-3 pr-4 text-right">2023</th>
                <th className="pb-3 pr-4 text-right">CAGR (%)</th>
                <th className="pb-3 text-right">Total Change (%)</th>
              </tr>
            </thead>
            <tbody>
              {cagrData.map((row) => (
                <tr key={row.iso3} className="border-b border-[--border-card]/50">
                  <td className="py-3 pr-4 font-medium">{row.country}</td>
                  <td className="py-3 pr-4 text-right font-mono text-[--text-primary]">{row.value_2000.toFixed(2)}</td>
                  <td className="py-3 pr-4 text-right font-mono text-[--text-primary]">{row.value_2023.toFixed(2)}</td>
                  <td className={`py-3 pr-4 text-right font-mono font-medium ${row.cagr_pct > 0 ? 'text-[--accent-negative]' : 'text-[--accent-positive]'}`}>
                    {row.cagr_pct > 0 ? '+' : ''}{row.cagr_pct.toFixed(2)}
                  </td>
                  <td className={`py-3 text-right font-mono ${row.total_change_pct > 0 ? 'text-[--accent-negative]' : 'text-[--accent-positive]'}`}>
                    {row.total_change_pct > 0 ? '+' : ''}{row.total_change_pct.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Paris Agreement Comparison */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Paris Agreement Impact (Pre vs Post 2015)</h2>
        <p className="mt-1 text-sm text-[--text-secondary]">
          Acceleration = post-Paris CAGR minus pre-Paris CAGR. Negative = faster reduction.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--border-card] text-left text-[--text-secondary]">
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4 text-right">Pre-Paris CAGR (%)</th>
                <th className="pb-3 pr-4 text-right">Post-Paris CAGR (%)</th>
                <th className="pb-3 text-right">Acceleration (pp)</th>
              </tr>
            </thead>
            <tbody>
              {parisData.map((row) => (
                <tr key={row.iso3} className="border-b border-[--border-card]/50">
                  <td className="py-3 pr-4 font-medium">{row.country}</td>
                  <td className={`py-3 pr-4 text-right font-mono ${row.pre_paris_cagr_pct > 0 ? 'text-[--accent-negative]' : 'text-[--accent-positive]'}`}>
                    {row.pre_paris_cagr_pct > 0 ? '+' : ''}{row.pre_paris_cagr_pct.toFixed(3)}
                  </td>
                  <td className={`py-3 pr-4 text-right font-mono ${row.post_paris_cagr_pct > 0 ? 'text-[--accent-negative]' : 'text-[--accent-positive]'}`}>
                    {row.post_paris_cagr_pct > 0 ? '+' : ''}{row.post_paris_cagr_pct.toFixed(3)}
                  </td>
                  <td className="py-3 text-right font-mono font-medium text-[--accent-positive]">
                    {row.acceleration.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Decoupling */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">GDP-Emissions Decoupling (2015-2023)</h2>
        <p className="mt-1 text-sm text-[--text-secondary]">
          Decoupling score = GDP growth rate minus CO2 growth rate. Higher = better separation.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {decouplingData.map((row) => (
            <div key={row.iso3} className="rounded-xl border border-[--border-card] bg-white p-5">
              <p className="text-sm text-[--text-secondary]">{row.country}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[--accent-positive]">
                +{row.avg_decoupling_2015_2023.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-[--text-muted]">
                #{row.rank} &middot; {row.interpretation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Energy Transition */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Energy Transition Speed</h2>
        <p className="mt-1 text-sm text-[--text-secondary]">
          Renewable energy share change over 5 years (percentage points)
        </p>
        <div className="mt-4 space-y-3">
          {transitionData.map((row) => (
            <div key={row.iso3} className="flex items-center gap-4 rounded-lg border border-[--border-card] bg-white p-4">
              <div className="w-36 shrink-0">
                <p className="font-medium">{row.country}</p>
                <p className="text-xs text-[--text-muted]">Current: {row.current}%</p>
              </div>
              <div className="flex-1">
                <div className="h-3 overflow-hidden rounded-full bg-[--bg-section]">
                  <div
                    className={`h-full rounded-full ${row.speed >= 0 ? 'bg-[--accent-positive]' : 'bg-[--accent-negative]'}`}
                    style={{ width: `${Math.max(Math.abs(row.speed) / 20 * 100, 2)}%` }}
                  />
                </div>
              </div>
              <p className={`w-20 text-right font-mono font-medium ${row.speed >= 0 ? 'text-[--accent-positive]' : 'text-[--accent-negative]'}`}>
                {row.speed > 0 ? '+' : ''}{row.speed.toFixed(1)} pp
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section className="mt-12 rounded-xl border border-[--border-card] bg-[--bg-section] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[--text-secondary]">Methodology</h2>
        <div className="mt-4 grid gap-4 text-sm text-[--text-secondary] md:grid-cols-2">
          <div>
            <p className="font-medium text-[--text-primary]">CAGR</p>
            <p className="font-mono text-xs">(V_end / V_start)^(1/n) - 1</p>
          </div>
          <div>
            <p className="font-medium text-[--text-primary]">Decoupling Score</p>
            <p className="font-mono text-xs">GDP_growth% - CO2_growth%</p>
          </div>
          <div>
            <p className="font-medium text-[--text-primary]">Energy Transition Index</p>
            <p className="font-mono text-xs">5-year change in renewable share (pp)</p>
          </div>
          <div>
            <p className="font-medium text-[--text-primary]">Carbon Intensity</p>
            <p className="font-mono text-xs">CO2 per capita / GDP per capita</p>
          </div>
        </div>
      </section>
    </div>
  );
}
