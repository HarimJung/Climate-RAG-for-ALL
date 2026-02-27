'use client';

import { type ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PosterCard } from './poster-card';
import type { ViewMode } from './toolbar';

/* ── Types ──────────────────────────────────────────────────────────────── */

export type PosterType = 'energy' | 'inequality' | 'gap' | 'air' | 'race' | 'scoreboard';

export interface PosterDef {
  id: PosterType;
  title: string;
  category: string;
  categoryColor: string;
  bgColor: string;
  description?: string;
}

export const POSTER_DEFS: PosterDef[] = [
  { id: 'scoreboard',  title: 'World Scoreboard',  category: 'Global',     categoryColor: '#3B5998', bgColor: '#F0F4FF' },
  { id: 'energy',      title: 'Energy Flow',       category: 'Energy',     categoryColor: '#059669', bgColor: '#ECFDF5' },
  { id: 'gap',         title: 'Paris Gap',         category: 'Paris Gap',  categoryColor: '#D97706', bgColor: '#FFFBEB' },
  { id: 'race',        title: 'Transition Race',   category: 'Transition', categoryColor: '#7C3AED', bgColor: '#F5F3FF' },
  { id: 'inequality',  title: 'Carbon Inequality', category: 'Inequality', categoryColor: '#E11D48', bgColor: '#FFF1F2' },
  { id: 'air',         title: 'Air Quality',       category: 'Air',        categoryColor: '#0D9488', bgColor: '#F0FDFA' },
];

interface CountryMeta { iso3: string; name: string; adj: string; flag: string }

/* ── Explorer Props ─────────────────────────────────────────────────────── */

interface PosterExplorerProps {
  countriesList: CountryMeta[];
  iso3: string;
  compIso3: string;
  setCompIso3: (s: string) => void;
  onClickPoster: (type: PosterType) => void;
  renderPoster: (type: PosterType) => ReactNode;
  renderPosterRef: (type: PosterType) => (el: HTMLDivElement | null) => void;
  downloading: PosterType | null;
  onDownload: (type: PosterType) => void;
  viewMode: ViewMode;
  filteredDefs: PosterDef[];
  countryName: string;
}

/* ── Grid Mode ──────────────────────────────────────────────────────────── */

function GridMode({
  defs, renderPoster, renderPosterRef, onClickPoster, onDownload, downloading,
}: {
  defs: PosterDef[];
  renderPoster: (type: PosterType) => ReactNode;
  renderPosterRef: (type: PosterType) => (el: HTMLDivElement | null) => void;
  onClickPoster: (type: PosterType) => void;
  onDownload: (type: PosterType) => void;
  downloading: PosterType | null;
}) {
  // Asymmetric bento grid: 12-column layout
  // Pattern: row1 = 7+5, row2 = 5+7, row3 = 6+6
  const getGridPlacement = (i: number) => {
    if (i % 6 < 2) {
      return i % 2 === 0
        ? 'sm:col-span-7 min-h-[280px] md:min-h-[400px]'
        : 'sm:col-span-5 min-h-[280px] md:min-h-[400px]';
    } else if (i % 6 < 4) {
      return i % 2 === 0
        ? 'sm:col-span-5 min-h-[260px] md:min-h-[380px]'
        : 'sm:col-span-7 min-h-[260px] md:min-h-[380px]';
    } else {
      return 'sm:col-span-6 min-h-[260px] md:min-h-[360px]';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-12">
      {defs.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 80, scale: 0.9, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
          whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{
            type: 'spring',
            stiffness: 70,
            damping: 16,
            delay: (i % 3) * 0.1,
          }}
          className={`col-span-1 ${getGridPlacement(i)}`}
        >
          <div className="group relative h-full">
            <div ref={renderPosterRef(p.id)} className="h-full">
              <PosterCard
                index={i}
                categoryLabel={p.category}
                title={p.title}
                description={p.description}
                bgColor={p.bgColor}
                accentColor={p.categoryColor}
                onClick={() => onClickPoster(p.id)}
                className="h-full"
              >
                {renderPoster(p.id)}
              </PosterCard>
            </div>
            {/* Hover overlay with download */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-3xl bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <button
                onClick={e => { e.stopPropagation(); onClickPoster(p.id); }}
                className="pointer-events-auto rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#1A1A2E] shadow transition-all hover:scale-105"
              >
                Expand
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDownload(p.id); }}
                disabled={downloading === p.id}
                className="pointer-events-auto rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow transition-all hover:scale-105 disabled:opacity-50"
              >
                {downloading === p.id ? 'Saving\u2026' : 'PNG'}
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── 3D Tilt wrapper for Focus Mode center card ─────────────────────────── */

function CenterCardTilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

/* ── Focus / Carousel Mode ──────────────────────────────────────────────── */

function FocusMode({
  defs, renderPoster, renderPosterRef, onClickPoster, onDownload, downloading,
}: {
  defs: PosterDef[];
  renderPoster: (type: PosterType) => ReactNode;
  renderPosterRef: (type: PosterType) => (el: HTMLDivElement | null) => void;
  onClickPoster: (type: PosterType) => void;
  onDownload: (type: PosterType) => void;
  downloading: PosterType | null;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % defs.length);
  }, [defs.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + defs.length) % defs.length);
  }, [defs.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const getCardIndex = (offset: number) => {
    return (currentIndex + offset + defs.length) % defs.length;
  };

  const visibleOffsets = [-2, -1, 0, 1, 2];

  return (
    <div className="flex flex-col items-center">
      {/* Card deck container */}
      <div
        className="relative flex h-[420px] w-full max-w-5xl items-center justify-center md:h-[500px]"
        style={{ perspective: '1200px' }}
      >
        <AnimatePresence mode="popLayout">
          {visibleOffsets.map((offset) => {
            const idx = getCardIndex(offset);
            const def = defs[idx];
            if (!def) return null;

            const isCenter = offset === 0;
            const absOffset = Math.abs(offset);

            return (
              <motion.div
                key={`${def.id}-${offset}`}
                className="absolute cursor-pointer overflow-hidden rounded-3xl"
                style={{
                  backgroundColor: def.bgColor,
                  width: isCenter ? '340px' : absOffset === 1 ? '280px' : '220px',
                  height: isCenter ? '420px' : absOffset === 1 ? '360px' : '300px',
                  zIndex: 10 - absOffset,
                }}
                initial={{
                  x: offset * 200,
                  scale: isCenter ? 0.9 : 0.7,
                  rotateY: offset * -8,
                  opacity: 0,
                }}
                animate={{
                  x: offset * (isCenter ? 0 : absOffset === 1 ? 180 : 310),
                  scale: isCenter ? 1 : absOffset === 1 ? 0.85 : 0.7,
                  rotateY: offset * -5,
                  opacity: isCenter ? 1 : absOffset === 1 ? 0.7 : 0.4,
                  filter: isCenter ? 'blur(0px)' : `blur(${absOffset * 1.5}px)`,
                }}
                exit={{
                  x: offset * 300,
                  scale: 0.6,
                  opacity: 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 26,
                  mass: 0.8,
                }}
                whileHover={
                  isCenter
                    ? {
                        scale: 1.03,
                        y: -8,
                        transition: { duration: 0.3, ease: 'easeOut' },
                      }
                    : {}
                }
                onClick={() => {
                  if (isCenter) {
                    onClickPoster(def.id);
                  } else if (offset > 0) {
                    for (let s = 0; s < offset; s++) goNext();
                  } else {
                    for (let s = 0; s < -offset; s++) goPrev();
                  }
                }}
                drag={isCenter ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 60) {
                    if (info.offset.x > 0) goPrev();
                    else goNext();
                  }
                }}
              >
                {isCenter ? (
                  <CenterCardTilt>
                    <div className="flex h-full flex-col justify-between p-4 md:p-6">
                      <div className="flex flex-1 items-center justify-center overflow-hidden">
                        <div ref={renderPosterRef(def.id)} className="w-full">
                          {renderPoster(def.id)}
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: def.categoryColor }}>
                          {def.category}
                        </span>
                        <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-900 md:text-xl">
                          {def.title}
                        </h3>
                      </div>
                    </div>
                  </CenterCardTilt>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-4 md:p-6">
                    <div className="flex w-full flex-col items-center gap-2 opacity-60">
                      <span className="text-xs font-medium uppercase tracking-widest" style={{ color: def.categoryColor }}>
                        {def.category}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{def.title}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation controls */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={goPrev}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          aria-label="Previous poster"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {defs.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="relative"
              aria-label={`Go to poster ${i + 1}`}
            >
              <motion.div
                className="h-2 rounded-full"
                animate={{
                  width: i === currentIndex ? 24 : 8,
                  backgroundColor: i === currentIndex ? '#0f172a' : '#cbd5e1',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            </button>
          ))}
        </div>

        <button
          onClick={goNext}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          aria-label="Next poster"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Download for center card */}
      {defs[currentIndex] && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onClickPoster(defs[currentIndex].id)}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#1A1A2E] shadow ring-1 ring-black/[0.06] transition-all hover:shadow-md"
          >
            Expand
          </button>
          <button
            onClick={() => onDownload(defs[currentIndex].id)}
            disabled={downloading === defs[currentIndex].id}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {downloading === defs[currentIndex].id ? 'Saving\u2026' : 'Download PNG'}
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Drag or use arrow keys to navigate &middot; Click side cards to jump
      </p>
    </div>
  );
}

/* ── Compare Mode ───────────────────────────────────────────────────────── */

function CompareMode({
  defs, renderPoster, renderPosterRef, onClickPoster, onDownload, downloading,
  countriesList, compIso3, setCompIso3,
}: {
  defs: PosterDef[];
  renderPoster: (type: PosterType) => ReactNode;
  renderPosterRef: (type: PosterType) => (el: HTMLDivElement | null) => void;
  onClickPoster: (type: PosterType) => void;
  onDownload: (type: PosterType) => void;
  downloading: PosterType | null;
  countriesList: CountryMeta[];
  compIso3: string;
  setCompIso3: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      {/* Comparison country selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Compare with</span>
        <select
          value={compIso3}
          onChange={(e) => setCompIso3(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
        >
          {countriesList.map((c) => (
            <option key={c.iso3} value={c.iso3}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Side by side cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {defs.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="group relative"
          >
            <div ref={renderPosterRef(p.id)}>
              <PosterCard
                index={i}
                categoryLabel={p.category}
                title={p.title}
                bgColor={p.bgColor}
                accentColor={p.categoryColor}
                onClick={() => onClickPoster(p.id)}
                className="min-h-[320px] md:min-h-[440px]"
              >
                {renderPoster(p.id)}
              </PosterCard>
            </div>
            {/* Hover overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-3xl bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <button
                onClick={e => { e.stopPropagation(); onDownload(p.id); }}
                disabled={downloading === p.id}
                className="pointer-events-auto rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow transition-all hover:scale-105 disabled:opacity-50"
              >
                {downloading === p.id ? 'Saving\u2026' : 'Download PNG'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Main PosterExplorer ────────────────────────────────────────────────── */

export function PosterExplorer({
  countriesList, iso3, compIso3, setCompIso3,
  onClickPoster, renderPoster, renderPosterRef,
  downloading, onDownload, viewMode, filteredDefs, countryName,
}: PosterExplorerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const headerX = useTransform(scrollYProgress, [0, 0.3], [-40, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section ref={sectionRef} className="bg-white py-12 md:py-16" id="posters">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          style={{ x: headerX, opacity: headerOpacity }}
          className="mb-8"
        >
          <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Explorer
          </span>
          <p className="mt-1 text-sm text-slate-500">
            Click any poster to expand &middot; All posters update for {countryName}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            {viewMode === 'grid' && (
              <GridMode
                defs={filteredDefs}
                renderPoster={renderPoster}
                renderPosterRef={renderPosterRef}
                onClickPoster={onClickPoster}
                onDownload={onDownload}
                downloading={downloading}
              />
            )}
            {viewMode === 'focus' && (
              <FocusMode
                defs={filteredDefs}
                renderPoster={renderPoster}
                renderPosterRef={renderPosterRef}
                onClickPoster={onClickPoster}
                onDownload={onDownload}
                downloading={downloading}
              />
            )}
            {viewMode === 'compare' && (
              <CompareMode
                defs={filteredDefs}
                renderPoster={renderPoster}
                renderPosterRef={renderPosterRef}
                onClickPoster={onClickPoster}
                onDownload={onDownload}
                downloading={downloading}
                countriesList={countriesList}
                compIso3={compIso3}
                setCompIso3={setCompIso3}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
