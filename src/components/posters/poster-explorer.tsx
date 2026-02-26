'use client';

import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

/* ── Types ───────────────────────────────────────────────────────────────── */

export type PosterType = 'energy' | 'inequality' | 'gap' | 'air' | 'race' | 'scoreboard';
export type ViewMode = 'grid' | 'one-by-one' | 'comparison';
export type FilterType = 'all' | PosterType;

interface CountryMeta { iso3: string; name: string; adj: string; flag: string }

export interface PosterDef {
  id: PosterType;
  title: string;
  category: string;
  categoryColor: string;
}

export const POSTER_DEFS: PosterDef[] = [
  { id: 'scoreboard',  title: 'World Scoreboard',  category: 'Global',     categoryColor: '#0066FF' },
  { id: 'energy',      title: 'Energy Flow',       category: 'Energy',     categoryColor: '#10B981' },
  { id: 'gap',         title: 'Paris Gap',         category: 'Emissions',  categoryColor: '#F59E0B' },
  { id: 'race',        title: 'Transition Race',   category: 'Energy',     categoryColor: '#10B981' },
  { id: 'inequality',  title: 'Carbon Inequality', category: 'Emissions',  categoryColor: '#EF4444' },
  { id: 'air',         title: 'Air Quality',       category: 'Health',     categoryColor: '#8B5CF6' },
];

/* ── View mode toggle ────────────────────────────────────────────────────── */

const VIEW_MODES: { id: ViewMode; label: string; icon: ReactNode }[] = [
  {
    id: 'grid',
    label: 'Grid',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: 'one-by-one',
    label: 'Focus',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v3.776" />
      </svg>
    ),
  },
  {
    id: 'comparison',
    label: 'Compare',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
];

function ViewModeToggle({ mode, setMode }: { mode: ViewMode; setMode: (m: ViewMode) => void }) {
  return (
    <div className="relative flex rounded-xl bg-[#F8F9FA] p-1 ring-1 ring-black/[0.06]">
      {VIEW_MODES.map(vm => (
        <button
          key={vm.id}
          onClick={() => setMode(vm.id)}
          className={`relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === vm.id ? 'text-[#0066FF]' : 'text-[#8888A0] hover:text-[#4A4A6A]'
          }`}
        >
          {mode === vm.id && (
            <motion.div
              layoutId="viewmode-pill"
              className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-black/[0.06]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{vm.icon}</span>
          <span className="relative z-10 hidden sm:inline">{vm.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Category filter pills ───────────────────────────────────────────────── */

const CATEGORIES: { id: FilterType; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'scoreboard',  label: 'Global' },
  { id: 'energy',      label: 'Energy' },
  { id: 'gap',         label: 'Paris Gap' },
  { id: 'race',        label: 'Race' },
  { id: 'inequality',  label: 'Inequality' },
  { id: 'air',         label: 'Air Quality' },
];

function CategoryFilter({ active, setActive }: { active: FilterType; setActive: (f: FilterType) => void }) {
  return (
    <LayoutGroup>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              active === cat.id
                ? 'text-white'
                : 'bg-white text-[#4A4A6A] ring-1 ring-[#E8E8ED] hover:ring-[#0066FF] hover:text-[#0066FF]'
            }`}
          >
            {active === cat.id && (
              <motion.div
                layoutId="filter-pill"
                className="absolute inset-0 rounded-full bg-[#0066FF]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{cat.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/* ── Country selector ────────────────────────────────────────────────────── */

function CountrySelector({
  label,
  value,
  onChange,
  countries,
  excludeIso3,
}: {
  label: string;
  value: string;
  onChange: (iso3: string) => void;
  countries: CountryMeta[];
  excludeIso3?: string;
}) {
  const filtered = excludeIso3 ? countries.filter(c => c.iso3 !== excludeIso3) : countries;
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-[#4A4A6A]">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-[#E8E8ED] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A2E] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
      >
        {filtered.map(c => (
          <option key={c.iso3} value={c.iso3}>{c.flag} {c.name}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Poster Explorer (main) ──────────────────────────────────────────────── */

interface PosterExplorerProps {
  countriesList: CountryMeta[];
  iso3: string;
  setIso3: (s: string) => void;
  compIso3: string;
  setCompIso3: (s: string) => void;
  onClickPoster: (type: PosterType) => void;
  renderPoster: (type: PosterType) => ReactNode;
  renderPosterRef: (type: PosterType) => (el: HTMLDivElement | null) => void;
  downloading: PosterType | null;
  onDownload: (type: PosterType) => void;
}

export function PosterExplorer({
  countriesList, iso3, setIso3, compIso3, setCompIso3,
  onClickPoster, renderPoster, renderPosterRef,
  downloading, onDownload,
}: PosterExplorerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [focusIndex, setFocusIndex] = useState(0);

  const filteredDefs = filter === 'all'
    ? POSTER_DEFS
    : POSTER_DEFS.filter(p => p.id === filter);

  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CategoryFilter active={filter} setActive={setFilter} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CountrySelector label="Country" value={iso3} onChange={setIso3} countries={countriesList} />
            {viewMode === 'comparison' && (
              <CountrySelector label="vs" value={compIso3} onChange={setCompIso3} countries={countriesList} excludeIso3={iso3} />
            )}
            <ViewModeToggle mode={viewMode} setMode={setViewMode} />
          </div>
        </div>

        {/* Content area based on view mode */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredDefs.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  onClick={() => onClickPoster(p.id)}
                >
                  <div ref={renderPosterRef(p.id)}>
                    {renderPoster(p.id)}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <p className="text-sm font-semibold text-white">{p.title}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); onClickPoster(p.id); }}
                        className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#1A1A2E] shadow transition-all hover:scale-105"
                      >
                        Expand
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onDownload(p.id); }}
                        disabled={downloading === p.id}
                        className="rounded-lg bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white shadow transition-all hover:scale-105 disabled:opacity-50"
                      >
                        {downloading === p.id ? 'Saving\u2026' : 'PNG'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {viewMode === 'one-by-one' && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Navigation dots */}
              <div className="flex gap-2">
                {filteredDefs.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setFocusIndex(i)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      i === focusIndex
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-[#F8F9FA] text-[#4A4A6A] ring-1 ring-[#E8E8ED] hover:ring-[#0066FF]'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              {/* Single poster view */}
              <AnimatePresence mode="wait">
                {filteredDefs[focusIndex] && (
                  <motion.div
                    key={filteredDefs[focusIndex].id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-2xl"
                  >
                    <div
                      className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/[0.06]"
                      onClick={() => onClickPoster(filteredDefs[focusIndex].id)}
                    >
                      <div ref={renderPosterRef(filteredDefs[focusIndex].id)}>
                        {renderPoster(filteredDefs[focusIndex].id)}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center gap-3">
                      <button
                        onClick={() => onClickPoster(filteredDefs[focusIndex].id)}
                        className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#1A1A2E] shadow ring-1 ring-black/[0.06] transition-all hover:shadow-md"
                      >
                        Expand
                      </button>
                      <button
                        onClick={() => onDownload(filteredDefs[focusIndex].id)}
                        disabled={downloading === filteredDefs[focusIndex].id}
                        className="rounded-xl bg-[#0066FF] px-5 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-[#0052CC] disabled:opacity-50"
                      >
                        {downloading === filteredDefs[focusIndex].id ? 'Saving\u2026' : 'Download PNG'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Prev/Next */}
              <div className="flex gap-4">
                <button
                  onClick={() => setFocusIndex(Math.max(0, focusIndex - 1))}
                  disabled={focusIndex === 0}
                  className="rounded-lg bg-[#F8F9FA] px-4 py-2 text-xs font-medium text-[#4A4A6A] ring-1 ring-[#E8E8ED] transition-all hover:ring-[#0066FF] disabled:opacity-30"
                >
                  &larr; Previous
                </button>
                <button
                  onClick={() => setFocusIndex(Math.min(filteredDefs.length - 1, focusIndex + 1))}
                  disabled={focusIndex === filteredDefs.length - 1}
                  className="rounded-lg bg-[#F8F9FA] px-4 py-2 text-xs font-medium text-[#4A4A6A] ring-1 ring-[#E8E8ED] transition-all hover:ring-[#0066FF] disabled:opacity-30"
                >
                  Next &rarr;
                </button>
              </div>
            </motion.div>
          )}

          {viewMode === 'comparison' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {filteredDefs.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  onClick={() => onClickPoster(p.id)}
                >
                  <div ref={renderPosterRef(p.id)}>
                    {renderPoster(p.id)}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={e => { e.stopPropagation(); onDownload(p.id); }}
                      disabled={downloading === p.id}
                      className="rounded-lg bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white shadow transition-all hover:scale-105 disabled:opacity-50"
                    >
                      {downloading === p.id ? 'Saving\u2026' : 'Download PNG'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-xs text-[#8888A0]">
          Click any poster to expand &middot; All posters update for the selected country
        </p>
      </div>
    </section>
  );
}
