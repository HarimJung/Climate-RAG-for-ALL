"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

/**
 * Top-level wrapper: generous max-w-6xl, editorial whitespace.
 */
export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <main className={cn("relative min-h-screen bg-white", className)}>
      <div className="mx-auto max-w-6xl px-5 pb-32 sm:px-8 lg:px-12">
        {children}
      </div>
    </main>
  )
}
