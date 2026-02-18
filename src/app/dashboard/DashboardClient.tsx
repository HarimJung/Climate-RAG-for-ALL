'use client';

import { useState } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { IndicatorSelector } from '@/components/IndicatorSelector';
import { CLIMATE_INDICATORS, CHART_COLORS } from '@/lib/constants';

const COUNTRY_NAMES: Record<string, string> = {
    KOR: 'South Korea', USA: 'United States', DEU: 'Germany',
    BRA: 'Brazil', NGA: 'Nigeria', BGD: 'Bangladesh',
};

interface DashboardClientProps {
    indicatorData: Record<string, { iso3: string; name: string; value: number; year: number }[]>;
    lastUpdated: string;
}

export function DashboardClient({ indicatorData, lastUpdated }: DashboardClientProps) {
    const [selectedIndicator, setSelectedIndicator] = useState<string>(CLIMATE_INDICATORS[0].code);

    const currentIndicator = CLIMATE_INDICATORS.find(i => i.code === selectedIndicator) || CLIMATE_INDICATORS[0];
    const currentData = (indicatorData[selectedIndicator] || []).map((d, i) => ({
        label: COUNTRY_NAMES[d.iso3] || d.iso3,
        value: d.value,
        color: CHART_COLORS[i % CHART_COLORS.length],
        href: `/country/${d.iso3}`,
    }));

    return (
        <div className="space-y-12">
            {/* Indicator Selector */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-[--text-primary]">Climate Indicators</h2>
                    <p className="mt-1 text-sm text-[--text-secondary]">
                        Select an indicator to compare across 6 pilot countries
                    </p>
                </div>
                <IndicatorSelector value={selectedIndicator} onChange={setSelectedIndicator} />
            </div>

            {/* Bar Chart */}
            <div className="rounded-xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                <BarChart
                    data={currentData}
                    unit={currentIndicator.unit}
                    title={`${currentIndicator.name} by Country`}
                />
            </div>

            {/* All Indicators Overview */}
            <div>
                <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">All Indicators at a Glance</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {CLIMATE_INDICATORS.map((ind) => {
                        const rows = (indicatorData[ind.code] || []).map((d, i) => ({
                            label: COUNTRY_NAMES[d.iso3] || d.iso3,
                            value: d.value,
                            color: CHART_COLORS[i % CHART_COLORS.length],
                            href: `/country/${d.iso3}`,
                        }));
                        return (
                            <div key={ind.code} className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                                <h3 className="mb-3 text-sm font-medium text-[--text-secondary]">{ind.name}</h3>
                                {rows.length > 0 ? (
                                    <BarChart data={rows} unit={ind.unit} height={240} />
                                ) : (
                                    <p className="py-8 text-center text-sm text-[--text-muted]">No data available</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Source Attribution */}
            <div className="text-center text-sm text-[--text-muted]">
                Source: World Bank, Climate Watch, Ember, ND-GAIN. Last updated: {lastUpdated}
            </div>
        </div>
    );
}
