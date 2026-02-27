'use client';

import { motion, LayoutGroup } from 'framer-motion';
import { LayoutGrid, Focus, Columns2 } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */

export type ViewMode = 'grid' | 'focus' | 'compare';
export type FilterType = 'all' | string;

interface CountryMeta { iso3: string; name: string; adj: string; flag: string }

interface ToolbarProps {
  activeCategory: FilterType;
  onCategoryChange: (category: FilterType) => void;
  activeCountry: string;
  onCountryChange: (iso3: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  countriesList: CountryMeta[];
  categories: { value: string; label: string }[];
}

/* ── View mode config ───────────────────────────────────────────────────── */

const viewModes: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
  { mode: 'focus', icon: Focus, label: 'Focus' },
  { mode: 'compare', icon: Columns2, label: 'Compare' },
];

/* ── Toolbar Component ──────────────────────────────────────────────────── */

export function Toolbar({
  activeCategory,
  onCategoryChange,
  activeCountry,
  onCountryChange,
  viewMode,
  onViewModeChange,
  countriesList,
  categories,
}: ToolbarProps) {
  return (
    <div className="sticky top-[65px] z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Category pills */}
          <LayoutGroup>
            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => onCategoryChange(cat.value)}
                  className="relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {activeCategory === cat.value && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 rounded-full bg-slate-900"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      activeCategory === cat.value
                        ? 'text-white'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </LayoutGroup>

          {/* Right side: Country + View modes */}
          <div className="flex items-center gap-3">
            <select
              value={activeCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
            >
              {countriesList.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-xl border border-slate-200 p-0.5">
              {viewModes.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    viewMode === mode
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  aria-label={`${label} view`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
