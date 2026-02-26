"use client"

import { type ReactNode, useEffect, useRef, useState } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  StatPill                                                          */
/* ------------------------------------------------------------------ */

interface StatPillProps {
  label: string
  value: string
  className?: string
}

export function StatPill({ label, value, className }: StatPillProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.06, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "inline-flex cursor-default items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm",
        className
      )}
    >
      <span className="font-semibold text-slate-800">{label}</span>
      <span className="text-slate-500">{value}</span>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  CountUp                                                           */
/* ------------------------------------------------------------------ */

interface CountUpProps {
  end: number
  decimals?: number
  duration?: number
  suffix?: string
  className?: string
}

function CountUp({
  end,
  decimals = 1,
  duration = 2,
  suffix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [display, setDisplay] = useState("0")

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    let rafId: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      // Elastic ease-out for that satisfying overshoot
      const eased =
        progress === 1
          ? 1
          : 1 - Math.pow(2, -10 * progress) * Math.cos((progress * 10 - 0.75) * ((2 * Math.PI) / 3))
      const current = Math.min(eased * end, end)

      setDisplay(current.toFixed(decimals))

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        setDisplay(end.toFixed(decimals))
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [isInView, end, decimals, duration])

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Floating particles background                                     */
/* ------------------------------------------------------------------ */

function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-emerald-400/10"
          style={{
            width: 60 + i * 30,
            height: 60 + i * 30,
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10 * (i % 2 === 0 ? 1 : -1), 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  HeroSection                                                       */
/* ------------------------------------------------------------------ */

interface HeroSectionProps {
  countryName: string
  region?: string
  incomeGroup?: string
  population?: string
  heroNumber: number
  heroDecimals?: number
  heroSuffix?: string
  heroLabel: string
  stats: StatPillProps[]
  backgroundContent?: ReactNode
  ctaLabel?: string
  className?: string
}

export function HeroSection({
  countryName,
  region,
  incomeGroup,
  population,
  heroNumber,
  heroDecimals = 1,
  heroSuffix = "",
  heroLabel,
  stats,
  backgroundContent,
  ctaLabel = "Scroll to see the full story",
  className,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 py-20",
        className
      )}
    >
      {/* Floating bg elements with parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <FloatingParticles />
        {backgroundContent && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]">
            {backgroundContent}
          </div>
        )}
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 flex flex-col items-center gap-8 text-center"
      >
        {/* Country name -- slides up with blur */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex flex-col items-center gap-3"
        >
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            {countryName}
          </h1>
          {(region || incomeGroup || population) && (
            <p className="text-sm text-slate-400">
              {[region, incomeGroup, population].filter(Boolean).join(" \u00B7 ")}
            </p>
          )}
        </motion.div>

        {/* Giant number -- dramatic scale + blur entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{
            duration: 1,
            delay: 0.3,
            type: "spring",
            stiffness: 100,
            damping: 14,
          }}
          className="flex flex-col items-center"
        >
          <div className="bg-gradient-to-b from-slate-900 to-slate-600 bg-clip-text text-7xl font-black tracking-tighter text-transparent md:text-[8rem] lg:text-[10rem]">
            <CountUp
              end={heroNumber}
              decimals={heroDecimals}
              duration={2.5}
              suffix={heroSuffix}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-1 text-sm text-slate-400 md:text-base"
          >
            {heroLabel}
          </motion.p>
        </motion.div>

        {/* Stat pills -- staggered cascade */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.9 } },
          }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.8 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                },
              }}
            >
              <StatPill {...stat} />
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll CTA with pulse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <p className="text-xs text-slate-400">{ctaLabel}</p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-300"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
