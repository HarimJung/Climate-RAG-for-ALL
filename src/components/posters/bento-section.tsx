'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PosterCard } from './poster-card';

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface BentoPoster {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  badge: string;
  badgeColor: string;
  bgColor: string;
  content: ReactNode;
  onDownload?: () => void;
  downloading?: boolean;
  refCallback?: (el: HTMLDivElement | null) => void;
}

interface BentoSectionProps {
  posters: BentoPoster[];
  totalTypes: number;
  totalCountries: number;
}

/* ── Bento Grid ─────────────────────────────────────────────────────────── */
/*
  Desktop layout (3 cols, 4 rows):
  ┌──────────────┬───────────────────────────────────┐
  │   TEXT       │   SCOREBOARD  (2 cols × 2 rows)   │  rows 1-2
  │  (1 col ×    │                                   │
  │   2 rows)    │                                   │
  ├──────────────┼─────────────────┬─────────────────┤
  │   ENERGY     │   PARIS GAP     │   RACE          │  row 3
  ├──────────────┴─────────────────┼─────────────────┤
  │   INEQUALITY     (2 cols)      │   AIR           │  row 4
  └────────────────────────────────┴─────────────────┘
*/

export function BentoSection({ posters, totalTypes, totalCountries }: BentoSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 0.4], [30, 0]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.12, 0.9, 1], [0, 1, 1, 0.95]);

  // p[0]=scoreboard  p[1]=energy  p[2]=gap  p[3]=race  p[4]=inequality  p[5]=air
  const p = posters.slice(0, 6);

  return (
    <section ref={sectionRef} className="overflow-hidden bg-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">

        {/* ── Bento grid ── */}
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'auto auto auto auto',
          }}
        >

          {/* ── TEXT BLOCK — col 1, rows 1-2 ── */}
          <motion.div
            style={{
              gridColumn: '1 / 2',
              gridRow: '1 / 3',
              y: textY,
              opacity: textOpacity,
            }}
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-[#F8F9FA] p-7"
          >
            <div className="flex flex-col gap-4">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="text-xs font-medium uppercase tracking-widest text-slate-400"
              >
                Featured
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
                className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
              >
                Poster<br />Collection
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
                className="text-sm leading-relaxed text-slate-500"
              >
                Six distinct poster types covering emissions, energy mix,
                Paris gap analysis, transition race, carbon inequality,
                and air quality across {totalCountries}+ countries.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-xs text-slate-400"
              >
                Click any poster to expand. Download as PNG for social sharing.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <a
                  href="#posters"
                  className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-700"
                >
                  Explore all posters
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </motion.div>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-200 pt-6"
            >
              {[
                { value: String(totalTypes), label: 'Poster types' },
                { value: `${totalCountries}+`, label: 'Countries' },
                { value: '200+', label: 'Data points' },
              ].map((stat, i) => (
                <div key={stat.label}>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.6 + i * 0.1 }}
                    className="block text-2xl font-bold text-slate-900"
                  >
                    {stat.value}
                  </motion.span>
                  <p className="mt-0.5 text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── SCOREBOARD — cols 2-3, rows 1-2 (hero, big) ── */}
          {p[0] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              style={{ gridColumn: '2 / 4', gridRow: '1 / 3' }}
            >
              <div ref={p[0].refCallback} className="h-full">
                <PosterCard
                  index={0}
                  categoryLabel={p[0].badge}
                  title={p[0].title}
                  description={p[0].subtitle}
                  bgColor={p[0].bgColor}
                  accentColor={p[0].badgeColor}
                  onClick={p[0].onDownload}
                  className="h-full min-h-[380px] md:min-h-[460px]"
                >
                  {p[0].content}
                </PosterCard>
              </div>
            </motion.div>
          )}

          {/* ── ENERGY — col 1, row 3 ── */}
          {p[1] && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.08 }}
              style={{ gridColumn: '1 / 2', gridRow: '3 / 4' }}
            >
              <div ref={p[1].refCallback} className="h-full">
                <PosterCard
                  index={1}
                  categoryLabel={p[1].badge}
                  title={p[1].title}
                  description={p[1].subtitle}
                  bgColor={p[1].bgColor}
                  accentColor={p[1].badgeColor}
                  onClick={p[1].onDownload}
                  className="h-full min-h-[260px] md:min-h-[300px]"
                >
                  {p[1].content}
                </PosterCard>
              </div>
            </motion.div>
          )}

          {/* ── PARIS GAP — col 2, row 3 ── */}
          {p[2] && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.12 }}
              style={{ gridColumn: '2 / 3', gridRow: '3 / 4' }}
            >
              <div ref={p[2].refCallback} className="h-full">
                <PosterCard
                  index={2}
                  categoryLabel={p[2].badge}
                  title={p[2].title}
                  description={p[2].subtitle}
                  bgColor={p[2].bgColor}
                  accentColor={p[2].badgeColor}
                  onClick={p[2].onDownload}
                  className="h-full min-h-[260px] md:min-h-[300px]"
                >
                  {p[2].content}
                </PosterCard>
              </div>
            </motion.div>
          )}

          {/* ── TRANSITION RACE — col 3, row 3 ── */}
          {p[3] && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.16 }}
              style={{ gridColumn: '3 / 4', gridRow: '3 / 4' }}
            >
              <div ref={p[3].refCallback} className="h-full">
                <PosterCard
                  index={3}
                  categoryLabel={p[3].badge}
                  title={p[3].title}
                  description={p[3].subtitle}
                  bgColor={p[3].bgColor}
                  accentColor={p[3].badgeColor}
                  onClick={p[3].onDownload}
                  className="h-full min-h-[260px] md:min-h-[300px]"
                >
                  {p[3].content}
                </PosterCard>
              </div>
            </motion.div>
          )}

          {/* ── CARBON INEQUALITY — cols 1-2, row 4 (wide) ── */}
          {p[4] && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
              style={{ gridColumn: '1 / 3', gridRow: '4 / 5' }}
            >
              <div ref={p[4].refCallback} className="h-full">
                <PosterCard
                  index={4}
                  categoryLabel={p[4].badge}
                  title={p[4].title}
                  description={p[4].subtitle}
                  bgColor={p[4].bgColor}
                  accentColor={p[4].badgeColor}
                  onClick={p[4].onDownload}
                  className="h-full min-h-[260px] md:min-h-[300px]"
                >
                  {p[4].content}
                </PosterCard>
              </div>
            </motion.div>
          )}

          {/* ── AIR QUALITY — col 3, row 4 ── */}
          {p[5] && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.24 }}
              style={{ gridColumn: '3 / 4', gridRow: '4 / 5' }}
            >
              <div ref={p[5].refCallback} className="h-full">
                <PosterCard
                  index={5}
                  categoryLabel={p[5].badge}
                  title={p[5].title}
                  description={p[5].subtitle}
                  bgColor={p[5].bgColor}
                  accentColor={p[5].badgeColor}
                  onClick={p[5].onDownload}
                  className="h-full min-h-[260px] md:min-h-[300px]"
                >
                  {p[5].content}
                </PosterCard>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </section>
  );
}
