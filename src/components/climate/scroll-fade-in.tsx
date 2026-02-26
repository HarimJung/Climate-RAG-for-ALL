"use client"

import { type ReactNode } from "react"
import { motion } from "framer-motion"

interface ScrollFadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  duration?: number
  /** Add a slight scale effect */
  scale?: boolean
}

const directionMap = {
  up: { y: 1, x: 0 },
  down: { y: -1, x: 0 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
}

export function ScrollFadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 40,
  duration = 0.7,
  scale = false,
}: ScrollFadeInProps) {
  const dir = directionMap[direction]

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: dir.x * distance,
        y: dir.y * distance,
        scale: scale ? 0.95 : 1,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration,
        delay,
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
