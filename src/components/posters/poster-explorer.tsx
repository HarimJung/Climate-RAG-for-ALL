'use client';

import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

/* ── Types ───────────────────────────────────────────────────────────────── */

export type PosterType = 'energy' | 'inequality' | 'gap' | 'air' | 'race' | 'scoreboard';
export type ViewMode = 'grid' | 'focus' | 'compare';
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
    <LayoutGroup id="categories">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
              active === cat.id
                ? 'text-white'
                : 'bg-white text-[#4A4A6A] border border-slate-200 hover:border-slate-300'
            }`}
          >
            {active === cat.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-[#0066FF] rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{cat.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/* ── View mode toggle ────────────────────────────────────────────────────── */

function ViewModeToggle({ mode, setMode }: { mode: ViewMode; setMode: (m: ViewMode) => void }) {
  const modes: { id: ViewMode; label: string; icon: ReactNode }[] = [
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
      id: 'focus',
      label: 'Focus',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      ),
    },
    {
      id: 'compare',
      label: 'Compare',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
      <LayoutGroup id="view-mode">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium capitalize flex items-center gap-2 transition-colors ${
              mode === m.id ? 'text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {mode === m.id && (
              <motion.div
                layoutId="active-mode"
                className="absolute inset-0 bg-[#0066FF] rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {m.icon}
              <span className="hidden sm:inline">{m.label}</span>
            </span>
          </button>
        ))}
      </LayoutGroup>
    </div>
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
        className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
      >
        {filtered.map(c => (
          <option key={c.iso3} value={c.iso3}>{c.flag} {c.name}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Grid masonry row pattern logic ──────────────────────────────────────── */

function getGridClasses(index: number): { colSpan: string; height: string } {
  // Row pattern repeats every 7 items:
  // Row A (2 items): [col-span-2, col-span-1] → 380px, 320px
  // Row B (2 items): [col-span-1, col-span-2] → 320px, 380px
  // Row C (3 items): [col-span-1, col-span-1, col-span-1] → 320px each
  const cycle = index < 2 ? 0 : index < 4 ? 1 : index < 7 ? 2 : Math.floor((index - 7) / 7) * 3 + (
    (index - 7) % 7 < 2 ? 0 : (index - 7) % 7 < 4 ? 1 : 2
  );
  const posInCycle = index < 2 ? index : index < 4 ? index - 2 : index < 7 ? index - 4 : (index - 7) % 7;

  // Simpler approach: direct repeating pattern
  const patternIndex = index % 7;

  if (patternIndex < 2) {
    // Row A: col-span-2 + col-span-1
    return patternIndex === 0
      ? { colSpan: 'md:col-span-2', height: '380px' }
      : { colSpan: 'md:col-span-1', height: '320px' };
  }
  if (patternIndex < 4) {
    // Row B: col-span-1 + col-span-2
    return patternIndex === 2
      ? { colSpan: 'md:col-span-1', height: '320px' }
      : { colSpan: 'md:col-span-2', height: '380px' };
  }
  // Row C: col-span-1 + col-span-1 + col-span-1
  return { colSpan: 'md:col-span-1', height: '320px' };
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
    <section className="bg-white px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section divider + header */}
        <div className="flex flex-col items-center mb-16">
          <div className="w-full flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-100 flex-1" />
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400"
            >
              Explore All Posters
            </motion.span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          {/* Toolbar: filters + view mode + country */}
          <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
            <CategoryFilter active={filter} setActive={setFilter} />
            <div className="flex flex-wrap items-center gap-4">
              <CountrySelector label="Country" value={iso3} onChange={setIso3} countries={countriesList} />
              {viewMode === 'compare' && (
                <CountrySelector label="vs" value={compIso3} onChange={setCompIso3} countries={countriesList} excludeIso3={iso3} />
              )}
              <ViewModeToggle mode={viewMode} setMode={setViewMode} />
            </div>
          </div>
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          {/* ── GRID MODE ── */}
          {viewMode === 'grid' && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {filteredDefs.map((p, index) => {
                const { colSpan, height } = getGridClasses(index);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileHover={{ scale: 1.02 }}
                    transition={{
                      type: 'spring',
                      stiffness: 120,
                      damping: 18,
                      delay: index * 0.08,
                    }}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow ${colSpan}`}
                    style={{ height }}
                    onClick={() => onClickPoster(p.id)}
                  >
                    {/* Poster content */}
                    <div ref={renderPosterRef(p.id)} className="absolute inset-0 w-full h-full overflow-hidden">
                      {renderPoster(p.id)}
                    </div>

                    {/* Bottom gradient */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
                      <span
                        className="inline-block px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider mb-1"
                      >
                        {p.category}
                      </span>
                      <h3 className="text-white font-bold text-sm leading-tight">{p.title}</h3>
                    </div>

                    {/* Hover download button */}
                    <button
                      onClick={e => { e.stopPropagation(); onDownload(p.id); }}
                      disabled={downloading === p.id}
                      className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-[#1A1A2E] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10 disabled:opacity-40"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── FOCUS MODE ── */}
          {viewMode === 'focus' && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative flex items-center justify-center min-h-[600px] overflow-hidden"
            >
              {/* Navigation arrows */}
              <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                <button
                  onClick={() => setFocusIndex(prev => (prev > 0 ? prev - 1 : filteredDefs.length - 1))}
                  className="p-4 bg-white shadow-xl rounded-full text-[#1A1A2E] hover:scale-110 transition-transform"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setFocusIndex(prev => (prev < filteredDefs.length - 1 ? prev + 1 : 0))}
                  className="p-4 bg-white shadow-xl rounded-full text-[#1A1A2E] hover:scale-110 transition-transform"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-8 w-full justify-center">
                {/* Peek Left */}
                <div className="hidden lg:block w-[15%] opacity-20 scale-90 blur-[2px] pointer-events-none">
                  {filteredDefs.length > 1 && (() => {
                    const prevDef = filteredDefs[(focusIndex - 1 + filteredDefs.length) % filteredDefs.length];
                    return (
                      <div className="h-[400px] overflow-hidden rounded-2xl">
                        <div ref={renderPosterRef(prevDef.id)}>
                          {renderPoster(prevDef.id)}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Main Focus — centered 600px */}
                {filteredDefs[focusIndex] && (
                  <div className="w-full lg:w-[600px] flex-shrink-0">
                    <motion.div
                      key={filteredDefs[focusIndex].id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                      className="cursor-pointer overflow-hidden rounded-2xl shadow-xl h-[600px] relative group"
                      onClick={() => onClickPoster(filteredDefs[focusIndex].id)}
                    >
                      <div ref={renderPosterRef(filteredDefs[focusIndex].id)} className="absolute inset-0 w-full h-full overflow-hidden">
                        {renderPoster(filteredDefs[focusIndex].id)}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
                        <span className="inline-block px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider mb-1">
                          {filteredDefs[focusIndex].category}
                        </span>
                        <h3 className="text-white font-bold text-lg leading-tight">{filteredDefs[focusIndex].title}</h3>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onDownload(filteredDefs[focusIndex].id); }}
                        disabled={downloading === filteredDefs[focusIndex].id}
                        className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-[#1A1A2E] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10 disabled:opacity-40"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                    </motion.div>
                  </div>
                )}

                {/* Peek Right */}
                <div className="hidden lg:block w-[15%] opacity-20 scale-90 blur-[2px] pointer-events-none">
                  {filteredDefs.length > 1 && (() => {
                    const nextDef = filteredDefs[(focusIndex + 1) % filteredDefs.length];
                    return (
                      <div className="h-[400px] overflow-hidden rounded-2xl">
                        <div ref={renderPosterRef(nextDef.id)}>
                          {renderPoster(nextDef.id)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── COMPARE MODE ── */}
          {viewMode === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filteredDefs.slice(0, 2).map((p, index) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{
                    type: 'spring',
                    stiffness: 120,
                    damping: 18,
                    delay: index * 0.08,
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{p.category}</span>
                  </div>
                  <div
                    className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow h-[500px]"
                    onClick={() => onClickPoster(p.id)}
                  >
                    <div ref={renderPosterRef(p.id)} className="absolute inset-0 w-full h-full overflow-hidden">
                      {renderPoster(p.id)}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
                      <span className="inline-block px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider mb-1">
                        {p.category}
                      </span>
                      <h3 className="text-white font-bold text-sm leading-tight">{p.title}</h3>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDownload(p.id); }}
                      disabled={downloading === p.id}
                      className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-[#1A1A2E] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10 disabled:opacity-40"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
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
