'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CountryCard } from './page';

type FilterClass = 'all' | 'Changer' | 'Starter' | 'Talker';

const CLASS_COLOR: Record<string, string> = {
  Changer: '#10B981',
  Starter: '#F59E0B',
  Talker:  '#EF4444',
};

const CLASS_BG: Record<string, string> = {
  Changer: '#ECFDF5',
  Starter: '#FFFBEB',
  Talker:  '#FEF2F2',
};

function ClassBadge({ cls }: { cls: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: CLASS_BG[cls], color: CLASS_COLOR[cls] }}
    >
      {cls}
    </span>
  );
}

export function DashboardClient({ countries }: { countries: CountryCard[] }) {
  const [filter, setFilter]   = useState<FilterClass>('all');
  const [search, setSearch]   = useState('');

  const counts = useMemo(() => ({
    all:     countries.length,
    Changer: countries.filter(c => c.climateClass === 'Changer').length,
    Starter: countries.filter(c => c.climateClass === 'Starter').length,
    Talker:  countries.filter(c => c.climateClass === 'Talker').length,
  }), [countries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return countries.filter(c => {
      const matchesClass  = filter === 'all' || c.climateClass === filter;
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q);
      return matchesClass && matchesSearch;
    });
  }, [countries, filter, search]);

  const tabs: { key: FilterClass; label: string; color?: string }[] = [
    { key: 'all',     label: `All (${counts.all})` },
    { key: 'Changer', label: `Changers (${counts.Changer})`, color: '#10B981' },
    { key: 'Starter', label: `Starters (${counts.Starter})`, color: '#F59E0B' },
    { key: 'Talker',  label: `Talkers (${counts.Talker})`,  color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">

      {/* Filter tabs + search row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="rounded-full border px-4 py-2 text-sm font-medium transition-all"
              style={{
                borderColor: filter === tab.key ? (tab.color ?? '#0066FF') : 'var(--border-card)',
                backgroundColor: filter === tab.key ? (tab.color ? `${tab.color}15` : '#0066FF15') : 'white',
                color: filter === tab.key ? (tab.color ?? '#0066FF') : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--text-muted]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full rounded-lg border border-[--border-card] bg-white py-2 pl-9 pr-4 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-[--text-muted]">
        Showing {filtered.length} {filtered.length === 1 ? 'country' : 'countries'}
      </p>

      {/* Country grid */}
      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[--border-card] bg-[--bg-section] text-sm text-[--text-muted]">
          No countries match your search
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map(c => (
            <Link
              key={c.iso3}
              href={`/country/${c.iso3}`}
              className="group flex flex-col rounded-xl border border-[--border-card] bg-white p-4 transition-all hover:border-[--accent-primary] hover:shadow-md"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              {/* ISO3 badge + class badge */}
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-md bg-[--bg-section] px-2 py-1 font-mono text-xs font-bold text-[--text-secondary]">
                  {c.iso3}
                </span>
                {c.climateClass && <ClassBadge cls={c.climateClass} />}
              </div>

              {/* Country name */}
              <p className="text-sm font-semibold text-[--text-primary] group-hover:text-[--accent-primary] leading-tight">
                {c.name}
              </p>
              {c.region && (
                <p className="mt-0.5 text-xs text-[--text-muted]">{c.region}</p>
              )}

              {/* Metrics */}
              <div className="mt-3 space-y-1.5 border-t border-[--border-card] pt-3">
                {c.co2 != null ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[--text-muted]">CO₂/cap</span>
                    <span className="font-mono font-medium text-[--text-primary]">{c.co2.toFixed(1)} t</span>
                  </div>
                ) : null}
                {c.renewable != null ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[--text-muted]">Renewable</span>
                    <span className="font-mono font-medium text-[--accent-positive]">{c.renewable.toFixed(0)}%</span>
                  </div>
                ) : null}
                {c.co2 == null && c.renewable == null && (
                  <p className="text-xs text-[--text-muted]">Limited data</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="pt-4 text-center text-sm text-[--text-muted]">
        Source: World Bank, Ember, ND-GAIN, OWID, Climate TRACE
      </div>
    </div>
  );
}
