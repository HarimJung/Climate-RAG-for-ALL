'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface BentoPoster {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  content: ReactNode;
  onDownload?: () => void;
  downloading?: boolean;
  refCallback?: (el: HTMLDivElement | null) => void;
  onClick?: () => void;
}

interface BentoSectionProps {
  posters: BentoPoster[];
}

/* ── Bento Card (no inner padding — poster fills, gradient overlay) ──────── */

function BentoCard({
  poster,
  index,
  height,
}: {
  poster: BentoPoster;
  index: number;
  height: string;
}) {
  return (
    <motion.div
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
      onClick={poster.onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl"
      style={{ height }}
    >
      {/* Poster content fills 100% */}
      <div ref={poster.refCallback} className="absolute inset-0 w-full h-full overflow-hidden">
        {poster.content}
      </div>

      {/* Bottom gradient overlay with badge + title */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
        <span
          className="inline-block px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider mb-1"
        >
          {poster.badge}
        </span>
        <h3 className="text-white font-bold text-sm leading-tight">
          {poster.title}
        </h3>
        <p className="text-white/70 text-xs mt-0.5">{poster.subtitle}</p>
      </div>

      {/* Download button on hover */}
      {poster.onDownload && (
        <button
          onClick={(e) => { e.stopPropagation(); poster.onDownload?.(); }}
          disabled={poster.downloading}
          className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-[#1A1A2E] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10 disabled:opacity-40"
          aria-label="Download PNG"
        >
          {poster.downloading ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          )}
        </button>
      )}
    </motion.div>
  );
}

/* ── Bento Section ───────────────────────────────────────────────────────── */

export function BentoSection({ posters }: BentoSectionProps) {
  if (posters.length < 6) return null;

  // Map posters to grid slots
  // Row 1: col-span-8 (420px) + col-span-4 (two stacked 206px each)
  // Row 2: col-span-4 (300px) + col-span-4 (300px) + col-span-4 (300px)
  // Row 3: col-span-5 (260px) + col-span-7 (260px)
  const [p0, p1, p2, p3, p4, p5] = posters;

  return (
    <section className="bg-[#F8F9FA] px-4 py-16">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="mb-10"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#0066FF] mb-2 block">
            Featured
          </span>
          <h2 className="text-3xl font-bold text-[#1A1A2E] tracking-tight md:text-4xl">
            Poster Collection
          </h2>
          <p className="text-[#4A4A6A] mt-2 text-sm">
            Click any poster to expand &middot; Download as PNG for social sharing
          </p>
        </motion.div>

        {/* 12-column grid with gap-2 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* Row 1: col-span-8 TALL + col-span-4 with two stacked */}
          <div className="md:col-span-8">
            <BentoCard poster={p0} index={0} height="420px" />
          </div>
          <div className="md:col-span-4 flex flex-col gap-2">
            <BentoCard poster={p1} index={1} height="206px" />
            <BentoCard poster={p2} index={2} height="206px" />
          </div>

          {/* Row 2: three equal col-span-4 */}
          <div className="md:col-span-4">
            <BentoCard poster={p3} index={3} height="300px" />
          </div>
          <div className="md:col-span-4">
            <BentoCard poster={p4} index={4} height="300px" />
          </div>
          <div className="md:col-span-4">
            <BentoCard poster={p5} index={5} height="300px" />
          </div>

          {/* Row 3 only if more than 6 posters */}
          {posters.length > 6 && posters[6] && (
            <div className="md:col-span-5">
              <BentoCard poster={posters[6]} index={6} height="260px" />
            </div>
          )}
          {posters.length > 7 && posters[7] && (
            <div className="md:col-span-7">
              <BentoCard poster={posters[7]} index={7} height="260px" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
