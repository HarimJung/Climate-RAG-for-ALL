'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CLIMATE_INDICATORS, CHART_COLORS } from '@/lib/constants';
import { iso3ToFlag } from '@/lib/iso3ToFlag';
import type { CountryCompareData } from './page';

interface Props {
    initialData: CountryCompareData[];
    allCountries: { iso3: string; name: string; region: string }[];
    selectedIso3: string[];
}

const DOMAIN_META = [
    { key: 'emissions',      label: 'Emissions',      weight: '30%', color: '#E5484D' },
    { key: 'energy',         label: 'Energy',          weight: '25%', color: '#0066FF' },
    { key: 'economy',        label: 'Economy',         weight: '15%', color: '#8B5CF6' },
    { key: 'responsibility', label: 'Responsibility',  weight: '15%', color: '#F59E0B' },
    { key: 'resilience',     label: 'Resilience',      weight: '15%', color: '#00A67E' },
] as const;

const GRADE_COLOR: Record<string, string> = {
    'A+': '#10B981', 'A': '#10B981', 'B+': '#3B82F6', 'B': '#3B82F6',
    'C+': '#F59E0B', 'C': '#F59E0B', 'D': '#EF4444', 'F': '#991B1B',
};

const CLASS_COLOR: Record<string, string> = {
    Changer: '#10B981', Starter: '#F59E0B', Talker: '#EF4444',
};

function formatValue(value: number, unit: string): string {
    if (unit === 'US$') {
        if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
        return `$${value.toLocaleString()}`;
    }
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// ── Radar Chart Overlay ───────────────────────────────────────────────────────

function RadarOverlay({ countries }: { countries: CountryCompareData[] }) {
    const cx = 160, cy = 160, r = 110;
    const n = 5;
    const step = (2 * Math.PI) / n;
    const start = -Math.PI / 2;

    const axes = DOMAIN_META.map((d, i) => {
        const angle = start + i * step;
        return {
            ...d,
            cos: Math.cos(angle),
            sin: Math.sin(angle),
            labelX: cx + r * 1.4 * Math.cos(angle),
            labelY: cy + r * 1.4 * Math.sin(angle),
        };
    });

    const outerPts = axes.map(a => `${cx + r * a.cos},${cy + r * a.sin}`).join(' ');
    const gridRings = [0.25, 0.5, 0.75].map(frac =>
        axes.map(a => `${cx + r * frac * a.cos},${cy + r * frac * a.sin}`).join(' ')
    );

    return (
        <div className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="mb-4 text-lg font-semibold text-[--text-primary]">Domain Score Radar</h2>
            <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
                <svg viewBox="0 0 320 320" className="w-full max-w-sm flex-shrink-0">
                    {/* Grid */}
                    {gridRings.map((pts, i) => (
                        <polygon key={i} points={pts} fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
                    ))}
                    {axes.map((a, i) => (
                        <line key={i} x1={cx} y1={cy} x2={cx + r * a.cos} y2={cy + r * a.sin} stroke="#E5E7EB" strokeWidth="1" />
                    ))}
                    <polygon points={outerPts} fill="none" stroke="#D1D5DB" strokeWidth="1.5" />

                    {/* Country polygons */}
                    {countries.map((country, ci) => {
                        const color = CHART_COLORS[ci % CHART_COLORS.length];
                        const scores = DOMAIN_META.map(d => {
                            const val = country.domain[d.key as keyof typeof country.domain];
                            return typeof val === 'number' ? val : 0;
                        });
                        const pts = scores.map((s, i) => {
                            const frac = s / 100;
                            return `${cx + r * frac * axes[i].cos},${cy + r * frac * axes[i].sin}`;
                        }).join(' ');

                        return (
                            <g key={country.iso3}>
                                <polygon
                                    points={pts}
                                    fill={color}
                                    fillOpacity={0.12}
                                    stroke={color}
                                    strokeWidth={2.5}
                                />
                                {scores.map((s, i) => {
                                    const frac = s / 100;
                                    return (
                                        <circle
                                            key={i}
                                            cx={cx + r * frac * axes[i].cos}
                                            cy={cy + r * frac * axes[i].sin}
                                            r={4}
                                            fill={color}
                                            stroke="white"
                                            strokeWidth={2}
                                        />
                                    );
                                })}
                            </g>
                        );
                    })}

                    {/* Labels */}
                    {axes.map((a, i) => (
                        <text key={i} x={a.labelX} y={a.labelY} textAnchor="middle" dominantBaseline="middle"
                            fontSize="11" fontWeight="600" fill={DOMAIN_META[i].color}>
                            {DOMAIN_META[i].label}
                        </text>
                    ))}
                </svg>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 lg:flex-col lg:gap-2 lg:pt-8">
                    {countries.map((c, ci) => (
                        <div key={c.iso3} className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[ci % CHART_COLORS.length] }} />
                            <span className="text-sm text-[--text-primary]">{iso3ToFlag(c.iso3)} {c.name}</span>
                            {c.domain.grade && (
                                <span className="ml-1 rounded px-1.5 py-0.5 text-xs font-bold"
                                    style={{ color: GRADE_COLOR[c.domain.grade] ?? '#6B7280', backgroundColor: '#F3F4F6' }}>
                                    {c.domain.grade}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── CSV Download ──────────────────────────────────────────────────────────────

function downloadCsv(countries: CountryCompareData[]) {
    const domainKeys = DOMAIN_META.map(d => d.key);
    const indicatorCodes = CLIMATE_INDICATORS.map(i => i.code);

    const headers = [
        'Country', 'ISO3', 'Region', 'Grade', 'Class', 'Total Score',
        ...DOMAIN_META.map(d => `${d.label} Score`),
        ...CLIMATE_INDICATORS.map(i => i.name),
    ];

    const rows = countries.map(c => {
        const domainVals = domainKeys.map(k => {
            const v = c.domain[k as keyof typeof c.domain];
            return typeof v === 'number' ? v.toFixed(1) : '';
        });
        const indicatorVals = indicatorCodes.map(code => {
            const v = c.indicators[code];
            return v ? v.value.toString() : '';
        });
        return [
            c.name, c.iso3, c.region,
            c.domain.grade ?? '', c.domain.climateClass ?? '',
            c.domain.total != null ? c.domain.total.toFixed(1) : '',
            ...domainVals, ...indicatorVals,
        ];
    });

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualclimate-compare-${countries.map(c => c.iso3).join('-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CompareClient({ initialData, allCountries, selectedIso3 }: Props) {
    const router = useRouter();
    const [selected, setSelected] = useState<string[]>(selectedIso3);
    const [search, setSearch] = useState('');
    const data = initialData;

    const navigate = useCallback((next: string[]) => {
        setSelected(next);
        router.push(next.length > 0 ? `/compare?countries=${next.join(',')}` : '/compare');
    }, [router]);

    function addCountry(iso3: string) {
        if (selected.includes(iso3) || selected.length >= 5) return;
        navigate([...selected, iso3]);
    }

    function removeCountry(iso3: string) {
        navigate(selected.filter(s => s !== iso3));
    }

    const filtered = allCountries
        .filter(c => !selected.includes(c.iso3))
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.iso3.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 8);

    const maxValues: Record<string, number> = {};
    for (const ind of CLIMATE_INDICATORS) {
        maxValues[ind.code] = Math.max(...data.map(c => c.indicators[ind.code]?.value ?? 0), 1);
    }

    return (
        <div className="space-y-8">
            {/* Country Selector */}
            <div className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex flex-wrap gap-2 mb-4">
                    {data.map(c => (
                        <span key={c.iso3} className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-[--accent-primary]">
                            {iso3ToFlag(c.iso3)} {c.name}
                            {c.domain.grade && (
                                <span className="font-bold" style={{ color: GRADE_COLOR[c.domain.grade] }}>{c.domain.grade}</span>
                            )}
                            <button onClick={() => removeCountry(c.iso3)} className="ml-1 text-blue-400 hover:text-[--accent-negative]">&times;</button>
                        </span>
                    ))}
                    {selected.length === 0 && (
                        <span className="text-[--text-muted] text-sm py-2">Select up to 5 countries to compare</span>
                    )}
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search countries... (e.g. Vietnam, Brazil, KOR)"
                        className="w-full rounded-lg border border-[--border-card] bg-white px-4 py-3 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]"
                    />
                    {search && filtered.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[--border-card] bg-white shadow-xl">
                            {filtered.map(c => (
                                <button
                                    key={c.iso3}
                                    onClick={() => { addCountry(c.iso3); setSearch(''); }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[--text-secondary] hover:bg-[--bg-section]"
                                >
                                    <span className="text-lg">{iso3ToFlag(c.iso3)}</span>
                                    <span>{c.name}</span>
                                    <span className="ml-auto text-xs text-[--text-muted]">{c.region}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {data.length > 0 && (
                <>
                    {/* Radar Overlay */}
                    <RadarOverlay countries={data} />

                    {/* Domain Score Comparison */}
                    <div className="rounded-xl border border-[--border-card] bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                        <div className="px-6 py-4 border-b border-[--border-card] flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[--text-primary]">Domain Scores</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => downloadCsv(data)}
                                    className="rounded-lg border border-[--border-card] px-4 py-2 text-xs font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
                                >
                                    Download CSV
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[--border-card]">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[--text-muted] uppercase tracking-wider">Domain</th>
                                        {data.map(c => (
                                            <th key={c.iso3} className="px-6 py-3 text-center text-xs font-medium text-[--text-secondary] uppercase tracking-wider">
                                                {iso3ToFlag(c.iso3)} {c.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Total row */}
                                    <tr className="border-b-2 border-[--border-card] bg-[--bg-section]">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[--text-primary]">Total Score</div>
                                        </td>
                                        {data.map(c => (
                                            <td key={c.iso3} className="px-6 py-4 text-center">
                                                <div className="font-mono text-2xl font-bold text-[--text-primary]">
                                                    {c.domain.total != null ? c.domain.total.toFixed(1) : '—'}
                                                </div>
                                                {c.domain.grade && (
                                                    <span className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold"
                                                        style={{ color: GRADE_COLOR[c.domain.grade], backgroundColor: '#F3F4F6' }}>
                                                        {c.domain.grade}
                                                    </span>
                                                )}
                                                {c.domain.climateClass && (
                                                    <span className="ml-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                                                        style={{ color: CLASS_COLOR[c.domain.climateClass], backgroundColor: '#F9FAFB' }}>
                                                        {c.domain.climateClass}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Domain rows */}
                                    {DOMAIN_META.map(d => {
                                        const scores = data.map(c => {
                                            const v = c.domain[d.key as keyof typeof c.domain];
                                            return typeof v === 'number' ? v : null;
                                        });
                                        const maxScore = Math.max(...scores.filter((s): s is number => s !== null), 1);

                                        return (
                                            <tr key={d.key} className="border-b border-[--border-card]/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                                                        <span className="font-medium text-[--text-primary]">{d.label}</span>
                                                    </div>
                                                    <div className="text-xs text-[--text-muted]">{d.weight} weight</div>
                                                </td>
                                                {data.map((c, ci) => {
                                                    const score = scores[ci];
                                                    const isTop = score !== null && score === maxScore && data.length > 1;
                                                    return (
                                                        <td key={c.iso3} className="px-6 py-4 text-center">
                                                            {score !== null ? (
                                                                <div>
                                                                    <span className={`font-mono text-xl font-bold ${isTop ? '' : 'text-[--text-primary]'}`}
                                                                        style={isTop ? { color: d.color } : {}}>
                                                                        {score.toFixed(1)}
                                                                    </span>
                                                                    {isTop && data.length > 1 && (
                                                                        <span className="ml-1 text-xs px-1.5 py-0.5 rounded" style={{ color: d.color, backgroundColor: `${d.color}18` }}>Best</span>
                                                                    )}
                                                                    <div className="mx-auto mt-2 h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
                                                                        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: d.color }} />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[--text-muted]">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Indicator Comparison Table */}
                    <div className="rounded-xl border border-[--border-card] bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                        <div className="px-6 py-4 border-b border-[--border-card]">
                            <h2 className="text-lg font-semibold text-[--text-primary]">Raw Indicators</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[--border-card]">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[--text-muted] uppercase tracking-wider">Indicator</th>
                                        {data.map(c => (
                                            <th key={c.iso3} className="px-6 py-3 text-left text-xs font-medium text-[--text-secondary] uppercase tracking-wider">
                                                {c.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {CLIMATE_INDICATORS.map(ind => (
                                        <tr key={ind.code} className="border-b border-[--border-card]/50">
                                            <td className="px-6 py-4">
                                                <div className="text-[--text-primary] font-medium">{ind.name.split('(')[0].trim()}</div>
                                                <div className="text-xs text-[--text-muted]">{ind.unit}</div>
                                            </td>
                                            {data.map(c => {
                                                const val = c.indicators[ind.code];
                                                const barWidth = val ? (val.value / maxValues[ind.code]) * 100 : 0;
                                                return (
                                                    <td key={c.iso3} className="px-6 py-4">
                                                        {val ? (
                                                            <div>
                                                                <span className="text-lg font-bold text-[--text-primary]">
                                                                    {formatValue(val.value, ind.unit)}
                                                                </span>
                                                                <div className="mt-1 h-1.5 rounded-full bg-[--bg-section] overflow-hidden">
                                                                    <div className="h-full rounded-full bg-[--accent-primary]" style={{ width: `${barWidth}%` }} />
                                                                </div>
                                                                <div className="text-xs text-[--text-muted] mt-1">{val.year}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[--text-muted]">N/A</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 text-xs text-[--text-muted] border-t border-[--border-card]">
                            Source: World Bank, Climate Watch, Ember, ND-GAIN
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href="/explore"
                            className="rounded-lg border border-[--border-card] bg-white px-6 py-2.5 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
                        >
                            Back to Explore
                        </Link>
                        <Link
                            href="/posters"
                            className="rounded-lg bg-[#0066FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0052CC]"
                        >
                            Download Posters
                        </Link>
                    </div>
                </>
            )}

            {data.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">&#127758;</div>
                    <h2 className="text-xl font-semibold text-[--text-primary] mb-2">Select countries to compare</h2>
                    <p className="text-[--text-secondary] mb-8">Search and add up to 5 countries for side-by-side climate comparison</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {[
                            { label: 'Top Emitters', countries: 'CHN,USA,IND,RUS,JPN' },
                            { label: 'Europe vs Asia', countries: 'DEU,FRA,GBR,KOR,JPN' },
                            { label: 'BRICS', countries: 'BRA,RUS,IND,CHN,ZAF' },
                            { label: 'Vulnerable Nations', countries: 'BGD,NGA,EGY,IDN' },
                        ].map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => navigate(preset.countries.split(','))}
                                className="rounded-lg border border-[--border-card] px-4 py-2 text-sm text-[--text-secondary] hover:border-[--accent-primary] hover:text-[--accent-primary]"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
