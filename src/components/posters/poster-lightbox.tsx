'use client';

import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface StatItem {
  label: string;
  value: string;
  color?: string;
}

interface PosterLightboxProps {
  open: boolean;
  posterId?: string;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  categoryColor?: string;
  stats?: StatItem[];
  downloading?: boolean;
  onDownload?: () => void;
  children: ReactNode;
}

/* ── PosterLightbox ──────────────────────────────────────────────────────── */

export function PosterLightbox({
  open,
  posterId,
  onClose,
  title,
  subtitle,
  description,
  category,
  categoryColor = '#0066FF',
  stats,
  downloading,
  onDownload,
  children,
}: PosterLightboxProps) {
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Content Container */}
          <motion.div
            layoutId={posterId ? `poster-${posterId}` : undefined}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left: Poster Preview */}
            <div className="flex-1 bg-[#F8F9FA] relative flex items-center justify-center p-8 overflow-auto min-h-[300px]">
              {children}
            </div>

            {/* Right: Sidebar Info */}
            <div className="w-full md:w-[400px] bg-white p-8 flex flex-col border-l border-slate-100 overflow-y-auto">
              <div className="mb-6">
                {category && (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
                    style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
                  >
                    {category}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-[#1A1A2E] leading-tight mb-2">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-[#4A4A6A] mb-2">{subtitle}</p>
                )}
                {description && (
                  <p className="text-sm text-[#4A4A6A] leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              {stats && stats.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {stats.map((stat, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-[#F8F9FA]">
                      <span className="text-[10px] font-bold text-[#8888A0] uppercase tracking-widest block mb-1">
                        {stat.label}
                      </span>
                      <span className="text-lg font-bold" style={{ color: stat.color ?? '#1A1A2E' }}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto flex flex-col gap-3">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    disabled={downloading}
                    className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {downloading ? 'Preparing\u2026' : 'Download PNG'}
                  </button>
                )}
                <p className="mt-4 text-[10px] text-[#8888A0] text-center uppercase tracking-widest font-medium">
                  1080&times;1080px &middot; visualclimate.org
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
