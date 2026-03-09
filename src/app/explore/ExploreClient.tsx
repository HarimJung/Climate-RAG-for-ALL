'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { iso3ToFlag } from '@/lib/iso3ToFlag';
import type { CountryCard } from './page';

type SortKey = 'co2-desc' | 'renewable-desc' | 'name-asc' | 'gdp-desc' | 'grade-desc';
type FilterTab = 'all' | 'Changer' | 'Starter' | 'Talker';

const CLASS_COLOR: Record<string, string> = { Changer: '#10B981', Starter: '#F59E0B', Talker: '#EF4444' };
const CLASS_BG:    Record<string, string> = { Changer: '#ECFDF5', Starter: '#FFFBEB', Talker: '#FEF2F2' };

const GRADE_COLOR: Record<string, string> = {
  'A+': '#10B981', 'A': '#10B981',
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

function ClassBadge({ cls }: { cls: string }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: CLASS_BG[cls], color: CLASS_COLOR[cls] }}>
      {cls}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className="rounded-lg px-2.5 py-1 text-sm font-bold shadow-sm"
      style={{ background: GRADE_BG[grade] ?? '#F3F4F6', color: GRADE_COLOR[grade] ?? '#6B7280' }}
    >
      {grade}
    </span>
  );
}

function formatGdp(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)    return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[--border-card] bg-white p-4">
      <div className="mb-3 flex justify-between">
        <div className="h-5 w-12 rounded bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="h-3 w-20 rounded bg-gray-100 mt-1" />
      <div className="mt-3 space-y-1.5 border-t border-[--border-card] pt-3">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}

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

  const tabs: { key: FilterTab; label: string; color?: string }[] = [
    { key: 'all',     label: `All (${counts.all})` },
    { key: 'Changer', label: `Changer (${counts.Changer})`, color: '#10B981' },
    { key: 'Starter', label: `Starter (${counts.Starter})`, color: '#F59E0B' },
    { key: 'Talker',  label: `Talker (${counts.Talker})`,   color: '#EF4444' },
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
                className="rounded-full border px-4 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor:     active ? (tab.color ?? '#0066FF') : 'var(--border-card)',
                  backgroundColor: active ? (tab.color ? `${tab.color}18` : '#0066FF18') : 'white',
                  color:           active ? (tab.color ?? '#0066FF') : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search + Region + Income Group + Sort row */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--text-muted]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search countries…"
              className="w-full rounded-lg border border-[--border-card] bg-white py-2 pl-9 pr-4 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]"
            />
          </div>

          {/* Region dropdown */}
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="rounded-lg border border-[--border-card] bg-white px-3 py-2 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r === 'all' ? 'All Regions' : r}</option>
            ))}
          </select>

          {/* Income Group dropdown */}
          <select
            value={incomeGroup}
            onChange={e => setIncomeGroup(e.target.value)}
            className="rounded-lg border border-[--border-card] bg-white px-3 py-2 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]"
          >
            {incomeGroups.map(ig => (
              <option key={ig} value={ig}>{ig === 'all' ? 'All Income Groups' : ig}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-[--border-card] bg-white px-3 py-2 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]"
          >
            <option value="name-asc">Name (A → Z)</option>
            <option value="grade-desc">Report Card Grade (high → low)</option>
            <option value="co2-desc">CO₂ per capita (high → low)</option>
            <option value="renewable-desc">Renewable % (high → low)</option>
            <option value="gdp-desc">GDP per capita (high → low)</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-[--text-muted]">
        Showing <strong className="text-[--text-primary]">{Math.min(visibleCount, filtered.length)}</strong> of <strong className="text-[--text-primary]">{filtered.length}</strong> {filtered.length === 1 ? 'country' : 'countries'}
      </p>

      {/* ── Country grid ─────────────────────────────────────────────────── */}
      {!mounted ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[--border-card] bg-[--bg-section] text-sm text-[--text-muted]">
          No countries match your search
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.map(c => {
              const flag = iso3ToFlag(c.iso3);
              const accentGradient = c.climateClass ? CLASS_ACCENT_GRADIENT[c.climateClass] : 'from-blue-400 to-blue-600';
              const isSelected = selected.includes(c.iso3);
              return (
                <div key={c.iso3} className="relative">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(c.iso3)}
                    className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border transition-colors"
                    style={{
                      borderColor: isSelected ? '#0066FF' : '#D1D5DB',
                      backgroundColor: isSelected ? '#0066FF' : 'white',
                    }}
                    aria-label={`Select ${c.name} for comparison`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>

                  <Link
                    href={`/report/${c.iso3}`}
                    className="group relative flex flex-col rounded-xl border bg-white p-4 transition-all hover:border-[--accent-primary] hover:shadow-lg"
                    style={{
                      borderColor: isSelected ? '#0066FF' : 'var(--border-card)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    {/* Accent line (left edge) */}
                    <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b ${accentGradient}`} />

                    {/* Header row */}
                    <div className="mb-2 ml-2 flex items-center justify-between gap-2 pr-5">
                      <span className="text-2xl leading-none">{flag}</span>
                      <div className="flex items-center gap-1.5">
                        {c.grade && <GradeBadge grade={c.grade} />}
                        {c.climateClass && <ClassBadge cls={c.climateClass} />}
                      </div>
                    </div>

                    {/* Name + region */}
                    <p className="ml-2 text-sm font-semibold leading-tight text-[--text-primary] group-hover:text-[--accent-primary]">
                      {c.name}
                    </p>
                    {c.region && <p className="ml-2 mt-0.5 text-xs text-[--text-muted] truncate">{c.region}</p>}

                    {/* Metrics */}
                    <div className="ml-2 mt-3 space-y-1.5 border-t border-[--border-card] pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[--text-muted]">CO₂/cap</span>
                        <span className="font-mono font-medium text-[--text-primary]">
                          {c.co2 != null ? `${c.co2.toFixed(1)} t` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[--text-muted]">Renewable</span>
                        <span className="font-mono font-medium" style={{ color: c.renewable != null ? '#00A67E' : 'var(--text-muted)' }}>
                          {c.renewable != null ? `${c.renewable.toFixed(0)}%` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[--text-muted]">GDP/cap</span>
                        <span className="font-mono font-medium text-[--text-primary]">
                          {c.gdp != null ? formatGdp(c.gdp) : '—'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="rounded-lg border border-[--border-card] bg-white px-6 py-2.5 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <p className="text-center text-sm text-[--text-muted]">
        {counts.all} countries tracked &mdash; Source: World Bank, Ember, ND-GAIN, OWID, Climate TRACE
      </p>

      {/* Bottom CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/posters"
          className="rounded-lg border border-[--border-card] bg-white px-6 py-2.5 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
        >
          Download Posters
        </Link>
        <Link
          href="/report"
          className="rounded-lg bg-[#0066FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0052CC]"
        >
          View Report Cards
        </Link>
      </div>

      {/* ── Sticky Compare Bar ─────────────────────────────────────────── */}
      {selected.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[--border-card] bg-white px-4 py-3 shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[--text-primary]">
                {selected.length} countries selected
              </span>
              <button
                onClick={() => setSelected([])}
                className="text-xs text-[--text-muted] underline hover:text-[--text-primary]"
              >
                Clear
              </button>
            </div>
            <Link
              href={`/compare?countries=${selected.join(',')}`}
              className="rounded-lg bg-[#0066FF] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0052CC]"
            >
              Compare {selected.length} countries
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
