'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/* ── Mini poster card for the hero fan ──────────────────────────────────── */

interface MiniCardData {
  title: string;
  subtitle: string;
  color: string;
  accent: string;
}

const POSTER_CARDS: MiniCardData[] = [
  { title: 'Energy Flow',        subtitle: 'Electricity mix by source', color: '#10B981', accent: 'bg-emerald-500' },
  { title: 'Carbon Inequality',  subtitle: 'CO₂ per capita gap',       color: '#3B82F6', accent: 'bg-blue-500' },
  { title: 'Paris Gap',          subtitle: 'Pre vs post-Paris CAGR',   color: '#F59E0B', accent: 'bg-amber-500' },
  { title: 'Air Quality',        subtitle: 'PM2.5 vs WHO guideline',   color: '#EF4444', accent: 'bg-red-500' },
  { title: 'Transition Race',    subtitle: 'Renewable % ranking',      color: '#8B5CF6', accent: 'bg-violet-500' },
  { title: 'World Scoreboard',   subtitle: 'Climate action class',     color: '#0066FF', accent: 'bg-blue-600' },
];

const fanAngles  = [-15, -9, -3, 3, 9, 15];
const fanYShifts = [16, 6, 0, 0, 6, 16];

/* ISSUE 5: Bigger cards w-[200px] h-[280px] */
function MiniCard({ card, index }: { card: MiniCardData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80, rotate: fanAngles[index] * 2, scale: 0.7 }}
      whileInView={{ opacity: 1, y: fanYShifts[index], rotate: fanAngles[index], scale: 1 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.8,
        delay: 0.1 * index,
        type: 'spring',
        stiffness: 80,
        damping: 14,
      }}
      whileHover={{ y: fanYShifts[index] - 16, rotate: 0, scale: 1.08, zIndex: 30 }}
      className="relative cursor-default"
      style={{ zIndex: index === 2 || index === 3 ? 20 : 10, marginLeft: index > 0 ? -32 : 0 }}
    >
      <div className="flex h-[280px] w-[200px] flex-col rounded-xl bg-white p-5 shadow-lg ring-1 ring-black/[0.06] transition-shadow duration-300 hover:shadow-2xl">
        <div className={`h-2 w-10 rounded-full ${card.accent} mb-4`} />
        <h3 className="text-sm font-bold text-[#1A1A2E]">{card.title}</h3>
        <p className="mt-1.5 text-xs leading-snug text-[#4A4A6A]">{card.subtitle}</p>
        <div className="mt-auto flex items-end gap-1.5">
          {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8].map((h, i) => (
            <div
              key={i}
              className="w-4 rounded-sm"
              style={{ height: `${h * 60}px`, backgroundColor: card.color, opacity: 0.3 + h * 0.5 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Hero Section ───────────────────────────────────────────────────────── */

interface PosterHeroSectionProps {
  totalPosters: number;
  totalCountries: number;
}

export function PosterHeroSection({ totalPosters, totalCountries }: PosterHeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-[#F8F9FA] px-4 pb-8 pt-20"
    >
      {/* ISSUE 4: Removed floating bg particles */}

      <motion.div style={{ opacity }} className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#E8E8ED] bg-white px-4 py-1.5 text-xs font-medium text-[#4A4A6A] shadow-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#0066FF]" />
          Climate Posters
        </motion.div>

        {/* ISSUE 4: Bigger title text-5xl md:text-7xl */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex flex-col items-center gap-3"
        >
          <h1 className="text-5xl font-bold tracking-tight text-[#1A1A2E] md:text-7xl">
            Data tells the story.
          </h1>
          <p className="max-w-lg text-base text-[#4A4A6A]">
            {totalPosters} poster types &middot; {totalCountries}+ countries &middot; Download as PNG &middot; Share on LinkedIn
          </p>
        </motion.div>

        {/* Card fan */}
        <div className="mt-4 hidden items-end justify-center md:flex">
          {POSTER_CARDS.map((card, i) => (
            <MiniCard key={card.title} card={card} index={i} />
          ))}
        </div>

        {/* Mobile: simple grid */}
        <div className="mt-4 grid grid-cols-3 gap-3 md:hidden">
          {POSTER_CARDS.slice(0, 3).map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex h-24 w-24 flex-col rounded-lg bg-white p-3 shadow ring-1 ring-black/[0.06]"
            >
              <div className={`h-1 w-5 rounded-full ${card.accent} mb-1.5`} />
              <span className="text-[9px] font-bold text-[#1A1A2E]">{card.title}</span>
            </motion.div>
          ))}
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="mt-6 flex flex-col items-center gap-2"
        >
          <p className="text-xs text-[#8888A0]">Scroll to explore</p>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8888A0]">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Watermark */}
        <p className="text-[10px] tracking-widest text-[#8888A0]/50">visualclimate.org</p>
      </motion.div>
    </section>
  );
}
