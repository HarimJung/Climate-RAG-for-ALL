'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface BarChartProps {
    data: { iso3: string; name: string; value: number }[];
    unit: string;
    title: string;
}

export function BarChart({ data, unit, title }: BarChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.length === 0) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 500;
        const margin = { top: 30, right: 30, bottom: 60, left: 180 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        svg.selectAll('*').remove();

        const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 20);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.value) || 0])
            .range([0, innerWidth]);

        const yScale = d3.scaleBand()
            .domain(sortedData.map(d => d.name))
            .range([0, innerHeight])
            .padding(0.2);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Bars
        g.selectAll('rect')
            .data(sortedData)
            .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', d => yScale(d.name) || 0)
            .attr('width', d => xScale(d.value))
            .attr('height', yScale.bandwidth())
            .attr('fill', '#10b981')
            .attr('rx', 4)
            .attr('cursor', 'pointer')
            .on('mouseenter', function () {
                d3.select(this).attr('fill', '#34d399');
            })
            .on('mouseleave', function () {
                d3.select(this).attr('fill', '#10b981');
            })
            .on('click', (_, d) => {
                window.location.href = `/country/${d.iso3}`;
            });

        // Values
        g.selectAll('.value-label')
            .data(sortedData)
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => xScale(d.value) + 5)
            .attr('y', d => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('fill', '#94a3b8')
            .attr('font-size', '11px')
            .text(d => d.value.toLocaleString());

        // Y Axis
        g.append('g')
            .call(d3.axisLeft(yScale).tickSize(0))
            .selectAll('text')
            .attr('fill', '#94a3b8')
            .attr('font-size', '12px');

        g.select('.domain').remove();

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#e2e8f0')
            .attr('font-size', '14px')
            .attr('font-weight', '600')
            .text(title);

        // Unit label
        svg.append('text')
            .attr('x', width - margin.right)
            .attr('y', height - 10)
            .attr('text-anchor', 'end')
            .attr('fill', '#64748b')
            .attr('font-size', '11px')
            .text(`Unit: ${unit}`);

    }, [data, unit, title]);

    return (
        <div ref={containerRef} className="w-full">
            <svg ref={svgRef} className="w-full" />
        </div>
    );
}
