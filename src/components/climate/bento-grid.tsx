"use client"

import { type ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BentoGridProps {
  children: ReactNode
  className?: string
  columns?: 2 | 3
}

/**
 * CSS Grid wrapper for bento-style card layouts.
 * Children stagger in as the grid scrolls into view.
 */
export function BentoGrid({
  children,
  className,
  columns = 2,
}: BentoGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className={cn(
        "grid grid-cols-1 gap-4 md:gap-5",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-3",
        className
      )}
    >
      {children}
    </motion.div>
  )
}
