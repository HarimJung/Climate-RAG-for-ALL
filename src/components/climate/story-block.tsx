"use client"

import { type ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type StoryLayout = "text-left" | "text-right" | "full"

interface StoryBlockProps {
  children: ReactNode
  /** Text/insight panel content (not shown for "full" layout) */
  insight?: ReactNode
  layout?: StoryLayout
  className?: string
  delay?: number
}

/**
 * Scrollytelling story block.
 *
 * - "text-left": sticky text on left, chart scrolls on right
 * - "text-right": chart on left, sticky text on right
 * - "full": chart takes the full width, no side panel
 *
 * On mobile all layouts stack vertically (text above chart).
 */
export function StoryBlock({
  children,
  insight,
  layout = "full",
  className,
  delay = 0,
}: StoryBlockProps) {
  if (layout === "full" || !insight) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{
          duration: 0.8,
          delay,
          type: "spring",
          stiffness: 60,
          damping: 16,
        }}
        className={cn("py-6", className)}
      >
        {children}
      </motion.div>
    )
  }

  const isTextLeft = layout === "text-left"

  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-8 py-6 md:grid-cols-12 md:gap-12",
        className
      )}
    >
      {/* Text panel -- sticky on desktop */}
      <motion.div
        initial={{ opacity: 0, x: isTextLeft ? -40 : 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{
          duration: 0.7,
          delay,
          type: "spring",
          stiffness: 70,
          damping: 18,
        }}
        className={cn(
          "md:sticky md:top-32 md:col-span-4",
          !isTextLeft && "md:order-2"
        )}
      >
        <div className="space-y-4">{insight}</div>
      </motion.div>

      {/* Chart panel */}
      <motion.div
        initial={{ opacity: 0, x: isTextLeft ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{
          duration: 0.8,
          delay: delay + 0.12,
          type: "spring",
          stiffness: 60,
          damping: 16,
        }}
        className={cn(
          "md:col-span-8",
          !isTextLeft && "md:order-1"
        )}
      >
        {children}
      </motion.div>
    </div>
  )
}
