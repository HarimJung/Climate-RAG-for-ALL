'use client';

import { useRef, type ReactNode } from 'react';
import { type MotionValue, motion, useScroll, useTransform, useSpring } from 'framer-motion';

/* ── Card data for the 6 poster mini-cards in the hero ─────────────────── */

const posterCards = [
  { title: 'World Scoreboard',  subtitle: 'Climate action class',      color: '#F0F4FF', accent: '#3B5998' },
  { title: 'Energy Flow',       subtitle: 'Electricity mix by source',  color: '#ECFDF5', accent: '#059669' },
  { title: 'Paris Gap',         subtitle: 'Pre vs post-Paris CAGR',     color: '#FFFBEB', accent: '#D97706' },
  { title: 'Transition Race',   subtitle: 'Renewable % ranking',        color: '#F5F3FF', accent: '#7C3AED' },
  { title: 'Carbon Inequality', subtitle: 'CO\u2082 per capita gap',    color: '#FFF1F2', accent: '#E11D48' },
  { title: 'Air Quality',       subtitle: 'PM2.5 vs WHO guideline',     color: '#F0FDFA', accent: '#0D9488' },
];

/* ── Fan state: angles, y offsets, x offsets (px from center) ─────────── */

const fanConfig = [
  { angle: -18, y: 20, x: -160 },
  { angle: -10, y: 8,  x: -96 },
  { angle: -3,  y: 0,  x: -32 },
  { angle: 3,   y: 0,  x: 32 },
  { angle: 10,  y: 8,  x: 96 },
  { angle: 18,  y: 20, x: 160 },
];

/* Grid state: bento layout (1 wide top + 2+2, card 5 offscreen) */
const gridConfig = [
  { x: 0,    y: -180, s: 2.5 },   // Scoreboard: wide top center
  { x: -145, y: 20,   s: 1.9 },   // Energy: mid-left
  { x: 145,  y: 20,   s: 1.9 },   // Paris Gap: mid-right
  { x: -145, y: 200,  s: 1.9 },   // Race: bottom-left
  { x: 145,  y: 200,  s: 1.9 },   // Inequality: bottom-right
  { x: 500,  y: 300,  s: 1.0 },   // Air: offscreen right
];

/* Card sizes */
const FAN_W = 'w-28 md:w-36';
const FAN_H = 'h-36 md:h-48';

/* ── Single animated card ─────────────────────────────────────────────── */

function AnimatedCard({
  card,
  index,
  scrollProgress,
}: {
  card: (typeof posterCards)[0];
  index: number;
  scrollProgress: MotionValue<number>;
}) {
  const fan = fanConfig[index];
  const grid = gridConfig[index];

  /*
   * Timeline:
   * 0.00 – 0.30  → fan (resting)
   * 0.30 – 0.65  → transition to grid
   * 0.65 – 1.00  → grid (resting, NO fade out — cards persist)
   */
  const x = useSpring(
    useTransform(scrollProgress, [0, 0.28, 0.62, 1], [fan.x, fan.x, grid.x, grid.x]),
    { stiffness: 90, damping: 20 },
  );
  const y = useSpring(
    useTransform(scrollProgress, [0, 0.28, 0.62, 1], [fan.y, fan.y, grid.y, grid.y]),
    { stiffness: 90, damping: 20 },
  );
  const rotate = useSpring(
    useTransform(scrollProgress, [0, 0.28, 0.62, 1], [fan.angle, fan.angle, 0, 0]),
    { stiffness: 90, damping: 20 },
  );
  const scale = useSpring(
    useTransform(scrollProgress, [0, 0.28, 0.62, 1], [1, 1, grid.s, grid.s]),
    { stiffness: 90, damping: 20 },
  );

  // Fade out at end so bento section takes over seamlessly
  const opacity = useTransform(scrollProgress, [0.85, 0.98], [1, 0]);
  const zFan = posterCards.length - Math.abs(index - 2.5);

  return (
    <motion.div
      className="absolute"
      style={{ x, y, rotate, scale, opacity, zIndex: Math.round(zFan) }}
      initial={{ opacity: 0, y: 80, rotate: 0, scale: 0.6 }}
      animate={{ opacity: 1, y: fan.y, rotate: fan.angle, scale: 1 }}
      transition={{
        duration: 0.7,
        delay: 0.4 + index * 0.07,
        type: 'spring',
        stiffness: 100,
        damping: 14,
      }}
    >
      <div
        className={`${FAN_W} ${FAN_H} flex flex-col overflow-hidden rounded-2xl border border-white/70 shadow-xl`}
        style={{ backgroundColor: card.color }}
      >
        <div className="flex h-full flex-col p-3 md:p-4">
          {/* Accent bar */}
          <div
            className="mb-2 h-1.5 w-8 rounded-full md:w-10"
            style={{ backgroundColor: card.accent }}
          />
          {/* Title */}
          <p className="text-[10px] font-bold leading-tight text-[#1A1A2E] md:text-xs">
            {card.title}
          </p>
          <p className="mt-0.5 text-[8px] leading-tight text-[#4A4A6A] md:text-[10px]">
            {card.subtitle}
          </p>
          {/* Mini chart bars */}
          <div className="mt-auto flex items-end gap-1">
            {[0.35, 0.7, 0.5, 0.9, 0.65, 0.4].map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-sm md:w-2.5"
                style={{
                  height: `${h * 28}px`,
                  backgroundColor: card.accent,
                  opacity: 0.3 + h * 0.5,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Hero Section ─────────────────────────────────────────────────────── */

interface PosterHeroSectionProps {
  totalPosters: number;
  totalCountries: number;
}

export function PosterHeroSection({ totalPosters, totalCountries }: PosterHeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Text parallax
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -120]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3, 0.55], [1, 1, 0]);
  const subtitleOpacity = useTransform(scrollYProgress, [0, 0.2, 0.45], [1, 1, 0]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <div ref={containerRef} className="relative h-[220vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden bg-[#F8F9FA]">
        {/* Decorative blurred circles */}
        <div className="pointer-events-none absolute left-[-80px] top-[60px] h-44 w-44 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="pointer-events-none absolute right-[-40px] top-[80px] h-56 w-56 rounded-full bg-rose-100/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[60px] right-[15%] h-48 w-48 rounded-full bg-amber-100/40 blur-3xl" />

        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ opacity: titleOpacity }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8E8ED] bg-white px-4 py-1.5 text-xs font-medium text-[#4A4A6A] shadow-sm"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0066FF]" />
            Climate Posters
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ y: titleY, opacity: titleOpacity }}
            className="max-w-2xl text-balance text-4xl font-bold tracking-tight text-[#1A1A2E] md:text-5xl lg:text-7xl"
          >
            Data tells the story.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{ opacity: subtitleOpacity }}
            className="mt-5 max-w-lg text-pretty text-sm leading-relaxed text-[#4A4A6A] md:text-base"
          >
            {totalPosters} poster types &middot; {totalCountries}+ countries &middot; Download as PNG &middot; Share on LinkedIn
          </motion.p>

          {/* Card fan / grid container */}
          <div className="relative mt-12 flex h-64 w-full items-center justify-center md:mt-16 md:h-80">
            {posterCards.map((card, i) => (
              <AnimatedCard
                key={card.title}
                card={card}
                index={i}
                scrollProgress={scrollYProgress}
              />
            ))}
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{ opacity: scrollHintOpacity }}
            className="mt-6 flex flex-col items-center gap-2"
          >
            <span className="text-xs text-[#8888A0]">Scroll to explore</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8888A0]">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Watermark */}
          <p className="text-[10px] tracking-widest text-[#8888A0]/50">visualclimate.org</p>
        </div>
      </div>
    </div>
  );
}
