'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { iso3ToFlag } from '@/lib/iso3ToFlag';
import type { CountryCard } from './page';

type FilterClass = 'all' | 'Changer' | 'Starter' | 'Talker';
type SortKey = 'co2-desc' | 'renewable-desc' | 'name-asc' | 'gdp-desc';

const CLASS_COLOR: Record<string, string> = { Changer: '#10B981', Starter: '#F59E0B', Talker: '#EF4444' };
const CLASS_BG:    Record<string, string> = { Changer: '#ECFDF5', Starter: '#FFFBEB', Talker: '#FEF2F2' };

function ClassBadge({ cls }: { cls: string }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: CLASS_BG[cls], color: CLASS_COLOR[cls] }}>
      {cls}
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

export function DashboardClient({ countries }: { countries: CountryCard[] }) {
  const [filter, setFilter] = useState<FilterClass>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort]     = useState<SortKey>('name-asc');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const counts = useMemo(() => ({
    all:     countries.length,
    Changer: countries.filter(c => c.climateClass === 'Changer').length,
    Starter: countries.filter(c => c.climateClass === 'Starter').length,
    Talker:  countries.filter(c => c.climateClass === 'Talker').length,
  }), [countries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = countries.filter(c => {
      const matchClass  = filter === 'all' || c.climateClass === filter;
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q);
      return matchClass && matchSearch;
    });

    switch (sort) {
      case 'co2-desc':
        list = [...list].sort((a, b) => {
          if (a.co2 == null && b.co2 == null) return 0;
          if (a.co2 == null) return 1;
          if (b.co2 == null) return -1;
          return b.co2 - a.co2;
        });
        break;
      case 'renewable-desc':
        list = [...list].sort((a, b) => {
          if (a.renewable == null && b.renewable == null) return 0;
          if (a.renewable == null) return 1;
          if (b.renewable == null) return -1;
          return b.renewable - a.renewable;
        });
        break;
      case 'gdp-desc':
        list = [...list].sort((a, b) => {
          if (a.gdp == null && b.gdp == null) return 0;
          if (a.gdp == null) return 1;
          if (b.gdp == null) return -1;
          return b.gdp - a.gdp;
        });
        break;
      case 'name-asc':
      default:
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [countries, filter, search, sort]);

  const tabs: { key: FilterClass; label: string; color?: string }[] = [
    { key: 'all',     label: `All (${counts.all})` },
    { key: 'Changer', label: `Changers (${counts.Changer})`, color: '#10B981' },
    { key: 'Starter', label: `Starters (${counts.Starter})`, color: '#F59E0B' },
    { key: 'Talker',  label: `Talkers (${counts.Talker})`,  color: '#EF4444' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Class tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
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

        {/* Search + Sort */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[180px]">
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
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-[--border-card] bg-white px-3 py-2 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent-primary]"
          >
            <option value="name-asc">Name (A → Z)</option>
            <option value="co2-desc">CO₂ per capita (high → low)</option>
            <option value="renewable-desc">Renewable % (high → low)</option>
            <option value="gdp-desc">GDP per capita (high → low)</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-[--text-muted]">
        Showing <strong className="text-[--text-primary]">{filtered.length}</strong> {filtered.length === 1 ? 'country' : 'countries'}
      </p>

      {/* ── Country grid ─────────────────────────────────────────────────── */}
      {!mounted ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[--border-card] bg-[--bg-section] text-sm text-[--text-muted]">
          No countries match your search
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map(c => {
            const flag = iso3ToFlag(c.iso3);
            return (
              <Link
                key={c.iso3}
                href={`/country/${c.iso3}`}
                className="group flex flex-col rounded-xl border border-[--border-card] bg-white p-4 transition-all hover:border-[--accent-primary] hover:shadow-md"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {/* Header row */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xl leading-none">{flag}</span>
                  {c.climateClass && <ClassBadge cls={c.climateClass} />}
                </div>

                {/* Name + region */}
                <p className="text-sm font-semibold leading-tight text-[--text-primary] group-hover:text-[--accent-primary]">
                  {c.name}
                </p>
                {c.region && <p className="mt-0.5 text-xs text-[--text-muted] truncate">{c.region}</p>}

                {/* Metrics */}
                <div className="mt-3 space-y-1.5 border-t border-[--border-card] pt-3">
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
            );
          })}
        </div>
      )}

      {/* Footer count */}
      <p className="text-center text-sm text-[--text-muted]">
        Showing {filtered.length} of {counts.all} countries &mdash; Source: World Bank, Ember, ND-GAIN, OWID, Climate TRACE
      </p>
    </div>
  );
}
