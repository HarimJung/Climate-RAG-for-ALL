'use client';

import React, { useRef } from 'react';
import { exportHtmlAsPng } from '@/lib/exportPng';

interface LinkedInCardProps {
  countryName: string;
  iso3: string;
  title: string;
  subtitle: string;
  stat: { value: string; label: string };
  source: string;
  children: React.ReactNode;
}

export function LinkedInCard({
  countryName,
  iso3,
  title,
  subtitle,
  stat,
  source,
  children,
}: LinkedInCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const date = new Date().toISOString().slice(0, 10);
    await exportHtmlAsPng(cardRef.current, `${iso3.toLowerCase()}-${title.toLowerCase().replace(/\s+/g, '-')}-${date}.png`);
  };

  const flag = getFlagEmoji(iso3);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* The actual 1080x1080 card */}
      <div
        ref={cardRef}
        style={{ width: 1080, height: 1080 }}
        className="relative overflow-hidden bg-white"
      >
        {/* Header — 120px */}
        <div className="flex items-center justify-between px-12 pt-10 pb-4" style={{ height: 120 }}>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{flag}</span>
            <div>
              <h1
                className="text-[36px] font-semibold leading-tight text-[#1A1A2E]"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {countryName}
              </h1>
              <p
                className="text-[16px] text-[#8888A0]"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {subtitle}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-[48px] font-bold leading-none text-[#1A1A2E]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {stat.value}
            </p>
            <p
              className="text-[14px] text-[#8888A0]"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {stat.label}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-12 h-px bg-[#E2E8F0]" />

        {/* Chart area — 800px */}
        <div className="flex items-center justify-center px-4" style={{ height: 800 }}>
          <div className="h-full w-full">
            {children}
          </div>
        </div>

        {/* Footer — 160px */}
        <div className="absolute bottom-0 left-0 right-0 px-12 pb-8 pt-4" style={{ height: 160 }}>
          <div className="h-px bg-[#E2E8F0]" />
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h2
                className="text-[24px] font-semibold text-[#1A1A2E]"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {title}
              </h2>
              <p
                className="mt-1 text-[14px] text-[#8888A0]"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {source}
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-[18px] font-semibold text-[#0066FF]"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                visualclimate.org
              </p>
              <p
                className="text-[12px] text-[#8888A0]"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                Climate data for every country
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Download button (outside the card) */}
      <button
        onClick={handleDownload}
        className="rounded-lg bg-[#0066FF] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0052CC]"
      >
        Download PNG (1080 x 1080)
      </button>
    </div>
  );
}

function getFlagEmoji(iso3: string): string {
  const map: Record<string, string> = {
    KOR: '\u{1F1F0}\u{1F1F7}', USA: '\u{1F1FA}\u{1F1F8}', DEU: '\u{1F1E9}\u{1F1EA}',
    BRA: '\u{1F1E7}\u{1F1F7}', NGA: '\u{1F1F3}\u{1F1EC}', BGD: '\u{1F1E7}\u{1F1E9}',
    CHN: '\u{1F1E8}\u{1F1F3}', IND: '\u{1F1EE}\u{1F1F3}', JPN: '\u{1F1EF}\u{1F1F5}',
    GBR: '\u{1F1EC}\u{1F1E7}', FRA: '\u{1F1EB}\u{1F1F7}', CAN: '\u{1F1E8}\u{1F1E6}',
    AUS: '\u{1F1E6}\u{1F1FA}', IDN: '\u{1F1EE}\u{1F1E9}', SAU: '\u{1F1F8}\u{1F1E6}',
    ZAF: '\u{1F1FF}\u{1F1E6}', MEX: '\u{1F1F2}\u{1F1FD}', RUS: '\u{1F1F7}\u{1F1FA}',
    TUR: '\u{1F1F9}\u{1F1F7}', EGY: '\u{1F1EA}\u{1F1EC}',
  };
  return map[iso3] ?? '\u{1F30D}';
}
