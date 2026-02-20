'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { iso3ToFlag } from '@/lib/iso3ToFlag';
import type { CountryReportCard } from './page';

const GRADE_COLOR: Record<string, string> = {
  'A+': '#00A67E', 'A': '#00A67E',
  'B+': '#0066FF', 'B': '#0066FF',
  'C+': '#F59E0B', 'C': '#F59E0B',
  'D': '#E5484D',  'F': '#E5484D',
};

const GRADE_BG: Record<string, string> = {
  'A+': '#ECFDF5', 'A': '#ECFDF5',
  'B+': '#EFF6FF', 'B': '#EFF6FF',
  'C+': '#FFFBEB', 'C': '#FFFBEB',
  'D': '#FFF1F2',  'F': '#FFF1F2',
};

const FILTER_GROUPS = [
  { label: 'All',  grades: null },
  { label: 'A',    grades: ['A+', 'A'] },
  { label: 'B',    grades: ['B+', 'B'] },
  { label: 'C',    grades: ['C+', 'C'] },
  { label: 'D/F',  grades: ['D', 'F'] },
] as const;

const SORTS = [
  { label: 'Score ↓',  key: 'score_desc' },
  { label: 'Score ↑',  key: 'score_asc' },
  { label: 'Name A→Z', key: 'name_asc' },
] as const;

function ScoreBar({ value, color }: { value: number | null; color: string }) {
  if (value === null) return <span className="text-xs text-[--text-muted]">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-[--text-muted]">{Math.round(value)}</span>
    </div>
  );
}

export function ReportIndexClient({ cards }: { cards: CountryReportCard[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('All');
  const [sort, setSort] = useState<string>('score_desc');

  const filtered = useMemo(() => {
    let list = cards;

    // Search
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q));

    // Grade filter
    const group = FILTER_GROUPS.find(g => g.label === filter);
    if (group?.grades) list = list.filter(c => (group.grades as readonly string[]).includes(c.grade));

    // Sort
    if (sort === 'score_asc')  list = [...list].sort((a, b) => a.total - b.total);
    else if (sort === 'name_asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    // score_desc is default (already sorted server-side)

    return list;
  }, [cards, query, filter, sort]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <input
          type="search"
          placeholder="Search country…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border border-[--border-card] bg-white px-4 py-2 text-sm text-[--text-primary] placeholder-[--text-muted] outline-none focus:border-[--accent-primary] sm:w-72"
        />
        <div className="flex gap-2">
          {/* Grade filter tabs */}
          <div className="flex gap-1 rounded-lg border border-[--border-card] bg-white p-1">
            {FILTER_GROUPS.map(g => (
              <button
                key={g.label}
                onClick={() => setFilter(g.label)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  filter === g.label
                    ? 'bg-[--accent-primary] text-white'
                    : 'text-[--text-secondary] hover:text-[--accent-primary]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="rounded-lg border border-[--border-card] bg-white px-3 py-1 text-xs text-[--text-secondary] outline-none"
          >
            {SORTS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-[--text-muted]">{filtered.length} countries</p>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(card => (
          <Link
            key={card.iso3}
            href={`/report/${card.iso3}`}
            className="group block rounded-xl border border-[--border-card] bg-white p-5 transition-all hover:border-[--accent-primary] hover:shadow-md"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{iso3ToFlag(card.iso3)}</span>
                <div>
                  <p className="font-semibold text-[--text-primary] group-hover:text-[--accent-primary] transition-colors">
                    {card.name}
                  </p>
                  <p className="text-xs text-[--text-muted]">{card.region}</p>
                </div>
              </div>
              {/* Grade badge */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: GRADE_BG[card.grade], color: GRADE_COLOR[card.grade] }}
              >
                {card.grade}
              </div>
            </div>

            {/* Total score bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-[--text-muted]">
                <span>Total score</span>
                <span className="font-medium text-[--text-primary]">{card.total.toFixed(1)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${card.total}%`, backgroundColor: GRADE_COLOR[card.grade] }}
                />
              </div>
            </div>

            {/* Domain mini-scores */}
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
              {[
                { label: 'Emissions',  value: card.emissions,      color: '#E5484D' },
                { label: 'Energy',     value: card.energy,         color: '#0066FF' },
                { label: 'Economy',    value: card.economy,        color: '#8B5CF6' },
                { label: 'Responsibility', value: card.responsibility, color: '#F59E0B' },
                { label: 'Resilience', value: card.resilience,     color: '#00A67E' },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between gap-1">
                  <span className="text-xs text-[--text-muted] w-20 truncate">{d.label}</span>
                  <ScoreBar value={d.value} color={d.color} />
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-[--text-muted]">No countries match your search.</div>
      )}
    </div>
  );
}
