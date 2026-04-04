'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { iso3ToFlag } from '@/lib/iso3ToFlag';
import type { CountryCard } from './page';

type SortKey = 'co2-desc' | 'renewable-desc' | 'name-asc' | 'gdp-desc' | 'grade-desc';
type FilterTab = 'all' | 'Changer' | 'Starter' | 'Talker';

const CLASS_COLOR: Record<string, string> = { Changer: '#00A67E', Starter: '#F59E0B', Talker: '#E5484D' };
const CLASS_BG:    Record<string, string> = { Changer: '#ECFDF5', Starter: '#FFFBEB', Talker: '#FEF2F2' };

const GRADE_COLOR: Record<string, string> = {
  'A+': '#00A67E', 'A': '#00A67E',
  'B+': '#3B82F6', 'B': '#3B82F6',
  'C+': '#F59E0B', 'C': '#F59E0B',
  'D':  '#EF4444',
  'F':  '#991B1B',
};
const GRADE_BG: Record<string, string> = {
  'A+': '#ECFDF5', 'A': '#ECFDF5',
  'B+': '#EFF6FF', 'B': '#EFF6FF',
  'C+': '#FFFBEB', 'C': '#FFFBEB',
  'D':  '#FEF2F2',
  'F':  '#FFF1F2',
};
const GRADE_ORDER: Record<string, number> = {
  'A+': 7, 'A': 6, 'B+': 5, 'B': 4, 'C+': 3, 'C': 2, 'D': 1, 'F': 0,
};

const CLASS_ACCENT_GRADIENT: Record<string, string> = {
  Changer: 'from-emerald-400 to-emerald-600',
  Starter: 'from-amber-400 to-amber-600',
  Talker:  'from-red-400 to-red-600',
};

const PAGE_SIZE = 48;
const MAX_COMPARE = 4;

/* ── Sub-components ──────────────────────────────────────────────────────── */

function ClassBadge({ cls }: { cls: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: CLASS_BG[cls], color: CLASS_COLOR[cls] }}
    >
      {cls}
    </span>
  );
}

function GradeBadge({ grade, score }: { grade: string; score?: number }) {
  const bg = GRADE_BG[grade] ?? '#F3F4F6';
  const color = GRADE_COLOR[grade] ?? '#6B7280';
  return (
    <div className="flex items-center gap-1">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] font-bold"
        style={{ background: bg, color }}
      >
        {grade}
      </span>
      {score != null && (
        <span className="font-mono text-[11px] font-medium text-[--text-muted]">
          {Math.round(score)}
        </span>
      )}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 80 ? '#00A67E' :
    pct >= 60 ? '#3B82F6' :
    pct >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="h-1 w-full rounded-full bg-gray-100">
      <div
        className="h-1 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function MetricRow({ label, value, unit, color }: { label: string; value?: number | null; unit: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[--text-muted]">{label}</span>
      <span
        className="font-mono text-xs font-medium"
        style={{ color: value != null ? (color ?? 'var(--text-primary)') : 'var(--text-muted)' }}
      >
        {value != null ? `${unit === '%' ? value.toFixed(0) : unit === '$' ? formatGdp(value) : value.toFixed(1)}${unit === '%' ? '%' : unit === '$' ? '' : ' t'}` : '\u2014'}
      </span>
    </div>
  );
}

function formatGdp(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)    return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[--border-card] bg-white p-5">
      <div className="mb-3 flex justify-between">
        <div className="h-6 w-16 rounded bg-gray-100" />
        <div className="h-6 w-8 rounded-lg bg-gray-100" />
      </div>
      <div className="h-4 w-28 rounded bg-gray-100" />
      <div className="h-3 w-20 rounded bg-gray-50 mt-1" />
      <div className="mt-3 h-1 w-full rounded bg-gray-50" />
      <div className="mt-3 space-y-2 pt-2">
        <div className="h-3 w-full rounded bg-gray-50" />
        <div className="h-3 w-full rounded bg-gray-50" />
        <div className="h-3 w-2/3 rounded bg-gray-50" />
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export function ExploreClient({ countries }: { countries: CountryCard[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [region, setRegion]       = useState('all');
  const [incomeGroup, setIncomeGroup] = useState('all');
  const [search, setSearch]       = useState('');
  const [sort, setSort]           = useState<SortKey>('name-asc');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mounted, setMounted]     = useState(false);
  const [selected, setSelected]   = useState<string[]>([]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeTab, region, incomeGroup, search, sort]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const c of countries) if (c.region) set.add(c.region);
    return ['all', ...Array.from(set).sort()];
  }, [countries]);

  const incomeGroups = useMemo(() => {
    const set = new Set<string>();
    for (const c of countries) if (c.incomeGroup) set.add(c.incomeGroup);
    return ['all', ...Array.from(set).sort()];
  }, [countries]);

  const counts = useMemo(() => ({
    all:     countries.length,
    Changer: countries.filter(c => c.climateClass === 'Changer').length,
    Starter: countries.filter(c => c.climateClass === 'Starter').length,
    Talker:  countries.filter(c => c.climateClass === 'Talker').length,
  }), [countries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    let list = countries.filter(c => {
      if (activeTab !== 'all' && c.climateClass !== activeTab) return false;
      if (region !== 'all' && c.region !== region) return false;
      if (incomeGroup !== 'all' && c.incomeGroup !== incomeGroup) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.iso3.toLowerCase().includes(q)) return false;
      return true;
    });

    const numSort = (key: 'co2' | 'renewable' | 'gdp') =>
      [...list].sort((a, b) => {
        if (a[key] == null && b[key] == null) return 0;
        if (a[key] == null) return 1; if (b[key] == null) return -1;
        return b[key]! - a[key]!;
      });

    switch (sort) {
      case 'co2-desc':       list = numSort('co2'); break;
      case 'renewable-desc': list = numSort('renewable'); break;
      case 'gdp-desc':       list = numSort('gdp'); break;
      case 'grade-desc':
        list = [...list].sort((a, b) => (GRADE_ORDER[b.grade ?? ''] ?? -1) - (GRADE_ORDER[a.grade ?? ''] ?? -1));
        break;
      default: list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [countries, activeTab, region, incomeGroup, search, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function toggleSelect(iso3: string) {
    setSelected(prev => {
      if (prev.includes(iso3)) return prev.filter(s => s !== iso3);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, iso3];
    });
  }

  const hasActiveFilters = activeTab !== 'all' || region !== 'all' || incomeGroup !== 'all' || search !== '';

  function clearFilters() {
    setActiveTab('all');
    setRegion('all');
    setIncomeGroup('all');
    setSearch('');
  }

  const tabs: { key: FilterTab; label: string; count: number; color?: string }[] = [
    { key: 'all',     label: 'All',     count: counts.all },
    { key: 'Changer', label: 'Changer', count: counts.Changer, color: '#00A67E' },
    { key: 'Starter', label: 'Starter', count: counts.Starter, color: '#F59E0B' },
    { key: 'Talker',  label: 'Talker',  count: counts.Talker,  color: '#E5484D' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Tab row */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor:     active ? (tab.color ?? '#0066FF') : 'var(--border-card)',
                  backgroundColor: active ? (tab.color ? `${tab.color}14` : '#0066FF14') : 'white',
                  color:           active ? (tab.color ?? '#0066FF') : 'var(--text-secondary)',
                }}
              >
                {tab.label}
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                  style={{
                    backgroundColor: active ? (tab.color ? `${tab.color}20` : '#0066FF20') : '#F3F4F6',
                    color: active ? (tab.color ?? '#0066FF') : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + dropdowns row */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--text-muted]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ISO code..."
              className="w-full rounded-xl border border-[--border-card] bg-white py-2.5 pl-9 pr-4 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/30 focus:border-[--accent-primary]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-muted] hover:text-[--text-primary]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="rounded-xl border border-[--border-card] bg-white px-3 py-2.5 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/30 focus:border-[--accent-primary]"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r === 'all' ? 'All Regions' : r}</option>
            ))}
          </select>

          <select
            value={incomeGroup}
            onChange={e => setIncomeGroup(e.target.value)}
            className="rounded-xl border border-[--border-card] bg-white px-3 py-2.5 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/30 focus:border-[--accent-primary]"
          >
            {incomeGroups.map(ig => (
              <option key={ig} value={ig}>{ig === 'all' ? 'All Income Groups' : ig}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-[--border-card] bg-white px-3 py-2.5 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/30 focus:border-[--accent-primary]"
          >
            <option value="name-asc">Name (A &rarr; Z)</option>
            <option value="grade-desc">Grade (high &rarr; low)</option>
            <option value="co2-desc">CO&#8322; per capita (high &rarr; low)</option>
            <option value="renewable-desc">Renewable % (high &rarr; low)</option>
            <option value="gdp-desc">GDP per capita (high &rarr; low)</option>
          </select>
        </div>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[--text-muted]">
          <strong className="text-[--text-primary]">{Math.min(visibleCount, filtered.length)}</strong> of{' '}
          <strong className="text-[--text-primary]">{filtered.length}</strong> {filtered.length === 1 ? 'country' : 'countries'}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-[--accent-primary] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Compare hint */}
      {selected.length === 0 && (
        <p className="text-xs text-[--text-muted] -mt-2">
          Select up to 4 countries to compare side by side
        </p>
      )}

      {/* ── Country grid ─────────────────────────────────────────────────── */}
      {!mounted ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        /* ── Empty state ──────────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[--border-card] bg-[--bg-section] py-16 px-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-[--text-muted]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[--text-primary]">No countries found</p>
          <p className="mt-1 text-xs text-[--text-muted]">
            Try adjusting your search or filters
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 rounded-lg bg-[--accent-primary] px-4 py-2 text-xs font-medium text-white transition-colors hover:opacity-90"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.map(c => {
              const flag = iso3ToFlag(c.iso3);
              const accentGradient = c.climateClass ? CLASS_ACCENT_GRADIENT[c.climateClass] : 'from-blue-400 to-blue-600';
              const isSelected = selected.includes(c.iso3);
              return (
                <div key={c.iso3} className="relative group/card">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(c.iso3)}
                    className="absolute right-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border-[1.5px] transition-all"
                    style={{
                      borderColor: isSelected ? '#0066FF' : '#D1D5DB',
                      backgroundColor: isSelected ? '#0066FF' : 'rgba(255,255,255,0.9)',
                      opacity: isSelected ? 1 : undefined,
                    }}
                    aria-label={`Select ${c.name} for comparison`}
                  >
                    {isSelected ? (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <span className="opacity-0 group-hover/card:opacity-100 transition-opacity text-[8px] text-gray-400"></span>
                    )}
                  </button>

                  <Link
                    href={`/report/${c.iso3}`}
                    className="group relative flex flex-col rounded-xl border bg-white transition-all hover:shadow-md"
                    style={{
                      borderColor: isSelected ? '#0066FF' : 'var(--border-card)',
                      boxShadow: isSelected ? '0 0 0 1px #0066FF' : undefined,
                    }}
                  >
                    {/* Accent bar (top) */}
                    <div className={`h-0.5 w-full rounded-t-xl bg-gradient-to-r ${accentGradient}`} />

                    <div className="flex flex-col p-4 pt-3">
                      {/* Header: flag + name + grade */}
                      <div className="flex items-start justify-between gap-2 pr-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl leading-none shrink-0">{flag}</span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold leading-tight text-[--text-primary] group-hover:text-[--accent-primary] truncate">
                              {c.name}
                            </p>
                            {c.region && (
                              <p className="mt-0.5 text-[10px] text-[--text-muted] truncate">{c.region}</p>
                            )}
                          </div>
                        </div>
                        {c.grade && <GradeBadge grade={c.grade} score={c.totalScore} />}
                      </div>

                      {/* Score bar */}
                      {c.totalScore != null && (
                        <div className="mt-2.5">
                          <ScoreBar score={c.totalScore} />
                        </div>
                      )}

                      {/* Class badge */}
                      {c.climateClass && (
                        <div className="mt-2">
                          <ClassBadge cls={c.climateClass} />
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="mt-2.5 space-y-1 border-t border-[--border-card] pt-2.5">
                        <MetricRow label="CO\u2082/capita" value={c.co2} unit="t" />
                        <MetricRow label="Renewable" value={c.renewable} unit="%" color="#00A67E" />
                        <MetricRow label="GDP/capita" value={c.gdp} unit="$" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="rounded-lg border border-[--border-card] bg-white px-6 py-2.5 text-[13px] font-medium text-[--text-secondary] transition-all hover:border-[--accent-primary] hover:text-[--accent-primary] hover:shadow-sm"
              >
                Show more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-[--text-muted] pt-4">
        Source: World Bank, Ember, ND-GAIN, OWID, Climate TRACE
      </p>

      {/* Bottom CTA */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/methodology"
          className="rounded-lg border border-[--border-card] bg-white px-5 py-2.5 text-[13px] font-semibold text-[--text-secondary] transition-all hover:border-[--accent-primary] hover:text-[--accent-primary]"
        >
          Read methodology
        </Link>
        <Link
          href="/posters"
          className="rounded-lg bg-[--accent-primary] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0052CC]"
        >
          Download posters
        </Link>
      </div>

      {/* ── Sticky Compare Bar ─────────────────────────────────────────── */}
      {selected.length >= 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[--border-card] bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Selected country flags */}
              <div className="flex -space-x-1">
                {selected.map(iso3 => (
                  <span
                    key={iso3}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-50 text-sm"
                  >
                    {iso3ToFlag(iso3)}
                  </span>
                ))}
              </div>
              <div>
                <span className="text-sm font-medium text-[--text-primary]">
                  {selected.length} {selected.length === 1 ? 'country' : 'countries'} selected
                </span>
                {selected.length < 2 && (
                  <span className="ml-1.5 text-xs text-[--text-muted]">
                    (select {2 - selected.length} more to compare)
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelected([])}
                className="text-xs text-[--text-muted] hover:text-[--text-primary] underline-offset-2 hover:underline"
              >
                Clear
              </button>
            </div>
            {selected.length >= 2 ? (
              <Link
                href={`/compare?countries=${selected.join(',')}`}
                className="rounded-lg bg-[--accent-primary] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0052CC]"
              >
                Compare {selected.length} countries
              </Link>
            ) : (
              <span className="rounded-lg bg-gray-100 px-5 py-2.5 text-[13px] font-medium text-[--text-muted] cursor-not-allowed">
                Compare
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
