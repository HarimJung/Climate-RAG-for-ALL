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

const INDICATOR_META = [
    ...CLIMATE_INDICATORS,
    { code: 'TOTAL_GHG', name: 'Total GHG Emissions', unit: 'MtCO2e', category: 'emissions', source: 'climatewatch' as const },
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
    for (const ind of INDICATOR_META) {
        maxValues[ind.code] = Math.max(...data.map(c => c.indicators[ind.code]?.value ?? 0), 1);
    }

    return (
        <div className="space-y-8">
            {/* Country Selector */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                    {data.map(c => (
                        <span key={c.iso3} className="inline-flex items-center gap-2 rounded-full bg-emerald-900/40 border border-emerald-700/50 px-4 py-2 text-sm text-emerald-300">
                            {c.flag_url && <img src={c.flag_url} alt="" className="h-4 w-6 rounded-sm object-cover" />}
                            {c.name}
                            <button onClick={() => removeCountry(c.iso3)} className="ml-1 text-emerald-500 hover:text-white">&times;</button>
                        </span>
                    ))}
                    {selected.length === 0 && (
                        <span className="text-slate-500 text-sm py-2">Select up to 5 countries to compare</span>
                    )}
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search countries... (e.g. Vietnam, Brazil, KOR)"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {search && filtered.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
                            {filtered.map(c => (
                                <button
                                    key={c.iso3}
                                    onClick={() => { addCountry(c.iso3); setSearch(''); }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700"
                                >
                                    <span className="text-xs text-slate-500 w-8">{c.iso3}</span>
                                    <span>{c.name}</span>
                                    <span className="ml-auto text-xs text-slate-600">{c.region}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {data.length > 0 && (
                <>
                    {/* Comparison Table */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800">
                            <h2 className="text-lg font-semibold text-white">Indicator Comparison</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Indicator</th>
                                        {data.map(c => (
                                            <th key={c.iso3} className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                {c.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {INDICATOR_META.map(ind => {
                                        const ranks = getRank(data, ind.code);
                                        return (
                                            <tr key={ind.code} className="border-b border-slate-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-300 font-medium">{ind.name.split('(')[0].trim()}</div>
                                                    <div className="text-xs text-slate-600">{ind.unit}</div>
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
                                                                        <span className={`text-lg font-bold ${isHighest ? 'text-emerald-400' : 'text-white'}`}>
                                                                            {formatValue(val.value, ind.unit)}
                                                                        </span>
                                                                        {isHighest && (
                                                                            <span className="text-xs bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded">#1</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                                                        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${barWidth}%` }} />
                                                                    </div>
                                                                    <div className="text-xs text-slate-600 mt-1">{val.year}</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-600">N/A</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    {/* Population row */}
                                    <tr className="border-b border-slate-800/50">
                                        <td className="px-6 py-4">
                                            <div className="text-slate-300 font-medium">Population</div>
                                        </td>
                                        {data.map(c => (
                                            <td key={c.iso3} className="px-6 py-4">
                                                <span className="text-lg font-bold text-white">
                                                    {c.population ? (c.population / 1e6).toFixed(1) + 'M' : 'N/A'}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 text-xs text-slate-600 border-t border-slate-800">
                            Source: World Bank, Climate Watch · Data may lag 1–3 years
                        </div>
                    </div>

                </>
            )}

            {data.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">&#127758;</div>
                    <h2 className="text-xl font-semibold text-white mb-2">Select countries to compare</h2>
                    <p className="text-slate-400 mb-8">Search and add up to 5 countries for side-by-side climate risk analysis</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {[
                            { label: 'ASEAN', countries: 'VNM,IDN,PHL,THA,MYS' },
                            { label: 'BRICS', countries: 'BRA,RUS,IND,CHN,ZAF' },
                            { label: 'EU Big 4', countries: 'DEU,FRA,ITA,ESP' },
                            { label: 'East Asia', countries: 'KOR,JPN,CHN,TWN' },
                        ].map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => {
                                    const list = preset.countries.split(',');
                                    setSelected(list);
                                    router.push(`/compare?countries=${preset.countries}`);
                                }}
                                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-emerald-600 hover:text-emerald-400"
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
