'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface PosterCardData {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  content?: ReactNode;
  refCallback?: (el: HTMLDivElement | null) => void;
}

interface PosterCardProps {
  poster: PosterCardData;
  index?: number;
  className?: string;
  onClick?: () => void;
  onDownload?: () => void;
  downloading?: boolean;
}

/* ── PosterCard ──────────────────────────────────────────────────────────── */

export function PosterCard({
  poster,
  index = 0,
  className = '',
  onClick,
  onDownload,
  downloading,
}: PosterCardProps) {
  return (
    <motion.div
      layoutId={`poster-${poster.id}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      whileHover={{ scale: 1.02 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 18,
        delay: index * 0.08,
      }}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl ${className}`}
    >
      {/* Poster content fills 100% */}
      <div ref={poster.refCallback} className="absolute inset-0 w-full h-full">
        {poster.content}
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
        <span
          className="inline-block px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider mb-1"
        >
          {poster.category}
        </span>
        <h3 className="text-white font-bold text-sm leading-tight">
          {poster.title}
        </h3>
      </div>

      {/* Download button on hover */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        whileHover={{ opacity: 1 }}
        className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-[#1A1A2E] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
        onClick={(e) => {
          e.stopPropagation();
          onDownload?.();
        }}
        disabled={downloading}
      >
        {downloading ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        )}
      </motion.button>
    </motion.div>
  );
}
