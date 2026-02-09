'use client';

import { useState } from 'react';
import { CLIMATE_INDICATORS } from '@/lib/constants';

interface IndicatorSelectorProps {
    value: string;
    onChange: (code: string) => void;
}

export function IndicatorSelector({ value, onChange }: IndicatorSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = CLIMATE_INDICATORS.find(i => i.code === value) || CLIMATE_INDICATORS[0];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-left text-white hover:border-slate-600 md:w-80"
            >
                <span className="truncate">{selected.name}</span>
                <svg className={`ml-2 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl md:w-96">
                    {CLIMATE_INDICATORS.map((indicator) => (
                        <button
                            key={indicator.code}
                            onClick={() => {
                                onChange(indicator.code);
                                setIsOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 ${indicator.code === value ? 'bg-slate-700 text-emerald-400' : 'text-slate-300'
                                }`}
                        >
                            {indicator.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
