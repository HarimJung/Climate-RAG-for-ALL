'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import emissionsTrend from '../../../../data/analysis/emissions-trend-6countries.json';
import riskProfileKOR from '../../../../data/analysis/risk-profile-KOR.json';
import riskProfileUSA from '../../../../data/analysis/risk-profile-USA.json';
import riskProfileDEU from '../../../../data/analysis/risk-profile-DEU.json';
import riskProfileBRA from '../../../../data/analysis/risk-profile-BRA.json';
import riskProfileNGA from '../../../../data/analysis/risk-profile-NGA.json';
import riskProfileBGD from '../../../../data/analysis/risk-profile-BGD.json';

const RISK_PROFILES = {
  KOR: riskProfileKOR, USA: riskProfileUSA, DEU: riskProfileDEU,
  BRA: riskProfileBRA, NGA: riskProfileNGA, BGD: riskProfileBGD,
} as const;

// Light theme D3 color constants
const AXIS_COLOR = '#C8C8D0';
const GRID_COLOR = '#E8E8ED';
const LABEL_COLOR = '#4A4A6A';
const TITLE_COLOR = '#1A1A2E';
const BG_COLOR = '#FFFFFF';

interface CountryClientProps {
  countryName: string;
  iso3: string;
  wbCo2Series: { year: number; value: number }[];
  co2Comparison: { year: number; wb: number; ct: number }[];
  gdpVsCo2: { year: number; gdp: number; co2: number }[];
  emberMix: { renewable: number; fossil: number; other: number; year: number; source: string } | null;
  renewableChange: number | null;
  scatterData: { iso3: string; name: string; vulnerability: number; readiness: number }[];
  decouplingSeries: { year: number; value: number }[];
  decouplingScore: number | null;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[--border-card] bg-white p-6 ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">{children}</h2>;
}

function InsightText({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-[--text-secondary]">
      {children}
    </div>
  );
}

function SourceLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-xs text-[--text-muted]">{children}</p>;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function signed(n: number, decimals = 2): string {
  return (n >= 0 ? '+' : '') + n.toFixed(decimals);
}

// ─── Section 1: Emissions Story ───────────────────────────────────────────────
function EmissionsChart({ data, countryName }: { data: { year: number; value: number }[]; countryName: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const container = ref.current;

    function draw() {
      container.innerHTML = '';
      const margin = { top: 20, right: 20, bottom: 40, left: 55 };
      const width = container.clientWidth;
      const height = 340;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const svg = d3.select(container).append('svg')
        .attr('width', width).attr('height', height)
        .attr('role', 'img').attr('aria-label', `${countryName} CO2 emissions per capita 2000-2023`);
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
      const sorted = [...data].sort((a, b) => a.year - b.year);

      const x = d3.scaleLinear().domain(d3.extent(sorted, d => d.year) as [number, number]).range([0, innerW]);
      const y = d3.scaleLinear().domain([0, d3.max(sorted, d => d.value)! * 1.15]).nice().range([innerH, 0]);

      // Grid
      g.append('g').call(d3.axisLeft(y).tickSize(-innerW).tickFormat(() => ''))
        .call(s => s.selectAll('line').attr('stroke', GRID_COLOR))
        .call(s => s.select('.domain').remove());

      // Axes
      g.append('g').attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickFormat(d => String(d)).ticks(8))
        .call(s => s.select('.domain').attr('stroke', AXIS_COLOR))
        .call(s => s.selectAll('text').attr('fill', LABEL_COLOR).attr('font-size', '12'));
      g.append('g').call(d3.axisLeft(y).ticks(5))
        .call(s => s.select('.domain').attr('stroke', AXIS_COLOR))
        .call(s => s.selectAll('text').attr('fill', LABEL_COLOR).attr('font-size', '12'));

      // Paris Agreement vertical line at 2015
      if (x.domain()[0] <= 2015 && x.domain()[1] >= 2015) {
        g.append('line')
          .attr('x1', x(2015)).attr('x2', x(2015))
          .attr('y1', 0).attr('y2', innerH)
          .attr('stroke', '#E5484D').attr('stroke-width', 1.5).attr('stroke-dasharray', '6,4');
        g.append('text')
          .attr('x', x(2015) + 6).attr('y', 14)
          .attr('fill', '#E5484D').attr('font-size', '11').attr('font-weight', '600')
          .text('Paris Agreement');
      }

      // Area gradient
      const gradId = `emit-grad-${Math.random().toString(36).slice(2, 8)}`;
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient').attr('id', gradId).attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#0066FF').attr('stop-opacity', 0.15);
      grad.append('stop').attr('offset', '100%').attr('stop-color', '#0066FF').attr('stop-opacity', 0);

      const area = d3.area<typeof sorted[0]>().x(d => x(d.year)).y0(innerH).y1(d => y(d.value)).curve(d3.curveMonotoneX);
      g.append('path').datum(sorted).attr('fill', `url(#${gradId})`).attr('d', area);

      const line = d3.line<typeof sorted[0]>().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);
      g.append('path').datum(sorted).attr('fill', 'none').attr('stroke', '#0066FF').attr('stroke-width', 2.5).attr('d', line);

      g.selectAll('.dot').data(sorted).join('circle')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.value))
        .attr('r', 3).attr('fill', '#0066FF').attr('stroke', BG_COLOR).attr('stroke-width', 1.5);

      g.append('text').attr('x', -margin.left + 8).attr('y', -6)
        .attr('fill', LABEL_COLOR).attr('font-size', '11').text('t CO2e / capita');
    }

    draw();
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [data, countryName]);

  return <div ref={ref} className="w-full" />;
}

// ─── Comparison chart (WB vs Climate TRACE indexed) ───────────────────────────
function ComparisonChart({ data }: { data: { year: number; wb: number; ct: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const container = ref.current;

    function draw() {
      container.innerHTML = '';
      const margin = { top: 20, right: 20, bottom: 40, left: 50 };
      const width = container.clientWidth;
      const height = 300;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
        .attr('role', 'img').attr('aria-label', 'World Bank vs Climate TRACE emissions comparison');
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear().domain(d3.extent(data, d => d.year) as [number, number]).range([0, innerW]);
      const allVals = data.flatMap(d => [d.wb, d.ct]);
      const y = d3.scaleLinear().domain([d3.min(allVals)! * 0.95, d3.max(allVals)! * 1.05]).nice().range([innerH, 0]);

      g.append('g').call(d3.axisLeft(y).tickSize(-innerW).tickFormat(() => ''))
        .call(s => s.selectAll('line').attr('stroke', GRID_COLOR))
        .call(s => s.select('.domain').remove());
      g.append('g').attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickFormat(d => String(d)).ticks(Math.min(data.length, 8)))
        .call(s => s.select('.domain').attr('stroke', AXIS_COLOR))
        .call(s => s.selectAll('text').attr('fill', LABEL_COLOR).attr('font-size', '12'));
      g.append('g').call(d3.axisLeft(y).ticks(5))
        .call(s => s.select('.domain').attr('stroke', AXIS_COLOR))
        .call(s => s.selectAll('text').attr('fill', LABEL_COLOR).attr('font-size', '12'));

      // Reference line at 100
      g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', y(100)).attr('y2', y(100))
        .attr('stroke', AXIS_COLOR).attr('stroke-dasharray', '4,4');

      // WB line
      const wbLine = d3.line<typeof data[0]>().x(d => x(d.year)).y(d => y(d.wb)).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#0066FF').attr('stroke-width', 2).attr('d', wbLine);
      g.selectAll('.wb-dot').data(data).join('circle')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.wb))
        .attr('r', 3).attr('fill', '#0066FF').attr('stroke', BG_COLOR).attr('stroke-width', 1.5);

      // CT line
      const ctLine = d3.line<typeof data[0]>().x(d => x(d.year)).y(d => y(d.ct)).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#F59E0B').attr('stroke-width', 2).attr('d', ctLine);
      g.selectAll('.ct-dot').data(data).join('circle')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.ct))
        .attr('r', 3).attr('fill', '#F59E0B').attr('stroke', BG_COLOR).attr('stroke-width', 1.5);

      g.append('text').attr('x', -margin.left + 8).attr('y', -6)
        .attr('fill', LABEL_COLOR).attr('font-size', '11').text(`Index (${data[0].year} = 100)`);
    }

    draw();
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [data]);

  return <div ref={ref} className="w-full" />;
}

// ─── Section 2: Energy Mix Donut ──────────────────────────────────────────────
function EnergyDonut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const container = ref.current;
    container.innerHTML = '';

    const size = 220;
    const outerR = size / 2;
    const innerR = outerR * 0.58;

    const svg = d3.select(container).append('svg')
      .attr('width', size).attr('height', size)
      .attr('role', 'img').attr('aria-label', 'Electricity generation mix')
      .append('g').attr('transform', `translate(${outerR},${outerR})`);

    const pie = d3.pie<typeof data[0]>().value(d => d.value).sort(null).padAngle(0.02);
    const arc = d3.arc<d3.PieArcDatum<typeof data[0]>>().innerRadius(innerR).outerRadius(outerR).cornerRadius(3);

    svg.selectAll('path').data(pie(data)).join('path')
      .attr('d', arc).attr('fill', d => d.data.color).attr('stroke', BG_COLOR).attr('stroke-width', 2);

    svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.1em')
      .attr('fill', TITLE_COLOR).attr('font-size', '20').attr('font-weight', '700')
      .attr('font-family', 'var(--font-jetbrains-mono), monospace')
      .text(`${data.reduce((s, d) => s + d.value, 0).toFixed(0)}%`);
    svg.append('text').attr('text-anchor', 'middle').attr('dy', '1.4em')
      .attr('fill', LABEL_COLOR).attr('font-size', '11').text('Total');
  }, [data]);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <div ref={ref} />
      <ul className="flex flex-col gap-2.5">
        {data.map(d => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-[--text-secondary]">{d.label}</span>
            <span className="ml-auto font-mono text-[--text-primary] font-medium">{d.value.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Section 3: GDP vs CO2 Dual Axis ─────────────────────────────────────────
function DecouplingChart({ data }: { data: { year: number; gdp: number; co2: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const container = ref.current;

    function draw() {
      container.innerHTML = '';
      const margin = { top: 20, right: 20, bottom: 40, left: 55 };
      const width = container.clientWidth;
      const height = 320;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
        .attr('role', 'img').attr('aria-label', 'GDP vs CO2 emissions decoupling chart');
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear().domain(d3.extent(data, d => d.year) as [number, number]).range([0, innerW]);
      const allVals = data.flatMap(d => [d.gdp, d.co2]);
      const y = d3.scaleLinear().domain([d3.min(allVals)! * 0.9, d3.max(allVals)! * 1.1]).nice().range([innerH, 0]);

      g.append('g').call(d3.axisLeft(y).tickSize(-innerW).tickFormat(() => ''))
        .call(s => s.selectAll('line').attr('stroke', GRID_COLOR))
        .call(s => s.select('.domain').remove());
      g.append('g').attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickFormat(d => String(d)).ticks(8))
        .call(s => s.select('.domain').attr('stroke', AXIS_COLOR))
        .call(s => s.selectAll('text').attr('fill', LABEL_COLOR).attr('font-size', '12'));
      g.append('g').call(d3.axisLeft(y).ticks(5))
        .call(s => s.select('.domain').attr('stroke', AXIS_COLOR))
        .call(s => s.selectAll('text').attr('fill', LABEL_COLOR).attr('font-size', '12'));

      // Reference at 100
      g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', y(100)).attr('y2', y(100))
        .attr('stroke', AXIS_COLOR).attr('stroke-dasharray', '4,4');

      // GDP area
      const gdpGradId = `gdp-g-${Math.random().toString(36).slice(2, 8)}`;
      const defs = svg.append('defs');
      const gdpGrad = defs.append('linearGradient').attr('id', gdpGradId).attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
      gdpGrad.append('stop').attr('offset', '0%').attr('stop-color', '#00A67E').attr('stop-opacity', 0.1);
      gdpGrad.append('stop').attr('offset', '100%').attr('stop-color', '#00A67E').attr('stop-opacity', 0);

      const gdpArea = d3.area<typeof data[0]>().x(d => x(d.year)).y0(innerH).y1(d => y(d.gdp)).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', `url(#${gdpGradId})`).attr('d', gdpArea);

      // GDP line
      const gdpLine = d3.line<typeof data[0]>().x(d => x(d.year)).y(d => y(d.gdp)).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#00A67E').attr('stroke-width', 2.5).attr('d', gdpLine);

      // CO2 line
      const co2Line = d3.line<typeof data[0]>().x(d => x(d.year)).y(d => y(d.co2)).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#E5484D').attr('stroke-width', 2.5).attr('d', co2Line);

      g.selectAll('.gdp-dot').data(data).join('circle')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.gdp))
        .attr('r', 2.5).attr('fill', '#00A67E').attr('stroke', BG_COLOR).attr('stroke-width', 1);
      g.selectAll('.co2-dot').data(data).join('circle')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.co2))
        .attr('r', 2.5).attr('fill', '#E5484D').attr('stroke', BG_COLOR).attr('stroke-width', 1);

      g.append('text').attr('x', -margin.left + 8).attr('y', -6)
        .attr('fill', LABEL_COLOR).attr('font-size', '11').text(`Index (${data[0].year} = 100)`);
    }

    draw();
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [data]);

  return <div ref={ref} className="w-full" />;
}

// ─── Section 4: Vulnerability Scatter Plot ───────────────────────────────────
function VulnerabilityScatter({ data, highlightIso3 }: { data: { iso3: string; name: string; vulnerability: number; readiness: number }[]; highlightIso3: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const container = ref.current;

    function draw() {
      container.innerHTML = '';
      const margin = { top: 20, right: 30, bottom: 50, left: 60 };
      const width = container.clientWidth;
      const height = 360;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
        .attr('role', 'img').attr('aria-label', 'Climate vulnerability vs readiness scatter plot');
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.vulnerability)! * 0.9, d3.max(data, d => d.vulnerability)! * 1.1])
        .nice().range([0, innerW]);
      const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.readiness)! * 0.85, d3.max(data, d => d.readiness)! * 1.1])
        .nice().range([innerH, 0]);

      // Grid
      g.append('g').call(d3.axisLeft(y).tickSize(-innerW).tickFormat(() => ''))
        .call(s => s.selectAll('line').attr('stroke', GRID_COLOR))
        .call(s => s.select('.domain').remove());
      g.append('g').call(d3.axisBottom(x).tickSize(-innerH).tickFormat(() => ''))
        .attr('transform', `translate(0,${innerH})`)
        .call(s => s.selectAll('line').attr('stroke', GRID_COLOR))
        .call(s => s.select('.domain').remove());

      // Axes
      g.append('g').attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(5))
        .call(s => s.select('.domain').attr('stroke', AXIS_COLOR))
        .call(s => s.selectAll('text').attr('fill', LABEL_COLOR).attr('font-size', '12'));
      g.append('g').call(d3.axisLeft(y).ticks(5))
        .call(s => s.select('.domain').attr('stroke', AXIS_COLOR))
        .call(s => s.selectAll('text').attr('fill', LABEL_COLOR).attr('font-size', '12'));

      // Axis labels
      g.append('text')
        .attr('x', innerW / 2).attr('y', innerH + 40)
        .attr('text-anchor', 'middle').attr('fill', LABEL_COLOR).attr('font-size', '12')
        .text('Vulnerability (higher = more vulnerable)');
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2).attr('y', -45)
        .attr('text-anchor', 'middle').attr('fill', LABEL_COLOR).attr('font-size', '12')
        .text('Readiness (higher = more prepared)');

      const colors: Record<string, string> = {
        KOR: '#0066FF', USA: '#E5484D', DEU: '#F59E0B', BRA: '#00A67E', NGA: '#8B5CF6', BGD: '#EC4899',
      };

      // Points
      g.selectAll('.point').data(data).join('circle')
        .attr('cx', d => x(d.vulnerability)).attr('cy', d => y(d.readiness))
        .attr('r', d => d.iso3 === highlightIso3 ? 10 : 7)
        .attr('fill', d => colors[d.iso3] || '#64748b')
        .attr('stroke', d => d.iso3 === highlightIso3 ? TITLE_COLOR : BG_COLOR)
        .attr('stroke-width', d => d.iso3 === highlightIso3 ? 2.5 : 1.5)
        .attr('opacity', d => d.iso3 === highlightIso3 ? 1 : 0.8);

      // Labels
      g.selectAll('.label').data(data).join('text')
        .attr('x', d => x(d.vulnerability)).attr('y', d => y(d.readiness) - 14)
        .attr('text-anchor', 'middle')
        .attr('fill', d => d.iso3 === highlightIso3 ? TITLE_COLOR : LABEL_COLOR)
        .attr('font-size', d => d.iso3 === highlightIso3 ? '12' : '11')
        .attr('font-weight', d => d.iso3 === highlightIso3 ? '600' : '400')
        .text(d => d.name);
    }

    draw();
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [data, highlightIso3]);

  return <div ref={ref} className="w-full" />;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function CountryClient({
  countryName, iso3, wbCo2Series, co2Comparison, gdpVsCo2,
  emberMix, renewableChange, scatterData, decouplingSeries, decouplingScore,
}: CountryClientProps) {

  // ── Derived insight data from emissions-trend JSON ─────────────────────────
  const preParisRaw = emissionsTrend.pre_paris_vs_post_paris;
  const parisData = iso3 in preParisRaw
    ? preParisRaw[iso3 as keyof typeof preParisRaw]
    : null;

  const cagrRaw = emissionsTrend.cagr_2000_2023;
  const cagrData = iso3 in cagrRaw
    ? cagrRaw[iso3 as keyof typeof cagrRaw]
    : null;

  const decouplingRaw = emissionsTrend.decoupling_score;
  const decouplingEntry = iso3 in decouplingRaw
    ? decouplingRaw[iso3 as keyof typeof decouplingRaw]
    : null;

  const transitionEntry = emissionsTrend.energy_transition_ranking.find(d => d.country === iso3) ?? null;

  // Acceleration rank: most negative = largest deceleration = rank 1
  const sortedAccels = Object.values(preParisRaw)
    .map(d => d.acceleration)
    .sort((a, b) => a - b);
  const accelRank = parisData ? sortedAccels.indexOf(parisData.acceleration) + 1 : null;

  // ── Risk profile from JSON ──────────────────────────────────────────────────
  const riskProfile = iso3 in RISK_PROFILES ? RISK_PROFILES[iso3 as keyof typeof RISK_PROFILES] : null;

  // ── Vulnerability rank from scatterData ─────────────────────────────────────
  const myScatter = scatterData.find(d => d.iso3 === iso3) ?? null;
  const readinessRank = myScatter
    ? [...scatterData].sort((a, b) => b.readiness - a.readiness).findIndex(d => d.iso3 === iso3) + 1
    : null;

  const energyMixData = emberMix
    ? [
        { label: 'Fossil', value: emberMix.fossil, color: '#64748b' },
        { label: 'Renewable', value: emberMix.renewable, color: '#00A67E' },
        { label: 'Nuclear & Other', value: emberMix.other, color: '#0066FF' },
      ]
    : [];

  return (
    <div className="space-y-0">
      {/* Section 1: Emissions Story */}
      <section className="border-b border-[--border-card] bg-white px-4 py-12">
        <div className="mx-auto max-w-[1200px]">
          <SectionTitle>Emissions Trajectory</SectionTitle>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-1 text-sm font-semibold text-[--text-primary]">
                {countryName} — CO&#x2082; per capita (2000–2023)
              </h3>
              <EmissionsChart data={wbCo2Series} countryName={countryName} />
              <SourceLabel>Source: World Bank WDI · EN.GHG.CO2.PC.CE.AR5</SourceLabel>
            </Card>

            {co2Comparison.length > 0 && (
              <Card>
                <h3 className="mb-1 text-sm font-semibold text-[--text-primary]">
                  World Bank vs Climate TRACE
                </h3>
                <div className="mb-3 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: '#0066FF' }} />
                    <span className="text-[--text-secondary]">WB CO&#x2082;/capita</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: '#F59E0B' }} />
                    <span className="text-[--text-secondary]">Climate TRACE GHG</span>
                  </span>
                </div>
                <ComparisonChart data={co2Comparison} />
                <SourceLabel>
                  Source: World Bank WDI + Climate TRACE (indexed, {co2Comparison[0].year} = 100)
                </SourceLabel>
              </Card>
            )}
          </div>

          {parisData ? (
            <InsightText>
              <strong>{countryName}&apos;s emissions</strong> grew at {signed(parisData.pre_paris_cagr_pct)}%/yr
              pre-Paris (2000–2014), then{' '}
              <strong className={parisData.post_paris_cagr_pct < 0 ? 'text-[--accent-positive]' : 'text-[--accent-negative]'}>
                {signed(parisData.post_paris_cagr_pct)}%/yr
              </strong>{' '}
              post-Paris (2015–2023) — a <strong>{signed(parisData.acceleration)}pp shift</strong>.
              {accelRank !== null && ` This ranks ${ordinal(accelRank)} largest deceleration among 6 tracked countries.`}
              {cagrData && ` Per capita emissions reached ${parisData.value_2023.toFixed(1)} t in 2023 (${cagrData.total_change_pct > 0 ? '+' : ''}${cagrData.total_change_pct.toFixed(1)}% vs 2000).`}
            </InsightText>
          ) : (
            <InsightText>
              <strong>{countryName}&apos;s emissions trajectory</strong> reflects ongoing energy transition
              dynamics. Data sourced from World Bank WDI (2000–2023).
            </InsightText>
          )}
        </div>
      </section>

      {/* Section 2: Energy Mix */}
      {emberMix && (
        <section className="border-b border-[--border-card] bg-[--bg-section] px-4 py-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Energy Transition</SectionTitle>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">
                  Electricity Generation Mix ({emberMix.year})
                </h3>
                <EnergyDonut data={energyMixData} />
                <SourceLabel>Source: Ember Global Electricity Review ({emberMix.year})</SourceLabel>
              </Card>

              <Card>
                <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">Transition Progress</h3>
                <div className="space-y-4">
                  <div className="rounded-lg bg-[--bg-section] p-4">
                    <p className="text-sm text-[--text-secondary]">Renewable Share</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[--text-primary]">{emberMix.renewable.toFixed(1)}%</p>
                    {renewableChange != null && (
                      <p className={`mt-1 text-sm font-medium ${renewableChange > 0 ? 'text-[--accent-positive]' : 'text-[--accent-negative]'}`}>
                        {renewableChange > 0 ? '↑' : '↓'} {renewableChange > 0 ? '+' : ''}{renewableChange.toFixed(1)}pp over 5 years
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-[--bg-section] p-4">
                    <p className="text-sm text-[--text-secondary]">Fossil Fuel Share</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[--text-primary]">{emberMix.fossil.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-[--bg-section] p-4">
                    <p className="text-sm text-[--text-secondary]">Nuclear & Other</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[--text-primary]">{emberMix.other.toFixed(1)}%</p>
                  </div>
                </div>
              </Card>
            </div>

            {transitionEntry ? (
              <InsightText>
                <strong>{countryName}&apos;s renewable share ({emberMix.renewable.toFixed(1)}%)</strong> ranks{' '}
                {ordinal(transitionEntry.rank)} among 6 tracked countries, adding{' '}
                <strong>{signed(transitionEntry.energy_transition_value, 1)}pp</strong> over 5 years.
                {transitionEntry.rank === 1
                  ? ' Leading the group in renewable transition speed.'
                  : ` The group leader (Germany) reached ${emissionsTrend.energy_transition_ranking[0].renewable_pct_latest.toFixed(1)}% renewable by ${emissionsTrend.energy_transition_ranking[0].latest_year}.`
                }
                {' '}The nuclear & other segment ({emberMix.other.toFixed(1)}%) contributes non-fossil baseload generation.
              </InsightText>
            ) : (
              <InsightText>
                <strong>{countryName}&apos;s electricity mix</strong> reflects the current stage of energy transition.
                Renewable share stands at {emberMix.renewable.toFixed(1)}%, with {emberMix.other.toFixed(1)}% from nuclear & other sources.
              </InsightText>
            )}
          </div>
        </section>
      )}

      {/* Section 3: GDP vs CO2 Decoupling */}
      {gdpVsCo2.length > 0 && (
        <section className="border-b border-[--border-card] bg-white px-4 py-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Economic Decoupling</SectionTitle>
            <Card>
              <div className="mb-4 flex flex-wrap items-center gap-6">
                <h3 className="text-sm font-semibold text-[--text-primary]">GDP vs CO&#x2082; Growth</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#00A67E' }} />
                    <span className="text-[--text-secondary]">GDP per capita</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#E5484D' }} />
                    <span className="text-[--text-secondary]">CO&#x2082; per capita</span>
                  </span>
                </div>
                {decouplingScore != null && (
                  <span className="ml-auto rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-[--accent-positive]">
                    Decoupling Score: +{decouplingScore.toFixed(2)}
                  </span>
                )}
              </div>
              <DecouplingChart data={gdpVsCo2} />
              <SourceLabel>Source: World Bank WDI (GDP per capita + CO2 per capita), indexed to {gdpVsCo2[0].year} = 100</SourceLabel>
            </Card>

            {decouplingEntry ? (
              <InsightText>
                <strong>{countryName} shows {decouplingEntry.interpretation.toLowerCase()}.</strong>{' '}
                GDP grew faster than emissions by an average of{' '}
                <strong>{signed(decouplingEntry.avg_decoupling_2015_2023)}pp/yr</strong> since 2015{' '}
                ({ordinal(decouplingEntry.rank)} among 6 tracked countries).{' '}
                The divergence between the green (GDP) and red (CO&#x2082;) lines shows that economic growth is
                increasingly less carbon-intensive — a necessary but not yet sufficient trajectory for net-zero.
              </InsightText>
            ) : (
              <InsightText>
                <strong>{countryName}&apos;s economic decoupling</strong> reflects the relationship between GDP growth
                and emissions. The chart shows indexed trajectories since {gdpVsCo2[0].year}.
                {decouplingScore != null && ` Current decoupling score: ${signed(decouplingScore)}pp/yr (2015–2023).`}
              </InsightText>
            )}
          </div>
        </section>
      )}

      {/* Section 4: Vulnerability Scatter */}
      {scatterData.length > 0 && (
        <section className="border-b border-[--border-card] bg-[--bg-section] px-4 py-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Climate Vulnerability</SectionTitle>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">
                Vulnerability vs Readiness (6 Pilot Countries, 2023)
              </h3>
              <VulnerabilityScatter data={scatterData} highlightIso3={iso3} />
              <SourceLabel>Source: ND-GAIN Country Index (2023). Lower-left = ideal (low vulnerability, high readiness)</SourceLabel>
            </Card>

            {myScatter ? (
              <InsightText>
                <strong>{countryName} ranks {ordinal(readinessRank!)} in climate readiness (score: {myScatter.readiness.toFixed(3)})</strong>{' '}
                among the 6 pilot countries, reflecting institutional capacity, governance quality, and economic resources for adaptation.{' '}
                Vulnerability stands at <strong>{myScatter.vulnerability.toFixed(3)}</strong> —{' '}
                {myScatter.vulnerability < 0.35
                  ? 'in the lower range, indicating relatively stronger resilience.'
                  : myScatter.vulnerability < 0.45
                    ? 'in the medium range, indicating moderate exposure to climate impacts.'
                    : 'in the higher range, reflecting significant climate exposure.'
                }
                {emberMix && ` Fossil fuel dependency (${emberMix.fossil.toFixed(1)}%) remains a key driver of both emissions and vulnerability.`}
              </InsightText>
            ) : (
              <InsightText>
                <strong>{countryName}&apos;s climate vulnerability profile</strong> is shown relative to other pilot countries.
                The target position is low vulnerability with high readiness (lower-left quadrant).
              </InsightText>
            )}

            {riskProfile && (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <h3 className="mb-3 text-sm font-semibold text-[--text-primary]">Key Vulnerabilities</h3>
                    <ul className="space-y-2">
                      {riskProfile.key_vulnerabilities.map((v, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[--text-secondary]">
                          <span className="mt-0.5 shrink-0 text-[--accent-negative]">▸</span>
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <h3 className="mb-3 text-sm font-semibold text-[--text-primary]">Strengths</h3>
                    <ul className="space-y-2">
                      {riskProfile.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[--text-secondary]">
                          <span className="mt-0.5 shrink-0 text-[--accent-positive]">▸</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <InsightText>
                  <strong>Assessment ({riskProfile.risk_level} risk):</strong>{' '}{riskProfile.summary}
                </InsightText>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
