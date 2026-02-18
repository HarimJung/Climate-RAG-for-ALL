'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { exportSvgAsPng } from '@/lib/exportPng';

export interface EnergySource {
  source: string;
  value: number;
  type: 'fossil' | 'renewable' | 'nuclear';
}

interface ClimateSankeyProps {
  country: string;
  iso3: string;
  energyMix: EnergySource[];
  totalCO2?: number;
  className?: string;
}

interface NodeDatum { name: string; type: string }
interface LinkDatum { srcType: string }

type LayoutNode = SankeyNode<NodeDatum, LinkDatum>;
type LayoutLink = SankeyLink<NodeDatum, LinkDatum>;

const NODE_COLORS: Record<string, string> = {
  fossil: '#78716C',
  renewable: '#10B981',
  nuclear: '#8B5CF6',
  electricity: '#3B82F6',
  co2: '#EF4444',
  clean: '#06B6D4',
};

const LINK_COLORS: Record<string, string> = {
  fossil: 'rgba(120,113,108,0.25)',
  renewable: 'rgba(16,185,129,0.25)',
  nuclear: 'rgba(139,92,246,0.25)',
  co2: 'rgba(239,68,68,0.20)',
  clean: 'rgba(6,182,212,0.20)',
};

export function ClimateSankey({
  country, iso3, energyMix, totalCO2, className = '',
}: ClimateSankeyProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);

  const W = 1080;
  const H = 1080;

  useEffect(() => {
    if (!svgRef.current || energyMix.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const ML = 200, MR = 180, MT = 110, MB = 90;
    const iW = W - ML - MR;
    const iH = H - MT - MB;

    // White background
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#FFFFFF');

    // Title
    svg.append('text')
      .attr('x', W / 2).attr('y', 55).attr('text-anchor', 'middle')
      .attr('fill', '#1A1A2E').attr('font-size', 32).attr('font-weight', '700')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text(`${country} — Energy Flow`);

    svg.append('text')
      .attr('x', W / 2).attr('y', 85).attr('text-anchor', 'middle')
      .attr('fill', '#94A3B8').attr('font-size', 18)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('Electricity generation mix and carbon output');

    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`);

    // Find values
    const fossil = energyMix.find(s => s.type === 'fossil');
    const renewable = energyMix.find(s => s.type === 'renewable');
    const nuclear = energyMix.find(s => s.type === 'nuclear');

    const fossilVal = fossil?.value ?? 0;
    const renewableVal = renewable?.value ?? 0;
    const nuclearVal = nuclear?.value ?? 0;
    const totalVal = fossilVal + renewableVal + nuclearVal;
    const cleanVal = renewableVal + nuclearVal;

    // 6 nodes: Fossil(0), Renewable(1), Nuclear(2), Electricity(3), CO2(4), Clean(5)
    const graphNodes: NodeDatum[] = [
      { name: fossil?.source ?? 'Fossil', type: 'fossil' },
      { name: renewable?.source ?? 'Renewable', type: 'renewable' },
      { name: nuclear?.source ?? 'Nuclear & Other', type: 'nuclear' },
      { name: 'Electricity', type: 'electricity' },
      { name: 'CO\u2082 Output', type: 'co2' },
      { name: 'Clean Output', type: 'clean' },
    ];

    const graphLinks = [
      { source: 0, target: 3, value: Math.max(fossilVal, 0.5), srcType: 'fossil' },
      { source: 1, target: 3, value: Math.max(renewableVal, 0.5), srcType: 'renewable' },
      { source: 2, target: 3, value: Math.max(nuclearVal, 0.5), srcType: 'nuclear' },
      { source: 3, target: 4, value: Math.max(fossilVal, 0.5), srcType: 'co2' },
      { source: 3, target: 5, value: Math.max(cleanVal, 0.5), srcType: 'clean' },
    ];

    const sk = d3Sankey<NodeDatum, LinkDatum>()
      .nodeWidth(24)
      .nodePadding(iH * 0.06)
      .extent([[0, 0], [iW, iH]]);

    const { nodes, links } = sk({
      nodes: graphNodes.map(n => ({ ...n })),
      links: graphLinks.map(l => ({ ...l })),
    });

    // Gradient defs
    const defs = svg.append('defs');
    links.forEach((lk: LayoutLink, i: number) => {
      const src = lk.source as LayoutNode;
      const tgt = lk.target as LayoutNode;
      const grad = defs.append('linearGradient')
        .attr('id', `skg-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', (src.x1 ?? 0) + ML)
        .attr('x2', (tgt.x0 ?? 0) + ML);
      const srcColor = LINK_COLORS[lk.srcType] ?? 'rgba(148,163,184,0.2)';
      const tgtColor = LINK_COLORS[tgt.type] ?? 'rgba(148,163,184,0.15)';
      grad.append('stop').attr('offset', '0%').attr('stop-color', srcColor);
      grad.append('stop').attr('offset', '100%').attr('stop-color', tgtColor);
    });

    // Links with animation
    const linkPaths = g.selectAll<SVGPathElement, LayoutLink>('.sk-link')
      .data(links)
      .join('path')
      .attr('class', 'sk-link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (_, i) => `url(#skg-${i})`)
      .attr('stroke-width', (d: LayoutLink) => Math.max(d.width ?? 1, 1))
      .attr('fill', 'none')
      .attr('stroke-opacity', 0);

    linkPaths.transition().delay((_, i) => i * 120 + 200).duration(600).attr('stroke-opacity', 1);

    // Nodes
    g.selectAll<SVGRectElement, LayoutNode>('.sk-node')
      .data(nodes)
      .join('rect')
      .attr('class', 'sk-node')
      .attr('x', (d: LayoutNode) => d.x0 ?? 0)
      .attr('y', (d: LayoutNode) => d.y0 ?? 0)
      .attr('width', (d: LayoutNode) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('height', (d: LayoutNode) => Math.max((d.y1 ?? 0) - (d.y0 ?? 0), 1))
      .attr('fill', (d: LayoutNode) => NODE_COLORS[d.type] ?? '#94A3B8')
      .attr('rx', 6)
      .attr('opacity', 0)
      .transition().delay((_, i) => i * 50).duration(400).attr('opacity', 1);

    // Node labels
    nodes.forEach((nd: LayoutNode, idx: number) => {
      const midY = ((nd.y0 ?? 0) + (nd.y1 ?? 0)) / 2;
      // left column (0-2), middle (3), right column (4-5)
      const isLeft = idx <= 2;
      const isRight = idx >= 4;
      const x = isLeft ? (nd.x0 ?? 0) - 14 : (nd.x1 ?? 0) + 14;
      const anchor = isLeft ? 'end' : 'start';

      g.append('text')
        .attr('x', x).attr('y', midY - 10)
        .attr('text-anchor', anchor).attr('dominant-baseline', 'middle')
        .attr('fill', '#1A1A2E').attr('font-size', 22).attr('font-weight', '600')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(nd.name);

      // Show percentage for source and output nodes
      const pct = isLeft
        ? (nd.value ?? 0)
        : isRight && nd.type === 'co2'
          ? fossilVal
          : isRight && nd.type === 'clean'
            ? cleanVal
            : totalVal;

      if (idx !== 3) { // Skip Electricity node percentage
        g.append('text')
          .attr('x', x).attr('y', midY + 16)
          .attr('text-anchor', anchor).attr('dominant-baseline', 'middle')
          .attr('fill', NODE_COLORS[nd.type] ?? '#4A4A6A').attr('font-size', 20)
          .attr('font-family', 'monospace').attr('font-weight', '700')
          .text(`${pct.toFixed(1)}%`);
      }
    });

    // CO2 badge below the diagram
    if (totalCO2 != null) {
      const bX = W / 2;
      const bY = H - 55;
      svg.append('text')
        .attr('x', bX).attr('y', bY).attr('text-anchor', 'middle')
        .attr('fill', '#EF4444').attr('font-size', 22).attr('font-weight', '700')
        .attr('font-family', 'monospace')
        .text(`${totalCO2.toFixed(1)} t CO\u2082e per capita`);
    }

    // Watermark
    svg.append('text')
      .attr('x', W - 28).attr('y', H - 22).attr('text-anchor', 'end')
      .attr('fill', '#C8C8D0').attr('font-size', 18)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('visualclimate.org');

  }, [country, energyMix, totalCO2]);

  const handleExport = useCallback(async () => {
    if (!svgRef.current || exporting) return;
    setExporting(true);
    try {
      await exportSvgAsPng(svgRef.current, `visualclimate-${iso3.toLowerCase()}-sankey.png`, W, H);
    } finally {
      setExporting(false);
    }
  }, [iso3, exporting]);

  if (energyMix.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label={`${country} energy flow Sankey diagram`}
      />
      <button
        onClick={handleExport}
        disabled={exporting}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] shadow transition-all hover:bg-white hover:shadow-md disabled:opacity-50"
        title="Download as 1080x1080 PNG"
      >
        {exporting ? '\u2026' : '\u2193 PNG'}
      </button>
    </div>
  );
}
