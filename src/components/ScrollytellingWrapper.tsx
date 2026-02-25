'use client';

import { type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

// ── Animation variants ────────────────────────────────────────────────────────
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

const VP = { once: true, amount: 0.2 as const };

// ── Scene wrapper ─────────────────────────────────────────────────────────────
export function Scene({
  children,
  variant = 'fade',
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  variant?: 'fade' | 'slide';
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VP}
      variants={variant === 'slide' ? slideUp : fadeIn}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Scene headline (narrative prompt above a section) ─────────────────────────
export function SceneHeadline({
  children,
  sub,
}: {
  children: ReactNode;
  sub?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VP}
      variants={fadeIn}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className="mx-auto max-w-[1200px] px-4 pb-2 pt-16"
    >
      <h2 className="text-2xl font-semibold text-[--text-primary] md:text-3xl">
        {children}
      </h2>
      {sub && (
        <p className="mt-2 text-base text-[--text-secondary]">{sub}</p>
      )}
    </motion.div>
  );
}

// ── Fan-card summary (3 stacked cards that fan out on scroll) ─────────────────
interface FanCard {
  label: string;
  icon: string;
  text: string;
  accent: string; // hex
}

const fanContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fanCard: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export function FanCardSummary({ cards }: { cards: [FanCard, FanCard, FanCard] }) {
  const rotations = ['-3deg', '0deg', '3deg'];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VP}
      variants={fanContainer}
      className="mx-auto grid max-w-[1200px] gap-5 px-4 py-10 md:grid-cols-3"
    >
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          variants={fanCard}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          whileHover={{ y: -6, scale: 1.02 }}
          className="relative rounded-2xl border border-[--border-card] bg-white p-6"
          style={{
            boxShadow: 'var(--shadow-card)',
            transform: `rotate(${rotations[i]})`,
          }}
        >
          {/* Accent top bar */}
          <div
            className="absolute left-0 top-0 h-1 w-full rounded-t-2xl"
            style={{ backgroundColor: c.accent }}
          />
          <p className="mb-1 text-2xl">{c.icon}</p>
          <h4
            className="mb-2 text-sm font-bold uppercase tracking-wider"
            style={{ color: c.accent }}
          >
            {c.label}
          </h4>
          <p className="text-sm leading-relaxed text-[--text-secondary]">
            {c.text}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
