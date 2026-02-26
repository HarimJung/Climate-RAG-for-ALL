"use client"

import { type ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type CardCategory = "emissions" | "energy" | "economy" | "vulnerability"

const categoryStyles: Record<
  CardCategory,
  {
    accent: string
    badge: string
    glow: string
  }
> = {
  emissions: {
    accent: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    glow: "group-hover:shadow-emerald-100/40",
  },
  energy: {
    accent: "text-amber-700",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    glow: "group-hover:shadow-amber-100/40",
  },
  economy: {
    accent: "text-blue-700",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    glow: "group-hover:shadow-blue-100/40",
  },
  vulnerability: {
    accent: "text-rose-700",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    glow: "group-hover:shadow-rose-100/40",
  },
}

interface ChartCardProps {
  children: ReactNode
  category: CardCategory
  title?: string
  subtitle?: string
  className?: string
  badge?: string
}

/**
 * Clean chart container card. Full-width by default.
 * No grid/span logic -- parent StoryBlock handles layout.
 */
export function ChartCard({
  children,
  category,
  title,
  subtitle,
  className,
  badge,
}: ChartCardProps) {
  const styles = categoryStyles[category]

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg md:p-7",
        styles.glow,
        className
      )}
    >
      {/* Header */}
      {(title || badge) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            {title && (
              <h3 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          {badge && (
            <span
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium",
                styles.badge
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}

      <div>{children}</div>
    </div>
  )
}

export { categoryStyles }
