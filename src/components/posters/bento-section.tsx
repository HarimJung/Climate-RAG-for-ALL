'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ── Bento card wrapper ──────────────────────────────────────────────────── */

interface BentoCardProps {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  children: ReactNode;
  onDownload?: () => void;
  downloading?: boolean;
}

/* ISSUE 10: shadow-md, hover shadow-xl scale-[1.02] */
function BentoCard({ title, subtitle, badge, badgeColor, children, onDownload, downloading }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
      className="group relative h-full overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/[0.06] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4">
        <div>
          <span
            className="mb-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${badgeColor}14`, color: badgeColor }}
          >
            {badge}
          </span>
          <h3 className="text-sm font-bold text-[#1A1A2E]">{title}</h3>
          <p className="text-[11px] text-[#4A4A6A]">{subtitle}</p>
        </div>
        {onDownload && (
          <button
            onClick={e => { e.stopPropagation(); onDownload(); }}
            disabled={downloading}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F8F9FA] text-[#4A4A6A] opacity-0 transition-all duration-200 hover:bg-[#0066FF] hover:text-white group-hover:opacity-100 disabled:opacity-40"
            aria-label="Download PNG"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        )}
      </div>

      {/* ISSUE 2: Chart content — overflow-hidden clips inner poster borders */}
      <div className="overflow-hidden px-2 pb-2 pt-1">
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
  gridSpan?: string;
  content: ReactNode;
  onDownload?: () => void;
  downloading?: boolean;
  refCallback?: (el: HTMLDivElement | null) => void;
}

interface BentoSectionProps {
  posters: BentoPoster[];
}

/* ISSUE 3: 4-col grid, specific spans, gap-2, auto-rows 180px */
/* ISSUE 12: py-8 instead of py-16 */
export function BentoSection({ posters }: BentoSectionProps) {
  return (
    <section className="bg-[#F8F9FA] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
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

        {/* ISSUE 3: Packed bento grid — 4 cols, 180px rows, gap-2 */}
        <div className="grid gap-2 md:grid-cols-4" style={{ gridAutoRows: '180px' }}>
          {posters.map(p => (
            <div
              key={p.id}
              ref={p.refCallback}
              className={`overflow-hidden ${p.gridSpan ?? ''}`}
            >
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
