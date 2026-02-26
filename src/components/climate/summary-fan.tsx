"use client"

import { type ReactNode, useEffect, useState } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { cn } from "@/lib/utils"

interface SummaryCardData {
  title: string
  content: ReactNode
  bgClass?: string
  textClass?: string
}

interface SummaryFanProps {
  cards: [SummaryCardData, SummaryCardData, SummaryCardData]
  title?: string
  subtitle?: string
  className?: string
}

const defaultColors = [
  { bg: "bg-emerald-600", text: "text-white" },
  { bg: "bg-slate-900", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
]

// Fan rotation for desktop: left card tilts left, center straight, right tilts right
const fanRotations = [-6, 0, 6]
const fanTranslateY = [8, 0, 8]

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])
  return isDesktop
}

export function SummaryFan({
  cards,
  title = "Key Takeaways",
  subtitle,
  className,
}: SummaryFanProps) {
  const isDesktop = useIsDesktop()

  return (
    <section
      className={cn(
        "mt-20 flex flex-col items-center px-4 py-16 md:mt-28",
        className
      )}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-14 text-center"
      >
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-4 h-[2px] w-12 origin-center rounded-full bg-slate-900"
        />
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        )}
      </motion.div>

      {/* Fan cards */}
      <div className="relative flex w-full max-w-4xl flex-col items-center gap-4 md:flex-row md:justify-center md:gap-0">
        {cards.map((card, i) => {
          const color = defaultColors[i]
          const rotation = isDesktop ? fanRotations[i] : 0
          const yShift = isDesktop ? fanTranslateY[i] : 0
          // Horizontal overlap on desktop
          const xShift = isDesktop ? (i - 1) * 20 : 0

          return (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                rotate: isDesktop ? rotation * 2 : 0,
                y: 60,
                scale: 0.85,
              }}
              whileInView={{
                opacity: 1,
                rotate: rotation,
                y: yShift,
                scale: 1,
              }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.7,
                delay: 0.15 * i,
                type: "spring",
                stiffness: 80,
                damping: 14,
              }}
              whileHover={{
                y: yShift - 12,
                rotate: 0,
                scale: 1.04,
                zIndex: 30,
                transition: { duration: 0.3 },
              }}
              className="relative"
              style={{
                zIndex: i === 1 ? 20 : 10,
                marginLeft: isDesktop && i > 0 ? -24 : 0,
              }}
            >
              <div
                className={cn(
                  "flex h-64 w-72 flex-col rounded-2xl p-6 shadow-lg transition-shadow duration-300 hover:shadow-2xl md:h-72 md:w-64",
                  card.bgClass || color.bg,
                  card.textClass || color.text
                )}
              >
                <h3 className="mb-3 text-base font-bold">{card.title}</h3>
                <div className="text-sm leading-relaxed opacity-90">
                  {card.content}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
