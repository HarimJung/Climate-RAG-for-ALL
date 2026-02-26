'use client';

import React, { useRef, useState, useEffect, type ReactNode } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  animate,
  useInView,
} from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════════
   ScrollProgress — Fixed thin bar at top showing page scroll progress
   ═══════════════════════════════════════════════════════════════════════════ */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-50 h-[3px] origin-left"
      style={{
        scaleX: scrollYProgress,
        backgroundColor: '#0066FF',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ScrollyScene — Sticky-scroll section: narrative left + chart right
   ═══════════════════════════════════════════════════════════════════════════ */

interface StepConfig {
  content: ReactNode;
}

interface ScrollySceneProps {
  id?: string;
  className?: string;
  steps: StepConfig[];
  children: (activeStep: number) => ReactNode;
  sectionRef?: React.Ref<HTMLDivElement>;
}

function StepBlock({
  children,
  index,
  onActive,
}: {
  children: ReactNode;
  index: number;
  onActive: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: '-40% 0px -40% 0px' });

  useEffect(() => {
    if (isInView) onActive(index);
  }, [isInView, index, onActive]);

  return (
    <div
      ref={ref}
      data-step={index}
      className="flex min-h-[35vh] items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20% 0px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ScrollyScene({
  id,
  className = '',
  steps,
  children,
  sectionRef,
}: ScrollySceneProps) {
  const [activeStep, setActiveStep] = useState(0);

  const handleActive = React.useCallback((i: number) => {
    setActiveStep(i);
  }, []);

  /* Dynamic min-height: number of steps * 50vh */
  const dynamicMinHeight = `${steps.length * 50}vh`;

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`relative ${className}`}
      style={{ minHeight: dynamicMinHeight }}
    >
      <div className="mx-auto max-w-[1400px] px-4">
        {/* Desktop: side-by-side | Mobile: stacked */}
        <div className="relative flex flex-col md:flex-row md:gap-8">
          {/* Left: scrolling narrative steps (38%) */}
          <div className="relative w-full md:w-[38%]">
            {steps.map((step, i) => (
              <StepBlock key={i} index={i} onActive={handleActive}>
                {step.content}
              </StepBlock>
            ))}
          </div>

          {/* Right: sticky chart area (62%) */}
          <div className="w-full md:w-[62%] md:self-start md:sticky" style={{ top: '80px' }}>
            <div
              style={{
                width: '100%',
                height: 'calc(100vh - 160px)',
                overflow: 'auto',
              }}
            >
              <div className="flex h-full w-full flex-col justify-center">
                {children(activeStep)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FanCards — 3 cards that fan out on scroll
   ═══════════════════════════════════════════════════════════════════════════ */

interface FanCardData {
  label: string;
  icon: string;
  text: string;
  accent: string;
}

export function FanCards({ cards }: { cards: FanCardData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  // Fan-out angles: [-8, 0, 8]
  const rotate0 = useTransform(scrollYProgress, [0, 1], [0, -8]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, 8]);

  // Translate X for fanning: [-60, 0, 60]
  const tx0 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const tx1 = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const tx2 = useTransform(scrollYProgress, [0, 1], [0, 60]);

  // Scale middle card
  const scale1 = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  const rotations = [rotate0, rotate1, rotate2];
  const translations = [tx0, tx1, tx2];
  const scales = [
    useTransform(scrollYProgress, [0, 1], [1, 1]),
    scale1,
    useTransform(scrollYProgress, [0, 1], [1, 1]),
  ];
  const zIndexes = [1, 10, 1];

  return (
    <div ref={containerRef} className="flex items-center justify-center py-12">
      <div className="relative flex items-center justify-center" style={{ height: 360, width: '100%', maxWidth: 960 }}>
        {cards.slice(0, 3).map((card, i) => (
          <motion.div
            key={card.label}
            className="absolute rounded-2xl border border-gray-200 bg-white p-6"
            style={{
              minWidth: 260,
              maxWidth: 300,
              width: 280,
              rotateZ: rotations[i],
              x: translations[i],
              scale: scales[i],
              zIndex: zIndexes[i],
              boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
            }}
          >
            <div className="mb-3 text-3xl">{card.icon}</div>
            <h4
              className="mb-2 text-sm font-semibold uppercase tracking-wider"
              style={{ color: card.accent }}
            >
              {card.label}
            </h4>
            <p className="text-sm leading-relaxed text-[--text-secondary]">
              {card.text}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CountUp — Animated number counting from 0 to target on scroll
   ═══════════════════════════════════════════════════════════════════════════ */

interface CountUpProps {
  target: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({
  target,
  decimals = 1,
  suffix = '',
  prefix = '',
  duration = 1.5,
  className = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(motionVal, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        setDisplay(v.toFixed(decimals));
      },
    });

    return () => controls.stop();
  }, [isInView, target, decimals, duration, motionVal]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
