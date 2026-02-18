'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLIMATE_INDICATORS } from '@/lib/constants';
import type { CountryCompareData } from './page';

interface Props {
    initialData: CountryCompareData[];
    allCountries: { iso3: string; name: string; region: string }[];
    selectedIso3: string[];
}

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

function getRank(countries: CountryCompareData[], code: string): Map<string, number> {
    const withValue = countries
        .filter(c => c.indicators[code]?.value != null)
        .sort((a, b) => (b.indicators[code]?.value ?? 0) - (a.indicators[code]?.value ?? 0));
    return new Map(withValue.map((c, i) => [c.iso3, i + 1]));
}

export function CompareClient({ initialData, allCountries, selectedIso3 }: Props) {
    const router = useRouter();
    const [selected, setSelected] = useState<string[]>(selectedIso3);
    const [search, setSearch] = useState('');
    const data = initialData;

    function addCountry(iso3: string) {
        if (selected.includes(iso3) || selected.length >= 5) return;
        const next = [...selected, iso3];
        setSelected(next);
        router.push(`/compare?countries=${next.join(',')}`);
    }

    function removeCountry(iso3: string) {
        const next = selected.filter(s => s !== iso3);
        setSelected(next);
        router.push(next.length > 0 ? `/compare?countries=${next.join(',')}` : '/compare');
    }

    const filtered = allCountries
        .filter(c => !selected.includes(c.iso3))
        .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.iso3.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 8);

    // Find max value per indicator for bar widths
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
                            {c.name}
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
                                    <span className="text-xs text-[--text-muted] w-8">{c.iso3}</span>
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
                    {/* Comparison Table */}
                    <div className="rounded-xl border border-[--border-card] bg-white overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                        <div className="px-6 py-4 border-b border-[--border-card]">
                            <h2 className="text-lg font-semibold text-[--text-primary]">Indicator Comparison</h2>
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
                                    {CLIMATE_INDICATORS.map(ind => {
                                        const ranks = getRank(data, ind.code);
                                        return (
                                            <tr key={ind.code} className="border-b border-[--border-card]/50">
                                                <td className="px-6 py-4">
                                                    <div className="text-[--text-primary] font-medium">{ind.name.split('(')[0].trim()}</div>
                                                    <div className="text-xs text-[--text-muted]">{ind.unit}</div>
                                                </td>
                                                {data.map(c => {
                                                    const val = c.indicators[ind.code];
                                                    const rank = ranks.get(c.iso3);
                                                    const isHighest = rank === 1 && data.length > 1;
                                                    const barWidth = val ? (val.value / maxValues[ind.code]) * 100 : 0;
                                                    return (
                                                        <td key={c.iso3} className="px-6 py-4">
                                                            {val ? (
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-lg font-bold ${isHighest ? 'text-[--accent-primary]' : 'text-[--text-primary]'}`}>
                                                                            {formatValue(val.value, ind.unit)}
                                                                        </span>
                                                                        {isHighest && (
                                                                            <span className="text-xs bg-blue-50 text-[--accent-primary] px-1.5 py-0.5 rounded">#1</span>
                                                                        )}
                                                                    </div>
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 text-xs text-[--text-muted] border-t border-[--border-card]">
                            Source: World Bank, Climate Watch, Ember, ND-GAIN
                        </div>
                    </div>
                </>
            )}

            {data.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">&#127758;</div>
                    <h2 className="text-xl font-semibold text-[--text-primary] mb-2">Select countries to compare</h2>
                    <p className="text-[--text-secondary] mb-8">Search and add up to 5 countries for side-by-side climate indicator comparison</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {[
                            { label: '6 Pilots', countries: 'KOR,USA,DEU,BRA,NGA,BGD' },
                            { label: 'High Emitters', countries: 'USA,DEU,KOR' },
                            { label: 'Vulnerable', countries: 'BGD,NGA,BRA' },
                        ].map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => {
                                    const list = preset.countries.split(',');
                                    setSelected(list);
                                    router.push(`/compare?countries=${preset.countries}`);
                                }}
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
