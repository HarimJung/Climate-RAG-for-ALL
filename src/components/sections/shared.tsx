'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollFadeIn } from '@/components/climate';

// ── Chart Error Boundary ─────────────────────────────────────────────────────
export class ChartErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChartError]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

export function SafeChart({ children, name }: { children: ReactNode; name?: string }) {
  return (
    <ChartErrorBoundary
      fallback={
        <div className="flex h-40 items-center justify-center rounded-lg bg-slate-50">
          <p className="text-sm text-slate-400">{name ? `${name} chart` : 'Chart'} unavailable</p>
        </div>
      }
    >
      {children}
    </ChartErrorBoundary>
  );
}

export function SourceLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-xs text-slate-400">{children}</p>;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function signed(n: number, d = 2): string {
  return (n >= 0 ? '+' : '') + n.toFixed(d);
}

export function InsightPanel({ tag, tagColor = 'text-emerald-600', children }: { tag: string; tagColor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className={`text-xs font-semibold uppercase tracking-wider ${tagColor}`}>{tag}</p>
      <div className="text-sm leading-relaxed text-slate-600 md:text-base md:leading-relaxed">{children}</div>
    </div>
  );
}

export function MetricRow({ metrics }: { metrics: { value: string; label: string; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((m, i) => (
        <ScrollFadeIn key={i} delay={i * 0.06} direction="up" distance={20}>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{m.value}</p>
            <p className="text-xs text-slate-500">{m.label}</p>
            {m.sub && <p className="mt-0.5 text-[10px] text-slate-400">{m.sub}</p>}
          </div>
        </ScrollFadeIn>
      ))}
    </div>
  );
}
