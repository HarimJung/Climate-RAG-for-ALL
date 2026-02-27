'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface PosterCardProps {
  index: number;
  categoryLabel: string;
  title: string;
  description?: string;
  bgColor: string;
  accentColor: string;
  onClick?: () => void;
  className?: string;
  aspectRatio?: string;
  children?: ReactNode; // renderPoster() output goes here
}

/* ── 3D Tilt Card ───────────────────────────────────────────────────────── */

export function PosterCard({
  index,
  categoryLabel,
  title,
  description,
  bgColor,
  accentColor,
  onClick,
  className = '',
  aspectRatio,
  children,
}: PosterCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        type: 'spring',
        stiffness: 90,
        damping: 18,
        delay: index * 0.05,
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        aspectRatio,
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)',
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ backgroundColor: bgColor }} />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accentColor}08, transparent 40%)`,
        }}
      />

      <div className="relative flex h-full flex-col justify-between p-4">
        {/* Poster content area — renderPoster() output */}
        <div className="flex flex-1 items-center justify-center overflow-hidden">
          {children}
        </div>

        {/* Bottom label area */}
        <div className="mt-3">
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 + 0.4 }}
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            {categoryLabel}
          </motion.span>
          <motion.h3
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 + 0.5 }}
            className="mt-1 text-base font-semibold leading-snug text-slate-900 md:text-lg"
          >
            {title}
          </motion.h3>

          {/* Hover-reveal description */}
          {description && (
            <div className="h-0 overflow-hidden opacity-0 transition-all duration-400 ease-out group-hover:h-auto group-hover:mt-2 group-hover:opacity-100">
              <p className="text-xs leading-relaxed text-slate-500">
                {description}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
