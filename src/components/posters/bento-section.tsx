'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ── Bento card wrapper ──────────────────────────────────────────────────── */

interface BentoCardProps {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  span?: string;      // grid span classes
  children: ReactNode; // poster content
  onDownload?: () => void;
  downloading?: boolean;
}

function BentoCard({ title, subtitle, badge, badgeColor, span, children, onDownload, downloading }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${span ?? ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5">
        <div>
          <span
            className="mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${badgeColor}14`, color: badgeColor }}
          >
            {badge}
          </span>
          <h3 className="text-base font-bold text-[#1A1A2E]">{title}</h3>
          <p className="text-xs text-[#4A4A6A]">{subtitle}</p>
        </div>
        {onDownload && (
          <button
            onClick={e => { e.stopPropagation(); onDownload(); }}
            disabled={downloading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8F9FA] text-[#4A4A6A] opacity-0 transition-all duration-200 hover:bg-[#0066FF] hover:text-white group-hover:opacity-100 disabled:opacity-40"
            aria-label="Download PNG"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Chart content */}
      <div className="px-5 pb-5 pt-3">
        {children}
      </div>
    </motion.div>
  );
}

/* ── Bento section ───────────────────────────────────────────────────────── */

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
}

interface BentoSectionProps {
  posters: BentoPoster[];
}

export function BentoSection({ posters }: BentoSectionProps) {
  // Layout: first poster is featured (2-col span), rest fill in
  // Row 1: featured (col-span-2) + stacked pair (2 items col-span-1 each)
  // Row 2: remaining items evenly

  const featured = posters[0];
  const secondRow = posters.slice(1, 3); // energy + gap
  const thirdRow = posters.slice(3);      // race, inequality, air

  return (
    <section className="bg-[#F8F9FA] px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <span className="mb-2 inline-block rounded-full border border-[#E8E8ED] bg-white px-3 py-1 text-xs font-medium text-[#4A4A6A]">
            Featured
          </span>
          <h2 className="text-2xl font-bold text-[#1A1A2E] md:text-3xl">
            Poster Collection
          </h2>
          <p className="mt-2 text-sm text-[#4A4A6A]">
            Click any poster to expand &middot; Download as PNG for social sharing
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Featured: World Scoreboard spans 2 cols */}
          {featured && (
            <div ref={featured.refCallback} className="md:col-span-2">
              <BentoCard
                title={featured.title}
                subtitle={featured.subtitle}
                badge={featured.badge}
                badgeColor={featured.badgeColor}
                onDownload={featured.onDownload}
                downloading={featured.downloading}
              >
                {featured.content}
              </BentoCard>
            </div>
          )}

          {/* Stacked pair: Energy + Gap */}
          <div className="flex flex-col gap-4">
            {secondRow.map(p => (
              <div key={p.id} ref={p.refCallback}>
                <BentoCard
                  title={p.title}
                  subtitle={p.subtitle}
                  badge={p.badge}
                  badgeColor={p.badgeColor}
                  onDownload={p.onDownload}
                  downloading={p.downloading}
                >
                  {p.content}
                </BentoCard>
              </div>
            ))}
          </div>

          {/* Bottom row: fills remaining */}
          {thirdRow.map(p => (
            <div key={p.id} ref={p.refCallback}>
              <BentoCard
                title={p.title}
                subtitle={p.subtitle}
                badge={p.badge}
                badgeColor={p.badgeColor}
                onDownload={p.onDownload}
                downloading={p.downloading}
              >
                {p.content}
              </BentoCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
