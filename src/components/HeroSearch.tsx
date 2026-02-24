'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { iso3ToFlag } from '@/lib/iso3ToFlag';

interface Country {
  iso3: string;
  name: string;
}

export function HeroSearch({ countries }: { countries: Country[] }) {
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLUListElement>(null);

  const results = query.trim().length > 0
    ? countries.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.iso3.toLowerCase().startsWith(query.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    setHighlighted(-1);
  }, [query]);

  function select(iso3: string) {
    router.push(`/report/${iso3}`);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      if (highlighted >= 0 && results[highlighted]) {
        select(results[highlighted].iso3);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.closest('[data-hero-search]')?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div data-hero-search className="relative mx-auto w-full max-w-2xl">
      <div className="glow-blue flex items-center overflow-hidden rounded-full border-2 border-white/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-all focus-within:border-[--accent-primary] focus-within:bg-white">
        <svg className="ml-6 h-6 w-6 shrink-0 text-[--accent-primary]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search any country…"
          className="flex-1 bg-transparent px-4 py-6 text-lg font-medium text-[--text-primary] placeholder-[--text-muted] outline-none"
          autoComplete="off"
        />
        {query && (
          <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="mr-4 rounded-full p-2 text-[--text-muted] transition-colors hover:bg-gray-100 hover:text-[--text-primary]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-2xl backdrop-blur-xl"
        >
          {results.map((c, i) => (
            <li key={c.iso3}>
              <button
                onMouseDown={() => select(c.iso3)}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex w-full items-center gap-4 px-6 py-4 text-left transition-all ${
                  i === highlighted
                    ? 'bg-gradient-to-r from-blue-50 to-emerald-50 text-[--accent-primary] scale-[1.02]'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{iso3ToFlag(c.iso3)}</span>
                <span className="flex-1 font-semibold text-[--text-primary]">{c.name}</span>
                <span className="text-xs font-mono text-[--text-muted]">{c.iso3}</span>
                <svg className="h-4 w-4 text-[--accent-primary]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
