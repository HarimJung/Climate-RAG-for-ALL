'use client';

import { LineChart } from '@/components/charts/LineChart';

interface CountryClientProps {
    ghgData: { year: number; value: number }[];
    countryName: string;
}

export function CountryClient({ ghgData, countryName }: CountryClientProps) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <LineChart
                data={ghgData}
                title={`${countryName} GHG Emissions Trend (2000-2023)`}
                unit="MtCO2e"
            />
        </div>
    );
}
