'use client';

import { useState } from 'react';
import { WorldMap } from '@/components/charts/WorldMap';
import { BarChart } from '@/components/charts/BarChart';
import { IndicatorSelector } from '@/components/IndicatorSelector';
import { CLIMATE_INDICATORS } from '@/lib/constants';

interface DashboardClientProps {
    indicatorData: Record<string, { iso3: string; name: string; value: number; year: number }[]>;
    lastUpdated: string;
}

export function DashboardClient({ indicatorData, lastUpdated }: DashboardClientProps) {
    const [selectedIndicator, setSelectedIndicator] = useState<string>(CLIMATE_INDICATORS[0].code);

    const currentIndicator = CLIMATE_INDICATORS.find(i => i.code === selectedIndicator) || CLIMATE_INDICATORS[0];
    const currentData = indicatorData[selectedIndicator] || [];

    // Get GHG data for bar chart (TOTAL_GHG or CO2)
    const ghgData = indicatorData['TOTAL_GHG'] || indicatorData['EN.ATM.CO2E.PC'] || [];

    return (
        <div className="space-y-12">
            {/* Indicator Selector */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Global Climate Indicators</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Select an indicator to visualize data across 200+ countries
                    </p>
                </div>
                <IndicatorSelector value={selectedIndicator} onChange={setSelectedIndicator} />
            </div>

            {/* World Map */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <WorldMap
                    data={currentData.map(d => ({ iso3: d.iso3, name: d.name, value: d.value }))}
                    indicatorName={currentIndicator.name}
                    unit={currentIndicator.unit}
                />
            </div>

            {/* Bar Chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <BarChart
                    data={ghgData.map(d => ({ label: d.name, value: d.value, href: `/country/${d.iso3}` }))}
                    unit={selectedIndicator === 'TOTAL_GHG' ? 'MtCO2e' : currentIndicator.unit}
                    title="Top 20 Countries by GHG Emissions"
                />
            </div>

            {/* Source Attribution */}
            <div className="text-center text-sm text-slate-500">
                Source: World Bank, Climate Watch. Last updated: {lastUpdated}
            </div>
        </div>
    );
}
