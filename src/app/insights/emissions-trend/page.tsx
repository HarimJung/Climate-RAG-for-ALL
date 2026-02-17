import type { Metadata } from 'next';
import { EmissionsTrendChart } from './chart';

export const metadata: Metadata = {
  title: 'Emissions Trend Analysis (2000-2023)',
  description: 'CO2 per capita trajectories for 6 pilot countries. Includes CAGR analysis, Paris Agreement impact comparison, GDP-emissions decoupling, and energy transition speed rankings.',
};

const cagrData = [
  { country: 'Bangladesh', iso3: 'BGD', start: 0.2005, end: 0.6939, cagr: 5.546, total: 246.09 },
  { country: 'South Korea', iso3: 'KOR', start: 9.9218, end: 11.4163, cagr: 0.612, total: 15.06 },
  { country: 'Brazil', iso3: 'BRA', start: 2.0079, end: 2.2745, cagr: 0.544, total: 13.28 },
  { country: 'Nigeria', iso3: 'NGA', start: 0.7928, end: 0.5523, cagr: -1.559, total: -30.33 },
  { country: 'Germany', iso3: 'DEU', start: 10.5993, end: 7.0798, cagr: -1.739, total: -33.20 },
  { country: 'United States', iso3: 'USA', start: 21.0119, end: 13.7119, cagr: -1.839, total: -34.74 },
];

const parisData = [
  { country: 'KOR', preCagr: 1.621, postCagr: -1.245, accel: -2.849 },
  { country: 'USA', preCagr: -1.744, postCagr: -1.872, accel: -0.061 },
  { country: 'DEU', preCagr: -0.693, postCagr: -3.746, accel: -3.005 },
  { country: 'BRA', preCagr: 2.221, postCagr: -1.507, accel: -3.659 },
  { country: 'NGA', preCagr: -1.299, postCagr: -1.459, accel: -0.436 },
  { country: 'BGD', preCagr: 6.517, postCagr: 3.279, accel: -3.164 },
];

const decouplingData = [
  { country: 'United States', iso3: 'USA', score: 6.349, intensity: 0.1692 },
  { country: 'Bangladesh', iso3: 'BGD', score: 6.079, intensity: 0.2720 },
  { country: 'Germany', iso3: 'DEU', score: 4.779, intensity: 0.1292 },
  { country: 'South Korea', iso3: 'KOR', score: 2.734, intensity: 0.3200 },
  { country: 'Brazil', iso3: 'BRA', score: 1.222, intensity: 0.2192 },
  { country: 'Nigeria', iso3: 'NGA', score: 0.077, intensity: 0.2583 },
];

const transitionData = [
  { country: 'Germany', iso3: 'DEU', speed: 19.154, current: 54.41 },
  { country: 'Brazil', iso3: 'BRA', speed: 6.637, current: 89.00 },
  { country: 'United States', iso3: 'USA', speed: 5.229, current: 22.68 },
  { country: 'South Korea', iso3: 'KOR', speed: 4.877, current: 9.57 },
  { country: 'Nigeria', iso3: 'NGA', speed: 1.723, current: 22.89 },
  { country: 'Bangladesh', iso3: 'BGD', speed: -0.149, current: 1.62 },
];

export default function EmissionsTrendPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-12">
        <p className="text-sm text-emerald-400 font-medium">Climate Insights</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Emissions Trend Analysis
        </h1>
        <p className="mt-3 text-slate-400">
          6 pilot countries &middot; 2000-2023 &middot; CO2 per capita (metric tons CO2eq)
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          <span>Sources: Climate TRACE, WDI, Ember</span>
          <span>&middot;</span>
          <span>Confidence: HIGH (3-source cross-validation)</span>
        </div>
      </div>

      {/* D3 Multi-line Chart */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold">CO2 per Capita Trajectories</h2>
        <EmissionsTrendChart />
      </section>

      {/* CAGR Table */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Compound Annual Growth Rate (2000-2023)</h2>
        <p className="mt-1 text-sm text-slate-400">23-year CAGR of CO2 per capita emissions</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4 text-right">2000</th>
                <th className="pb-3 pr-4 text-right">2023</th>
                <th className="pb-3 pr-4 text-right">CAGR (%)</th>
                <th className="pb-3 text-right">Total Change (%)</th>
              </tr>
            </thead>
            <tbody>
              {cagrData.map((row) => (
                <tr key={row.iso3} className="border-b border-slate-800/50">
                  <td className="py-3 pr-4 font-medium">{row.country}</td>
                  <td className="py-3 pr-4 text-right font-mono text-slate-300">{row.start.toFixed(2)}</td>
                  <td className="py-3 pr-4 text-right font-mono text-slate-300">{row.end.toFixed(2)}</td>
                  <td className={`py-3 pr-4 text-right font-mono font-medium ${row.cagr > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {row.cagr > 0 ? '+' : ''}{row.cagr.toFixed(2)}
                  </td>
                  <td className={`py-3 text-right font-mono ${row.total > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {row.total > 0 ? '+' : ''}{row.total.toFixed(1)}
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
        <p className="mt-1 text-sm text-slate-400">
          Acceleration = post-Paris CAGR minus pre-Paris CAGR. Negative = faster reduction.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4 text-right">Pre-Paris CAGR (%)</th>
                <th className="pb-3 pr-4 text-right">Post-Paris CAGR (%)</th>
                <th className="pb-3 text-right">Acceleration (pp)</th>
              </tr>
            </thead>
            <tbody>
              {parisData.map((row) => (
                <tr key={row.country} className="border-b border-slate-800/50">
                  <td className="py-3 pr-4 font-medium">{row.country}</td>
                  <td className={`py-3 pr-4 text-right font-mono ${row.preCagr > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {row.preCagr > 0 ? '+' : ''}{row.preCagr.toFixed(3)}
                  </td>
                  <td className={`py-3 pr-4 text-right font-mono ${row.postCagr > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {row.postCagr > 0 ? '+' : ''}{row.postCagr.toFixed(3)}
                  </td>
                  <td className="py-3 text-right font-mono font-medium text-emerald-400">
                    {row.accel.toFixed(3)}
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
        <p className="mt-1 text-sm text-slate-400">
          Decoupling score = GDP growth rate minus CO2 growth rate. Higher = better separation.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {decouplingData.map((row) => (
            <div key={row.iso3} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{row.country}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                +{row.score.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                CO2/GDP: {row.intensity.toFixed(4)} kg CO2eq/USD
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Energy Transition */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Energy Transition Speed</h2>
        <p className="mt-1 text-sm text-slate-400">
          Renewable energy share change over 5 years (percentage points)
        </p>
        <div className="mt-4 space-y-3">
          {transitionData.map((row) => (
            <div key={row.iso3} className="flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
              <div className="w-36 shrink-0">
                <p className="font-medium">{row.country}</p>
                <p className="text-xs text-slate-500">Current: {row.current}%</p>
              </div>
              <div className="flex-1">
                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${row.speed >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(Math.abs(row.speed) / 20 * 100, 2)}%` }}
                  />
                </div>
              </div>
              <p className={`w-20 text-right font-mono font-medium ${row.speed >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {row.speed > 0 ? '+' : ''}{row.speed.toFixed(1)} pp
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Methodology</h2>
        <div className="mt-4 grid gap-4 text-sm text-slate-400 md:grid-cols-2">
          <div>
            <p className="font-medium text-slate-300">CAGR</p>
            <p className="font-mono text-xs">(V_end / V_start)^(1/n) - 1</p>
          </div>
          <div>
            <p className="font-medium text-slate-300">Decoupling Score</p>
            <p className="font-mono text-xs">GDP_growth% - CO2_growth%</p>
          </div>
          <div>
            <p className="font-medium text-slate-300">Energy Transition Index</p>
            <p className="font-mono text-xs">5-year change in renewable share (pp)</p>
          </div>
          <div>
            <p className="font-medium text-slate-300">Carbon Intensity</p>
            <p className="font-mono text-xs">CO2 per capita / GDP per capita</p>
          </div>
        </div>
      </section>
    </div>
  );
}
