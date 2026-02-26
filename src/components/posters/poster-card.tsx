'use client';

import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Stat block for lightbox sidebar ─────────────────────────────────────── */

interface StatBlockProps {
  label: string;
  value: string;
  color?: string;
}

function StatBlock({ label, value, color = '#0066FF' }: StatBlockProps) {
  return (
    <div className="rounded-xl bg-[#F8F9FA] px-4 py-3">
      <p className="text-xs text-[#8888A0]">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

/* ── Lightbox overlay ────────────────────────────────────────────────────── */

interface LightboxProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  stats?: StatBlockProps[];
  downloading?: boolean;
  onDownload?: () => void;
  children: ReactNode;
}

export function PosterLightbox({
  open, onClose, title, subtitle, stats, downloading, onDownload, children,
}: LightboxProps) {
  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/[0.06] md:flex-row"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#4A4A6A] shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-[#1A1A2E]"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Poster preview */}
            <div className="flex-1 overflow-auto bg-[#F8F9FA] p-6 md:p-8">
              {children}
            </div>

            {/* Sidebar info */}
            <div className="flex w-full flex-col border-t border-[#E8E8ED] p-6 md:w-72 md:border-l md:border-t-0">
              <h3 className="text-lg font-bold text-[#1A1A2E]">{title}</h3>
              {subtitle && <p className="mt-1 text-sm text-[#4A4A6A]">{subtitle}</p>}

              {stats && stats.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {stats.map((s, i) => <StatBlock key={i} {...s} />)}
                </div>
              )}

              <div className="mt-auto pt-6">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    disabled={downloading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#0052CC] disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {downloading ? 'Preparing\u2026' : 'Download PNG'}
                  </button>
                )}
                <p className="mt-3 text-center text-[10px] text-[#8888A0]">
                  1080\u00d71080px &middot; visualclimate.org
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
