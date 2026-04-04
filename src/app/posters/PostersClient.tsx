'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { LayoutGroup } from 'framer-motion';
import { type CountryClass } from '@/components/charts/WorldScoreboard';

import { type CountryMeta, type Metrics, COUNTRIES, PILOT_DATA, fetchMetrics, fetchAllRenewable, fetchCountriesFromDB } from './poster-data';
import { EnergyFlowPoster } from './renderers/EnergyFlowPoster';
import { CarbonInequalityPoster } from './renderers/CarbonInequalityPoster';
import { ParisGapPoster } from './renderers/ParisGapPoster';
import { AirQualityPoster } from './renderers/AirQualityPoster';
import { TransitionRacePoster, type RaceEntry } from './renderers/TransitionRacePoster';
import { WorldScoreboardPoster } from './renderers/WorldScoreboardPoster';

import { BentoSection, type BentoPoster } from '@/components/posters/bento-section';
import { Toolbar, type ViewMode, type FilterType } from '@/components/posters/toolbar';
import { PosterExplorer, type PosterType, POSTER_DEFS } from '@/components/posters/poster-explorer';
import { PosterLightbox } from '@/components/posters/poster-lightbox';
import { createClient } from '@/lib/supabase/client';

// ── Scoreboard fetcher ───────────────────────────────────────────────────────

const CLASS_NAME: Record<number, CountryClass['cls']> = { 1: 'Changer', 2: 'Starter', 3: 'Talker' };

async function fetchScoreboardData(): Promise<CountryClass[]> {
  const supabase = createClient();
  const [{ data: clsRows }, { data: metricRows }, { data: cntRows }] = await Promise.all([
    supabase.from('country_data').select('country_iso3, value').eq('indicator_code', 'DERIVED.CLIMATE_CLASS').eq('year', 2023),
    supabase.from('country_data').select('country_iso3, indicator_code, year, value')
      .in('indicator_code', ['EN.GHG.CO2.PC.CE.AR5', 'EMBER.RENEWABLE.PCT'])
      .gte('year', 2018).order('year', { ascending: false }),
    supabase.from('countries').select('iso3, name'),
  ]);

  const nameMap = new Map<string, string>((cntRows ?? []).map((c: { iso3: string; name: string }) => [c.iso3, c.name]));
  const clsMap  = new Map<string, number>((clsRows ?? []).map((r: { country_iso3: string; value: number }) => [r.country_iso3, r.value]));
  const co2Map = new Map<string, number>();
  const renMap = new Map<string, number>();
  for (const r of (metricRows ?? []) as { country_iso3: string; indicator_code: string; year: number; value: number }[]) {
    if (r.indicator_code === 'EN.GHG.CO2.PC.CE.AR5' && !co2Map.has(r.country_iso3)) co2Map.set(r.country_iso3, Number(r.value));
    if (r.indicator_code === 'EMBER.RENEWABLE.PCT'   && !renMap.has(r.country_iso3)) renMap.set(r.country_iso3, Number(r.value));
  }

  const results: CountryClass[] = [];
  for (const [iso3, clsVal] of clsMap) {
    results.push({ iso3, name: nameMap.get(iso3) ?? iso3, cls: CLASS_NAME[clsVal] ?? 'Talker', co2: co2Map.get(iso3), renewable: renMap.get(iso3) });
  }
  for (const [iso3, name] of nameMap) {
    if (!clsMap.has(iso3)) results.push({ iso3, name, cls: 'NoData' });
  }
  return results;
}

// ── Category filter ──────────────────────────────────────────────────────────

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'scoreboard',  label: 'Global' },
  { value: 'energy',      label: 'Energy' },
  { value: 'gap',         label: 'Paris Gap' },
  { value: 'race',        label: 'Transition' },
  { value: 'inequality',  label: 'Inequality' },
  { value: 'air',         label: 'Air Quality' },
];

// ── Poster type descriptions ─────────────────────────────────────────────────

const POSTER_INFO: Record<PosterType, { headline: string; description: string }> = {
  scoreboard:  { headline: 'World Scoreboard',  description: 'Changer, Starter, or Talker classification for 200+ countries on a single map.' },
  energy:      { headline: 'Energy Flow',       description: 'Renewable vs fossil electricity mix breakdown for any country.' },
  gap:         { headline: 'Paris Gap',         description: 'CO\u2082 emissions trend before and after the 2015 Paris Agreement.' },
  race:        { headline: 'Transition Race',   description: 'Renewable electricity share ranking across all tracked countries.' },
  inequality:  { headline: 'Carbon Inequality', description: 'Per capita CO\u2082 comparison between two countries side by side.' },
  air:         { headline: 'Air Quality',       description: 'PM2.5 air pollution levels compared against the WHO guideline of 5 \u00b5g/m\u00b3.' },
};

// ══════════════════════════════════════════════════════════════════════════════
// ── Main PostersClient ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function PostersClient() {
  const [iso3,     setIso3]     = useState('KOR');
  const [compIso3, setCompIso3] = useState('BGD');
  const [loading,  setLoading]  = useState(false);
  const [metrics,  setMetrics]  = useState<Metrics>(PILOT_DATA.KOR);
  const [compMet,  setCompMet]  = useState<Metrics>(PILOT_DATA.BGD);
  const [raceData,       setRaceData]       = useState<RaceEntry[]>([]);
  const [scoreboardData, setScoreboardData] = useState<CountryClass[]>([]);
  const [countriesList,  setCountriesList]  = useState<CountryMeta[]>(COUNTRIES);
  const [downloading,    setDownloading]    = useState<PosterType | null>(null);
  const [lightbox,       setLightbox]       = useState<PosterType | null>(null);
  const [viewMode,       setViewMode]       = useState<ViewMode>('grid');
  const [filter,         setFilter]         = useState<FilterType>('all');

  const refs = useRef<Partial<Record<PosterType, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (PILOT_DATA[iso3]) { setMetrics(PILOT_DATA[iso3]); return; }
    setLoading(true);
    fetchMetrics(iso3).then(m => { if (m) setMetrics(m); }).finally(() => setLoading(false));
  }, [iso3]);

  useEffect(() => {
    if (PILOT_DATA[compIso3]) { setCompMet(PILOT_DATA[compIso3]); return; }
    fetchMetrics(compIso3).then(m => { if (m) setCompMet(m); });
  }, [compIso3]);

  useEffect(() => {
    fetchAllRenewable().then(setRaceData);
    fetchScoreboardData().then(setScoreboardData);
    fetchCountriesFromDB().then(list => { if (list.length > 0) setCountriesList(list); });
  }, []);

  const country     = countriesList.find(c => c.iso3 === iso3)     ?? countriesList[0];
  const compCountry = countriesList.find(c => c.iso3 === compIso3) ?? countriesList[Math.min(5, countriesList.length - 1)];

  const handleDownload = useCallback(async (type: PosterType) => {
    const el = refs.current[type];
    if (!el) return;
    setDownloading(type);
    try {
      const { exportHtmlAsPng } = await import('@/lib/exportPng');
      const filename = type === 'inequality'
        ? `visualclimate-${type}-${iso3}-vs-${compIso3}.png`
        : `visualclimate-${type}-${iso3}.png`;
      await exportHtmlAsPng(el, filename);
    } finally {
      setDownloading(null);
    }
  }, [iso3, compIso3]);

  function renderPoster(type: PosterType) {
    if (loading && type !== 'scoreboard' && type !== 'race') {
      return <div className="flex aspect-square items-center justify-center text-sm text-[--text-muted]">Loading&hellip;</div>;
    }
    switch (type) {
      case 'energy':     return <EnergyFlowPoster country={country} metrics={metrics} />;
      case 'inequality': return <CarbonInequalityPoster country={country} compCountry={compCountry} metrics={metrics} compMetrics={compMet} />;
      case 'gap':        return <ParisGapPoster country={country} />;
      case 'air':        return <AirQualityPoster country={country} metrics={metrics} />;
      case 'race':       return <TransitionRacePoster raceData={raceData} highlightIso3={iso3} />;
      case 'scoreboard': return <WorldScoreboardPoster scoreboardData={scoreboardData} />;
    }
  }

  function renderPosterRef(type: PosterType) {
    return (el: HTMLDivElement | null) => { refs.current[type] = el; };
  }

  function getLightboxStats(type: PosterType) {
    switch (type) {
      case 'energy':
        return [
          { label: 'Fossil', value: `${metrics.fossil.toFixed(1)}%`, color: '#EF4444' },
          { label: 'Renewable', value: `${metrics.renewable.toFixed(1)}%`, color: '#10B981' },
          ...(metrics.nuclear > 0 ? [{ label: 'Nuclear', value: `${metrics.nuclear.toFixed(1)}%`, color: '#8B5CF6' }] : []),
        ];
      case 'inequality':
        return [
          { label: `${country.name} CO\u2082/cap`, value: `${metrics.co2.toFixed(1)} t`, color: '#EF4444' },
          { label: `${compCountry.name} CO\u2082/cap`, value: `${compMet.co2.toFixed(1)} t`, color: '#3B82F6' },
        ];
      case 'air':
        return [
          { label: 'PM2.5', value: `${metrics.pm25.toFixed(1)} \u00b5g/m\u00b3`, color: metrics.pm25 > 5 ? '#EF4444' : '#10B981' },
          { label: 'WHO Guideline', value: '5 \u00b5g/m\u00b3', color: '#10B981' },
        ];
      case 'race':
        return [
          { label: 'Countries ranked', value: `${raceData.length}`, color: '#7C3AED' },
          { label: 'Top renewable', value: raceData[0] ? `${raceData[0].renewable.toFixed(1)}%` : '-', color: '#10B981' },
        ];
      case 'scoreboard': {
        const counts = { Changer: 0, Starter: 0, Talker: 0 };
        for (const c of scoreboardData) if (c.cls !== 'NoData') counts[c.cls as keyof typeof counts]++;
        return [
          { label: 'Changers', value: String(counts.Changer), color: '#10B981' },
          { label: 'Starters', value: String(counts.Starter), color: '#F59E0B' },
          { label: 'Talkers',  value: String(counts.Talker),  color: '#EF4444' },
        ];
      }
      case 'gap':
        return [
          { label: 'CO\u2082/cap', value: `${metrics.co2.toFixed(1)} t`, color: '#D97706' },
        ];
      default:
        return [];
    }
  }

  const lightboxDef = lightbox ? POSTER_DEFS.find(d => d.id === lightbox) : null;
  const lightboxInfo = lightbox ? POSTER_INFO[lightbox] : null;

  const filteredDefs = useMemo(() => {
    if (filter === 'all') return POSTER_DEFS;
    return POSTER_DEFS.filter(p => p.id === filter);
  }, [filter]);

  // ── Bento section data ──────────────────────────────────────────────────
  const bentoPosters: BentoPoster[] = [
    {
      id: 'scoreboard', title: 'World Scoreboard',
      subtitle: 'Climate action classification for 100+ countries',
      badge: 'Global', badgeColor: '#3B5998', bgColor: '#F0F4FF',
      content: <WorldScoreboardPoster scoreboardData={scoreboardData} />,
      onDownload: () => handleDownload('scoreboard'),
      downloading: downloading === 'scoreboard',
      refCallback: (el) => { refs.current.scoreboard = el; },
    },
    {
      id: 'energy', title: 'Energy Flow',
      subtitle: `${country.name} electricity mix`,
      badge: 'Energy', badgeColor: '#059669', bgColor: '#ECFDF5',
      content: <EnergyFlowPoster country={country} metrics={metrics} />,
      onDownload: () => handleDownload('energy'),
      downloading: downloading === 'energy',
      refCallback: (el) => { refs.current.energy = el; },
    },
    {
      id: 'gap', title: 'Paris Gap',
      subtitle: 'CO\u2082 CAGR before vs after Paris',
      badge: 'Paris Gap', badgeColor: '#D97706', bgColor: '#FFFBEB',
      content: <ParisGapPoster country={country} />,
      onDownload: () => handleDownload('gap'),
      downloading: downloading === 'gap',
      refCallback: (el) => { refs.current.gap = el; },
    },
    {
      id: 'race', title: 'Transition Race',
      subtitle: 'Renewable % ranking',
      badge: 'Transition', badgeColor: '#7C3AED', bgColor: '#F5F3FF',
      content: <TransitionRacePoster raceData={raceData} highlightIso3={iso3} />,
      onDownload: () => handleDownload('race'),
      downloading: downloading === 'race',
      refCallback: (el) => { refs.current.race = el; },
    },
    {
      id: 'inequality', title: 'Carbon Inequality',
      subtitle: `${country.name} vs ${compCountry.name}`,
      badge: 'Inequality', badgeColor: '#E11D48', bgColor: '#FFF1F2',
      content: <CarbonInequalityPoster country={country} compCountry={compCountry} metrics={metrics} compMetrics={compMet} />,
      onDownload: () => handleDownload('inequality'),
      downloading: downloading === 'inequality',
      refCallback: (el) => { refs.current.inequality = el; },
    },
    {
      id: 'air', title: 'Air Quality',
      subtitle: `${country.name} PM2.5 vs WHO`,
      badge: 'Air Quality', badgeColor: '#0D9488', bgColor: '#F0FDFA',
      content: <AirQualityPoster country={country} metrics={metrics} />,
      onDownload: () => handleDownload('air'),
      downloading: downloading === 'air',
      refCallback: (el) => { refs.current.air = el; },
    },
  ];

  const handlePosterClick = useCallback((id: string) => {
    setLightbox(id as PosterType);
  }, []);

  return (
    <LayoutGroup>
      <div className="min-h-screen bg-white">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="hero-gradient px-6 pb-12 pt-28 sm:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">Data Posters</p>
            <h1 className="mt-2 text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-[--text-primary] sm:text-[2.75rem] lg:text-[3.25rem]">
              Data tells the story
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[--text-secondary] sm:text-base">
              6 poster types. {countriesList.length}+ countries. Download as PNG and share on LinkedIn.
            </p>

            {/* Mini poster type pills */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {POSTER_DEFS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setFilter(p.id); document.getElementById('posters')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[--border-card] bg-white px-3 py-1.5 text-[12px] font-medium text-[--text-secondary] transition-all hover:border-[--accent-primary] hover:text-[--accent-primary]"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.categoryColor }} />
                  {p.title}
                </button>
              ))}
            </div>

            {/* Trust stats */}
            <div className="mx-auto mt-8 grid max-w-sm grid-cols-3 gap-4">
              {[
                { value: '6', label: 'Poster types' },
                { value: `${countriesList.length}+`, label: 'Countries' },
                { value: '1080px', label: 'PNG output' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="font-mono text-xl font-bold tracking-[-0.02em] text-[--text-primary]">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[--text-muted]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured Bento ───────────────────────────────────────────────── */}
        <BentoSection
          posters={bentoPosters}
          totalTypes={6}
          totalCountries={countriesList.length}
          onPosterClick={handlePosterClick}
        />

        {/* ── What's included ──────────────────────────────────────────────── */}
        <section className="border-y border-[--border-card] bg-[--bg-section] px-6 py-14">
          <div className="mx-auto max-w-5xl">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">Poster types</p>
            <h2 className="mt-2 text-center text-xl font-bold tracking-[-0.02em] text-[--text-primary] sm:text-2xl">
              Six perspectives on climate data
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.entries(POSTER_INFO) as [PosterType, { headline: string; description: string }][]).map(([type, info]) => {
                const def = POSTER_DEFS.find(d => d.id === type);
                return (
                  <button
                    key={type}
                    onClick={() => { setFilter(type); document.getElementById('posters')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="group flex flex-col rounded-xl border border-[--border-card] bg-white p-5 text-left transition-all hover:shadow-md hover:border-[--accent-primary]/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: def?.categoryColor }} />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: def?.categoryColor }}>
                        {def?.category}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[15px] font-semibold text-[--text-primary] group-hover:text-[--accent-primary]">
                      {info.headline}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[--text-secondary]">
                      {info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Toolbar + Explorer ───────────────────────────────────────────── */}
        <Toolbar
          activeCategory={filter}
          onCategoryChange={setFilter}
          activeCountry={iso3}
          onCountryChange={setIso3}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          countriesList={countriesList}
          categories={CATEGORIES}
        />

        <PosterExplorer
          countriesList={countriesList}
          iso3={iso3}
          compIso3={compIso3}
          setCompIso3={setCompIso3}
          onClickPoster={setLightbox}
          renderPoster={renderPoster}
          renderPosterRef={renderPosterRef}
          downloading={downloading}
          onDownload={handleDownload}
          viewMode={viewMode}
          filteredDefs={filteredDefs}
          countryName={country.name}
        />

        {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
        <section className="border-t border-[--border-card] bg-[--bg-section] px-6 py-14">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">Go deeper</p>
            <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-[--text-primary]">
              Want the full story?
            </h2>
            <p className="mt-2 text-sm text-[--text-secondary]">
              View any country&#39;s report card with grades across 5 scored domains.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/explore" className="rounded-xl bg-[--accent-primary] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0052CC]">
                Explore all countries
              </Link>
              <Link href="/report" className="rounded-xl border border-[--border-card] bg-white px-6 py-3 text-sm font-semibold text-[--text-secondary] transition-all hover:border-[--accent-primary] hover:text-[--accent-primary]">
                View report cards
              </Link>
            </div>
            <p className="mt-5 text-[10px] text-[--text-muted]">
              visualclimate.org
            </p>
          </div>
        </section>

        {/* ── Lightbox ──────────────────────────────────────────────────────── */}
        <PosterLightbox
          open={lightbox !== null}
          onClose={() => setLightbox(null)}
          title={lightboxDef?.title ?? ''}
          subtitle={`${country.flag} ${country.name}`}
          categoryLabel={lightboxDef?.category}
          categoryColor={lightboxDef?.categoryColor}
          bgColor={lightboxDef?.bgColor}
          description={lightboxInfo?.description}
          stats={lightbox ? getLightboxStats(lightbox) : []}
          downloading={downloading === lightbox}
          onDownload={lightbox ? () => handleDownload(lightbox) : undefined}
        >
          {lightbox && (
            <div ref={renderPosterRef(lightbox)}>
              {renderPoster(lightbox)}
            </div>
          )}
        </PosterLightbox>
      </div>
    </LayoutGroup>
  );
}
