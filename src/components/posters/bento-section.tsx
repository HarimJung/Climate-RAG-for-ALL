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
  onPosterClick: (id: string) => void;
}

/* ── BentoSection: Left sticky + Right 5-card bento grid ───────────────── */

export function BentoSection({ posters, totalTypes, totalCountries, onPosterClick }: BentoSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Parallax transforms for left column
  const textY = useTransform(scrollYProgress, [0, 0.5], [80, -20]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.6]);

  // Stagger transforms for right column cards
  const card1Y = useTransform(scrollYProgress, [0.02, 0.3], [150, 0]);
  const card2Y = useTransform(scrollYProgress, [0.06, 0.36], [180, 0]);
  const card3Y = useTransform(scrollYProgress, [0.08, 0.38], [140, 0]);
  const card4Y = useTransform(scrollYProgress, [0.1, 0.4], [200, 0]);
  const card5Y = useTransform(scrollYProgress, [0.12, 0.42], [160, 0]);

  // Rotation transforms for dynamism
  const card1R = useTransform(scrollYProgress, [0.02, 0.3], [-4, 0]);
  const card2R = useTransform(scrollYProgress, [0.06, 0.36], [3, 0]);
  const card3R = useTransform(scrollYProgress, [0.08, 0.38], [-2.5, 0]);
  const card4R = useTransform(scrollYProgress, [0.1, 0.4], [4, 0]);
  const card5R = useTransform(scrollYProgress, [0.12, 0.42], [-3, 0]);

  const cardTransforms = [card1Y, card2Y, card3Y, card4Y, card5Y];
  const cardRotations = [card1R, card2R, card3R, card4R, card5R];

  // We show up to 5 posters in the bento grid (first 5)
  const p = posters.slice(0, 5);

  return (
    <section ref={sectionRef} className="overflow-hidden bg-white py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
          {/* Left: sticky description column */}
          <motion.div
            style={{ y: textY, opacity: textOpacity }}
            className="flex-shrink-0 lg:sticky lg:top-32 lg:w-[340px]"
          >
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
              className="mt-3 text-balance text-4xl font-bold tracking-tight text-[#1A1A2E] md:text-5xl"
            >
              Poster Collection
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
              className="mt-4 text-pretty text-base leading-relaxed text-[#4A4A6A]"
            >
              Six distinct poster types covering emissions, energy mix,
              Paris gap analysis, transition race, carbon inequality,
              and air quality across {totalCountries}+ countries.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
              className="mt-3 text-sm text-slate-400"
            >
              Click any poster to expand. Download as PNG for social sharing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }}
              className="mt-8"
            >
              <a
                href="#posters"
                className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800"
              >
                Explore all posters
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>

            {/* Stats block */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.5 }}
              className="mt-12 grid grid-cols-3 gap-4"
            >
              {[
                { value: String(totalTypes), label: 'Poster types' },
                { value: `${totalCountries}+`, label: 'Countries' },
                { value: '200+', label: 'Data points' },
              ].map((stat, i) => (
                <div key={stat.label} className="text-center">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.6 + i * 0.1 }}
                    className="text-2xl font-bold text-[#1A1A2E]"
                  >
                    {stat.value}
                  </motion.span>
                  <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: poster grid with scroll-driven movement */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Row 1: wide card (scoreboard) */}
              {p[0] && (
                <motion.div
                  style={{ y: cardTransforms[0], rotate: cardRotations[0] }}
                  className="sm:col-span-2"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                  >
                    <div ref={p[0].refCallback} className="h-full">
                      <PosterCard
                        index={0}
                        categoryLabel={p[0].badge}
                        title={p[0].title}
                        description={p[0].subtitle}
                        bgColor={p[0].bgColor}
                        accentColor={p[0].badgeColor}
                        onClick={() => onPosterClick(p[0].id)}
                        className="h-full min-h-[220px] md:min-h-[300px]"
                      >
                        {p[0].content}
                      </PosterCard>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Row 2: two cards */}
              {p[1] && (
                <motion.div style={{ y: cardTransforms[1], rotate: cardRotations[1] }}>
                  <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.08 }}
                  >
                    <div ref={p[1].refCallback} className="h-full">
                      <PosterCard
                        index={1}
                        categoryLabel={p[1].badge}
                        title={p[1].title}
                        description={p[1].subtitle}
                        bgColor={p[1].bgColor}
                        accentColor={p[1].badgeColor}
                        onClick={() => onPosterClick(p[1].id)}
                        className="h-full min-h-[240px] md:min-h-[340px]"
                      >
                        {p[1].content}
                      </PosterCard>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {p[2] && (
                <motion.div style={{ y: cardTransforms[2], rotate: cardRotations[2] }}>
                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.12 }}
                  >
                    <div ref={p[2].refCallback} className="h-full">
                      <PosterCard
                        index={2}
                        categoryLabel={p[2].badge}
                        title={p[2].title}
                        description={p[2].subtitle}
                        bgColor={p[2].bgColor}
                        accentColor={p[2].badgeColor}
                        onClick={() => onPosterClick(p[2].id)}
                        className="h-full min-h-[240px] md:min-h-[340px]"
                      >
                        {p[2].content}
                      </PosterCard>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Row 3: two more cards */}
              {p[3] && (
                <motion.div style={{ y: cardTransforms[3], rotate: cardRotations[3] }}>
                  <motion.div
                    initial={{ opacity: 0, y: 50, rotate: -2 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.16 }}
                  >
                    <div ref={p[3].refCallback} className="h-full">
                      <PosterCard
                        index={3}
                        categoryLabel={p[3].badge}
                        title={p[3].title}
                        description={p[3].subtitle}
                        bgColor={p[3].bgColor}
                        accentColor={p[3].badgeColor}
                        onClick={() => onPosterClick(p[3].id)}
                        className="h-full min-h-[240px] md:min-h-[300px]"
                      >
                        {p[3].content}
                      </PosterCard>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {p[4] && (
                <motion.div style={{ y: cardTransforms[4], rotate: cardRotations[4] }}>
                  <motion.div
                    initial={{ opacity: 0, y: 50, rotate: 2 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
                  >
                    <div ref={p[4].refCallback} className="h-full">
                      <PosterCard
                        index={4}
                        categoryLabel={p[4].badge}
                        title={p[4].title}
                        description={p[4].subtitle}
                        bgColor={p[4].bgColor}
                        accentColor={p[4].badgeColor}
                        onClick={() => onPosterClick(p[4].id)}
                        className="h-full min-h-[240px] md:min-h-[300px]"
                      >
                        {p[4].content}
                      </PosterCard>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
