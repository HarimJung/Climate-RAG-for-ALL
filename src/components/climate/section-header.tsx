"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { CardCategory } from "./chart-card"

const categoryColors: Record<CardCategory, { dot: string; text: string }> = {
  emissions: { dot: "bg-emerald-500", text: "text-emerald-700" },
  energy: { dot: "bg-amber-500", text: "text-amber-700" },
  economy: { dot: "bg-blue-500", text: "text-blue-700" },
  vulnerability: { dot: "bg-rose-500", text: "text-rose-700" },
}

interface SectionHeaderProps {
  category: CardCategory
  title: string
  subtitle?: string
  className?: string
}

/**
 * Editorial section header.
 * Left-aligned large title with a colored dot accent, like a magazine feature.
 */
export function SectionHeader({
  category,
  title,
  subtitle,
  className,
}: SectionHeaderProps) {
  const colors = categoryColors[category]

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className={cn("mt-28 mb-10 md:mt-36 md:mb-14", className)}
    >
      {/* Animated horizontal rule */}
      <motion.div
        variants={{
          hidden: { scaleX: 0, originX: 0 },
          visible: { scaleX: 1 },
        }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 h-px w-full bg-slate-200"
      />

      <div className="flex items-start gap-4">
        {/* Colored dot */}
        <motion.div
          variants={{
            hidden: { scale: 0 },
            visible: {
              scale: 1,
              transition: { type: "spring", stiffness: 400, damping: 15 },
            },
          }}
          className={cn("mt-2.5 h-3 w-3 shrink-0 rounded-full", colors.dot)}
        />

        <div className="space-y-2">
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
              },
            }}
            className="text-2xl font-bold tracking-tight text-slate-900 text-balance md:text-4xl"
          >
            {title}
          </motion.h2>

          {subtitle && (
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5 },
                },
              }}
              className="max-w-xl text-sm leading-relaxed text-slate-500 md:text-base"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
