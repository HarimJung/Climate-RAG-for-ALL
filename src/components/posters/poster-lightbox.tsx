'use client';

import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2 } from 'lucide-react';

/* ── Stat block for sidebar ─────────────────────────────────────────────── */

interface StatBlockProps {
  label: string;
  value: string;
  color?: string;
}

function StatBlock({ label, value, color = '#0066FF' }: StatBlockProps) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <span className="text-lg font-bold text-slate-900" style={{ color }}>
        {value}
      </span>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </div>
  );
}

/* ── Lightbox ───────────────────────────────────────────────────────────── */

interface PosterLightboxProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  categoryColor?: string;
  bgColor?: string;
  description?: string;
  stats?: StatBlockProps[];
  downloading?: boolean;
  onDownload?: () => void;
  children: ReactNode; // renderPoster output with ref
}

export function PosterLightbox({
  open, onClose, title, subtitle, categoryLabel, categoryColor,
  bgColor, description, stats, downloading, onDownload, children,
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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:text-slate-900"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left: poster preview */}
            <div
              className="flex flex-1 items-center justify-center overflow-auto p-8 md:p-12"
              style={{ backgroundColor: bgColor ?? '#F8F9FA' }}
            >
              {children}
            </div>

            {/* Right: sidebar info */}
            <div className="flex w-full flex-col justify-between p-8 md:w-[40%] md:p-10">
              <div>
                {categoryLabel && (
                  <span
                    className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: bgColor ?? '#F0F4FF',
                      color: categoryColor ?? '#3B5998',
                    }}
                  >
                    {categoryLabel}
                  </span>
                )}

                <h2 className="mt-4 text-2xl font-bold text-slate-900">
                  {title}
                </h2>

                {subtitle && (
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                )}

                {description && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {description}
                  </p>
                )}

                {/* Stats grid */}
                {stats && stats.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {stats.map((stat, i) => (
                      <StatBlock key={i} {...stat} />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? 'Preparing\u2026' : 'Download PNG'}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title, url: window.location.href }).catch(() => {});
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <p className="mt-1 text-center text-[10px] text-slate-400">
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
