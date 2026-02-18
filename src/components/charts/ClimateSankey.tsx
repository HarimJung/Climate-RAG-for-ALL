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
  gdpPerCapita?: number;
  className?: string;
}

interface NodeDatum { name: string; type: string }
interface LinkDatum { srcType: string }

type LayoutNode = SankeyNode<NodeDatum, LinkDatum>;
type LayoutLink = SankeyLink<NodeDatum, LinkDatum>;

const NODE_COLORS: Record<string, string> = {
  fossil: '#EF4444', renewable: '#3B82F6', nuclear: '#8B5CF6', output: '#1A1A2E',
};
const LINK_FILL: Record<string, string> = {
  fossil: 'rgba(239,68,68,0.22)',
  renewable: 'rgba(59,130,246,0.22)',
  nuclear: 'rgba(139,92,246,0.22)',
};

export function ClimateSankey({
  country, iso3, energyMix, totalCO2, gdpPerCapita, className = '',
}: ClimateSankeyProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);

  const W = 1080;
  const H = 1080;
  const ML = 210, MR = 200, MT = 110, MB = 100;

  useEffect(() => {
    if (!svgRef.current || energyMix.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const iW = W - ML - MR;
    const iH = H - MT - MB;

    // White background
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#FFFFFF');

    // Title
    svg.append('text')
      .attr('x', W / 2).attr('y', 60).attr('text-anchor', 'middle')
      .attr('fill', '#1A1A2E').attr('font-size', 34).attr('font-weight', '700')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text(`${country} — Electricity Generation Mix`);

    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`);

    // Build node/link arrays
    const sourceNodes: NodeDatum[] = energyMix.map(s => ({ name: s.source, type: s.type }));
    const outNode: NodeDatum = { name: 'Electricity', type: 'output' };
    const graphNodes: NodeDatum[] = [...sourceNodes, outNode];
    const outIdx = graphNodes.length - 1;

    const graphLinks = energyMix.map((s, i) => ({
      source: i,
      target: outIdx,
      value: Math.max(s.value, 0.5),
      srcType: s.type,
    }));

    const sk = d3Sankey<NodeDatum, LinkDatum>()
      .nodeId((d: NodeDatum) => d.name)
      .nodeWidth(28)
      .nodePadding(iH * 0.09)
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
      grad.append('stop').attr('offset', '0%').attr('stop-color', LINK_FILL[src.type] ?? 'rgba(148,163,184,0.2)');
      grad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(26,26,46,0.08)');
    });

    // Links
    const linkPaths = g.selectAll<SVGPathElement, LayoutLink>('.sk-link')
      .data(links)
      .join('path')
      .attr('class', 'sk-link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (_, i) => `url(#skg-${i})`)
      .attr('stroke-width', (d: LayoutLink) => Math.max(d.width ?? 1, 1))
      .attr('fill', 'none')
      .attr('stroke-opacity', 0);

    linkPaths.transition().delay((_, i) => i * 150 + 300).duration(700).attr('stroke-opacity', 1);

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
      .attr('rx', 4)
      .attr('opacity', 0)
      .transition().delay((_, i) => i * 60).duration(400).attr('opacity', 1);

    // Node labels
    nodes.forEach((nd: LayoutNode) => {
      const midY = ((nd.y0 ?? 0) + (nd.y1 ?? 0)) / 2;
      const isSource = nd.name !== 'Electricity';
      const x = isSource ? (nd.x0 ?? 0) - 14 : (nd.x1 ?? 0) + 14;
      const anchor = isSource ? 'end' : 'start';

      g.append('text')
        .attr('x', x).attr('y', midY - 12)
        .attr('text-anchor', anchor).attr('dominant-baseline', 'middle')
        .attr('fill', '#1A1A2E').attr('font-size', 24).attr('font-weight', '600')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(nd.name);

      if (isSource) {
        g.append('text')
          .attr('x', x).attr('y', midY + 18)
          .attr('text-anchor', anchor).attr('dominant-baseline', 'middle')
          .attr('fill', '#4A4A6A').attr('font-size', 22)
          .attr('font-family', 'monospace')
          .text(`${(nd.value ?? 0).toFixed(1)}%`);
      }
    });

    // Stat badges (right of Electricity node)
    const badges = [
      totalCO2 != null && { label: 'CO₂ per capita', value: totalCO2.toFixed(1), unit: 't CO₂e', color: '#EF4444' },
      gdpPerCapita != null && { label: 'GDP per capita', value: `$${(gdpPerCapita / 1000).toFixed(0)}k`, unit: 'USD', color: '#0066FF' },
    ].filter(Boolean) as { label: string; value: string; unit: string; color: string }[];

    const bX = ML + iW + 40;
    badges.forEach((b, i) => {
      const bY = MT + iH * 0.25 + i * 150;
      svg.append('rect').attr('x', bX).attr('y', bY)
        .attr('width', 150).attr('height', 110).attr('rx', 14)
        .attr('fill', '#F8F9FA').attr('stroke', '#E8E8ED').attr('stroke-width', 1);
      svg.append('text').attr('x', bX + 75).attr('y', bY + 28)
        .attr('text-anchor', 'middle').attr('fill', '#94A3B8').attr('font-size', 17)
        .attr('font-family', 'Inter, system-ui, sans-serif').text(b.label);
      svg.append('text').attr('x', bX + 75).attr('y', bY + 66)
        .attr('text-anchor', 'middle').attr('fill', b.color)
        .attr('font-size', 28).attr('font-weight', '700').attr('font-family', 'monospace').text(b.value);
      svg.append('text').attr('x', bX + 75).attr('y', bY + 90)
        .attr('text-anchor', 'middle').attr('fill', '#94A3B8').attr('font-size', 17)
        .attr('font-family', 'Inter, system-ui, sans-serif').text(b.unit);
    });

    // Watermark
    svg.append('text')
      .attr('x', W - 28).attr('y', H - 22).attr('text-anchor', 'end')
      .attr('fill', '#C8C8D0').attr('font-size', 20)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('visualclimate.org');

  }, [country, energyMix, totalCO2, gdpPerCapita, ML, MR, MT, MB]);

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
        aria-label={`${country} electricity generation Sankey`}
      />
      <button
        onClick={handleExport}
        disabled={exporting}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] shadow transition-all hover:bg-white hover:shadow-md disabled:opacity-50"
        title="Download as 1080×1080 PNG"
      >
        {exporting ? '…' : '↓ PNG'}
      </button>
    </div>
  );
}
