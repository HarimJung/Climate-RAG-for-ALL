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
    'A+': '#00A67E', 'A': '#00A67E', 'B+': '#3B82F6', 'B': '#3B82F6',
    'C+': '#F59E0B', 'C': '#F59E0B', 'D': '#EF4444', 'F': '#991B1B',
};
const GRADE_BG: Record<string, string> = {
    'A+': '#ECFDF5', 'A': '#ECFDF5', 'B+': '#EFF6FF', 'B': '#EFF6FF',
    'C+': '#FFFBEB', 'C': '#FFFBEB', 'D': '#FEF2F2', 'F': '#FFF1F2',
};

const CLASS_COLOR: Record<string, string> = {
    Changer: '#00A67E', Starter: '#F59E0B', Talker: '#E5484D',
};
const CLASS_BG: Record<string, string> = {
    Changer: '#ECFDF5', Starter: '#FFFBEB', Talker: '#FEF2F2',
};

const PRESETS = [
    { label: 'Top Emitters',     countries: 'CHN,USA,IND,RUS,JPN' },
    { label: 'Europe vs Asia',   countries: 'DEU,FRA,GBR,KOR,JPN' },
    { label: 'BRICS',            countries: 'BRA,RUS,IND,CHN,ZAF' },
    { label: 'Vulnerable Nations', countries: 'BGD,NGA,EGY,IDN' },
];

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

// ── Radar Chart ─────────────────────────────────────────────────────────────

function RadarChart({ countries }: { countries: CountryCompareData[] }) {
    const cx = 160, cy = 160, r = 120;
    const n = 5;
    const step = (2 * Math.PI) / n;
    const start = -Math.PI / 2;

    const axes = DOMAIN_META.map((d, i) => {
        const angle = start + i * step;
        return {
            ...d,
            cos: Math.cos(angle),
            sin: Math.sin(angle),
            labelX: cx + (r + 28) * Math.cos(angle),
            labelY: cy + (r + 28) * Math.sin(angle),
        };
    });

    const gridRings = [0.25, 0.5, 0.75, 1].map(frac =>
        axes.map(a => `${cx + r * frac * a.cos},${cy + r * frac * a.sin}`).join(' ')
    );

    return (
        <svg viewBox="0 0 320 320" className="w-full max-w-[360px]">
            {/* Grid rings */}
            {gridRings.map((pts, i) => (
                <polygon key={i} points={pts} fill="none" stroke="#E5E5E0"
                    strokeWidth={i === 3 ? '1' : '0.5'} strokeDasharray={i < 3 ? '3 3' : 'none'} />
            ))}
            {/* Axis lines */}
            {axes.map((a, i) => (
                <line key={i} x1={cx} y1={cy} x2={cx + r * a.cos} y2={cy + r * a.sin} stroke="#E5E5E0" strokeWidth="0.5" />
            ))}

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
                        <polygon points={pts} fill={color} fillOpacity={0.08} stroke={color} strokeWidth={2} />
                        {scores.map((s, i) => (
                            <circle key={i} cx={cx + r * (s / 100) * axes[i].cos}
                                cy={cy + r * (s / 100) * axes[i].sin}
                                r={3.5} fill={color} stroke="white" strokeWidth={1.5} />
                        ))}
                    </g>
                );
            })}

            {/* Axis labels */}
            {axes.map((a, i) => (
                <text key={i} x={a.labelX} y={a.labelY} textAnchor="middle" dominantBaseline="middle"
                    fontSize="10" fontWeight="600" fill="#6B7280">
                    {DOMAIN_META[i].label}
                </text>
            ))}
        </svg>
    );
}

// ── CSV Download ─────────────────────────────────────────────────────────────

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

// ── Country Score Card ──────────────────────────────────────────────────────

function CountryScoreCard({ country, index }: { country: CountryCompareData; index: number }) {
    const color = CHART_COLORS[index % CHART_COLORS.length];
    return (
        <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            {/* Color accent + flag + name */}
            <div className="flex items-start gap-3">
                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none">{iso3ToFlag(country.iso3)}</span>
                        <div className="min-w-0">
                            <p className="text-[15px] font-semibold text-[--text-primary] truncate">{country.name}</p>
                            <p className="text-[11px] text-[--text-muted]">{country.region}</p>
                        </div>
                    </div>
                </div>
                {/* Grade badge */}
                {country.domain.grade && (
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                            style={{ backgroundColor: GRADE_BG[country.domain.grade], color: GRADE_COLOR[country.domain.grade] }}>
                            {country.domain.grade}
                        </span>
                        {country.domain.total != null && (
                            <span className="font-mono text-[10px] font-medium text-[--text-muted]">
                                {country.domain.total.toFixed(0)}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Class badge */}
            {country.domain.climateClass && (
                <div className="mt-3 ml-4">
                    <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: CLASS_BG[country.domain.climateClass], color: CLASS_COLOR[country.domain.climateClass] }}>
                        {country.domain.climateClass}
                    </span>
                </div>
            )}

            {/* Domain mini bars */}
            <div className="mt-4 space-y-2">
                {DOMAIN_META.map(d => {
                    const val = country.domain[d.key as keyof typeof country.domain];
                    const score = typeof val === 'number' ? val : 0;
                    return (
                        <div key={d.key} className="flex items-center gap-2">
                            <span className="w-[72px] shrink-0 text-[10px] text-[--text-muted]">{d.label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: d.color }} />
                            </div>
                            <span className="w-7 text-right font-mono text-[10px] font-medium text-[--text-primary]">
                                {typeof val === 'number' ? val.toFixed(0) : '\u2014'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ── Main Component ──────────────────────────────────────────────────────────

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

    const hasData = data.length > 0;

    return (
        <div className="min-h-screen">
            {/* ── Hero / Page Intro ────────────────────────────────────────────── */}
            <section className="hero-gradient px-6 pb-8 pt-28 sm:pt-32">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">Compare</p>
                    <h1 className="mt-2 text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-[--text-primary] sm:text-[2.75rem]">
                        Side-by-side climate comparison
                    </h1>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[--text-secondary]">
                        Compare up to 5 countries across domain scores and raw indicators. Who leads on energy? Who lags on emissions?
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
                {/* ── Country Selector ─────────────────────────────────────────── */}
                <div className="-mt-4 rounded-2xl border border-[--border-card] bg-white p-5 sm:p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                    {/* Selected pills */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {data.map((c, i) => (
                            <span key={c.iso3}
                                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm"
                                style={{ borderColor: `${CHART_COLORS[i % CHART_COLORS.length]}40`, backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}08` }}
                            >
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                {iso3ToFlag(c.iso3)} <span className="font-medium text-[--text-primary]">{c.name}</span>
                                {c.domain.grade && (
                                    <span className="font-mono text-xs font-bold" style={{ color: GRADE_COLOR[c.domain.grade] }}>{c.domain.grade}</span>
                                )}
                                <button onClick={() => removeCountry(c.iso3)} className="ml-0.5 text-[--text-muted] hover:text-[--accent-negative] transition-colors">&times;</button>
                            </span>
                        ))}
                        {selected.length === 0 && (
                            <span className="text-[--text-muted] text-sm py-1.5">Select up to 5 countries to compare</span>
                        )}
                        {selected.length > 0 && selected.length < 5 && (
                            <span className="text-[11px] text-[--text-muted]">{5 - selected.length} more available</span>
                        )}
                    </div>

                    {/* Search input */}
                    <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[--text-muted]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Add a country... (e.g. Vietnam, Brazil, KOR)"
                            className="w-full rounded-xl border border-[--border-card] bg-[--bg-section] py-3 pl-10 pr-4 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/30 focus:border-[--accent-primary] focus:bg-white transition-colors"
                        />
                        {search && filtered.length > 0 && (
                            <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-[--border-card] bg-white shadow-lg overflow-hidden">
                                {filtered.map(c => (
                                    <button
                                        key={c.iso3}
                                        onClick={() => { addCountry(c.iso3); setSearch(''); }}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[--text-primary] hover:bg-[--bg-section] transition-colors"
                                    >
                                        <span className="text-lg">{iso3ToFlag(c.iso3)}</span>
                                        <span className="font-medium">{c.name}</span>
                                        <span className="ml-auto text-[11px] text-[--text-muted]">{c.region}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick presets */}
                    {selected.length === 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[--text-muted] self-center mr-1">Quick</span>
                            {PRESETS.map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => navigate(preset.countries.split(','))}
                                    className="rounded-lg border border-[--border-card] bg-[--bg-section] px-3 py-1.5 text-[12px] font-medium text-[--text-secondary] transition-all hover:border-[--accent-primary] hover:text-[--accent-primary] hover:bg-white"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Results ───────────────────────────────────────────────────── */}
                {hasData ? (
                    <div className="mt-8 space-y-8">

                        {/* ── Score Cards + Radar ───────────────────────────────── */}
                        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                            {/* Score cards grid */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {data.map((c, i) => (
                                    <CountryScoreCard key={c.iso3} country={c} index={i} />
                                ))}
                            </div>

                            {/* Radar chart */}
                            <div className="rounded-2xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[--text-muted]">Domain radar</p>
                                        <h2 className="mt-0.5 text-base font-semibold text-[--text-primary]">Score Overlay</h2>
                                    </div>
                                    <button
                                        onClick={() => downloadCsv(data)}
                                        className="rounded-lg border border-[--border-card] px-3 py-1.5 text-[11px] font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
                                    >
                                        Export CSV
                                    </button>
                                </div>
                                <div className="flex justify-center">
                                    <RadarChart countries={data} />
                                </div>
                                {/* Legend */}
                                <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                                    {data.map((c, ci) => (
                                        <div key={c.iso3} className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[ci % CHART_COLORS.length] }} />
                                            <span className="text-[11px] text-[--text-secondary]">{iso3ToFlag(c.iso3)} {c.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Domain Score Table ───────────────────────────────── */}
                        <div className="rounded-2xl border border-[--border-card] bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                            <div className="px-6 py-4 border-b border-[--border-card]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[--text-muted]">Breakdown</p>
                                <h2 className="mt-0.5 text-base font-semibold text-[--text-primary]">Domain Scores</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[--border-card]">
                                            <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[--text-muted]">Domain</th>
                                            {data.map((c, i) => (
                                                <th key={c.iso3} className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em]"
                                                    style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                                                    {iso3ToFlag(c.iso3)} {c.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Total row */}
                                        <tr className="border-b-2 border-[--border-card] bg-[--bg-section]">
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-[--text-primary]">Total Score</span>
                                            </td>
                                            {data.map(c => (
                                                <td key={c.iso3} className="px-5 py-4 text-center">
                                                    <span className="font-mono text-xl font-bold text-[--text-primary]">
                                                        {c.domain.total != null ? c.domain.total.toFixed(1) : '\u2014'}
                                                    </span>
                                                    {c.domain.grade && (
                                                        <span className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold"
                                                            style={{ color: GRADE_COLOR[c.domain.grade], backgroundColor: GRADE_BG[c.domain.grade] }}>
                                                            {c.domain.grade}
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
                                            const validScores = scores.filter((s): s is number => s !== null);
                                            const maxScore = validScores.length > 0 ? Math.max(...validScores) : 0;

                                            return (
                                                <tr key={d.key} className="border-b border-[--border-card]/50">
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                                            <span className="text-[13px] font-medium text-[--text-primary]">{d.label}</span>
                                                        </div>
                                                        <span className="ml-[18px] text-[10px] text-[--text-muted]">{d.weight} weight</span>
                                                    </td>
                                                    {data.map((c, ci) => {
                                                        const score = scores[ci];
                                                        const isTop = score !== null && score === maxScore && data.length > 1;
                                                        return (
                                                            <td key={c.iso3} className="px-5 py-3.5 text-center">
                                                                {score !== null ? (
                                                                    <div>
                                                                        <span className={`font-mono text-lg font-bold ${isTop ? '' : 'text-[--text-primary]'}`}
                                                                            style={isTop ? { color: d.color } : {}}>
                                                                            {score.toFixed(1)}
                                                                        </span>
                                                                        {isTop && data.length > 1 && (
                                                                            <span className="ml-1 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded"
                                                                                style={{ color: d.color, backgroundColor: `${d.color}12` }}>Best</span>
                                                                        )}
                                                                        <div className="mx-auto mt-1.5 h-1 w-16 rounded-full bg-gray-100 overflow-hidden">
                                                                            <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: d.color }} />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[--text-muted]">\u2014</span>
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

                        {/* ── Raw Indicators Table ─────────────────────────────── */}
                        <div className="rounded-2xl border border-[--border-card] bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                            <div className="px-6 py-4 border-b border-[--border-card]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[--text-muted]">Raw data</p>
                                <h2 className="mt-0.5 text-base font-semibold text-[--text-primary]">Indicator Comparison</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[--border-card]">
                                            <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[--text-muted]">Indicator</th>
                                            {data.map((c, i) => (
                                                <th key={c.iso3} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em]"
                                                    style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                                                    {c.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CLIMATE_INDICATORS.map(ind => (
                                            <tr key={ind.code} className="border-b border-[--border-card]/50">
                                                <td className="px-6 py-3.5">
                                                    <span className="text-[13px] font-medium text-[--text-primary]">{ind.name.split('(')[0].trim()}</span>
                                                    <span className="ml-1.5 text-[10px] text-[--text-muted]">{ind.unit}</span>
                                                </td>
                                                {data.map(c => {
                                                    const val = c.indicators[ind.code];
                                                    const barWidth = val ? (val.value / maxValues[ind.code]) * 100 : 0;
                                                    return (
                                                        <td key={c.iso3} className="px-5 py-3.5">
                                                            {val ? (
                                                                <div>
                                                                    <span className="font-mono text-[15px] font-bold text-[--text-primary]">
                                                                        {formatValue(val.value, ind.unit)}
                                                                    </span>
                                                                    <div className="mt-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                                                                        <div className="h-full rounded-full bg-[--accent-primary]/60" style={{ width: `${barWidth}%` }} />
                                                                    </div>
                                                                    <span className="text-[10px] text-[--text-muted]">{val.year}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-[--text-muted]">N/A</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 text-[10px] text-[--text-muted] border-t border-[--border-card]">
                                Source: World Bank, Climate Watch, Ember, ND-GAIN
                            </div>
                        </div>

                        {/* ── Bottom CTA ───────────────────────────────────────── */}
                        <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
                            <Link href="/explore"
                                className="rounded-xl border border-[--border-card] bg-white px-6 py-2.5 text-sm font-medium text-[--text-secondary] transition-all hover:border-[--accent-primary] hover:text-[--accent-primary]">
                                Back to Explore
                            </Link>
                            <Link href="/posters"
                                className="rounded-xl bg-[#0066FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0052CC]">
                                Download Posters
                            </Link>
                        </div>

                        <p className="text-center text-[10px] text-[--text-muted]">
                            visualclimate.org
                        </p>
                    </div>
                ) : (
                    /* ── Empty State ────────────────────────────────────────── */
                    <div className="mt-12 flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[--bg-section]">
                            <svg className="h-7 w-7 text-[--text-muted]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                            </svg>
                        </div>
                        <h2 className="mt-5 text-lg font-semibold text-[--text-primary]">Select countries to compare</h2>
                        <p className="mt-1.5 max-w-xs text-sm text-[--text-secondary]">
                            Search and add up to 5 countries for side-by-side climate performance comparison
                        </p>
                        <div className="mt-8 flex flex-wrap gap-2 justify-center">
                            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[--text-muted] self-center mr-1">Try</span>
                            {PRESETS.map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => navigate(preset.countries.split(','))}
                                    className="rounded-lg border border-[--border-card] bg-white px-4 py-2 text-sm font-medium text-[--text-secondary] transition-all hover:border-[--accent-primary] hover:text-[--accent-primary] hover:shadow-sm"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
