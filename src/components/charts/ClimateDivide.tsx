'use client';

// Hardcoded CO2 per capita data (World Bank WDI 2023)
// Sorted largest → smallest for layout
const COUNTRIES = [
  { iso3: 'USA', name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8', co2: 13.7 },
  { iso3: 'KOR', name: 'South Korea',   flag: '\uD83C\uDDF0\uD83C\uDDF7', co2: 11.4 },
  { iso3: 'DEU', name: 'Germany',       flag: '\uD83C\uDDE9\uD83C\uDDEA', co2:  7.1 },
  { iso3: 'BRA', name: 'Brazil',        flag: '\uD83C\uDDE7\uD83C\uDDF7', co2:  2.3 },
  { iso3: 'BGD', name: 'Bangladesh',    flag: '\uD83C\uDDE7\uD83C\uDDE9', co2:  0.7 },
  { iso3: 'NGA', name: 'Nigeria',       flag: '\uD83C\uDDF3\uD83C\uDDEC', co2:  0.6 },
] as const;

const MIN_CO2 = 0.6;
const MAX_CO2 = 13.7;

/** Green (#10B981) → Red (#EF4444) based on CO2 value */
function co2Color(val: number): string {
  const t = Math.min(1, Math.max(0, (val - MIN_CO2) / (MAX_CO2 - MIN_CO2)));
  const r = Math.round(16  + t * (239 - 16));
  const g = Math.round(185 + t * (68  - 185));
  const b = Math.round(129 + t * (68  - 129));
  return `rgb(${r},${g},${b})`;
}

export interface ClimateDivideProps {
  className?: string;
}

export function ClimateDivide({ className = '' }: ClimateDivideProps) {
  const W     = 900;
  const H     = 500;
  const PAD_X = 20;
  const PAD_T = 62;   // space for title + subtitle
  const PAD_B = 36;   // space for footer

  const chartW = W - 2 * PAD_X;        // 860
  const chartH = H - PAD_T - PAD_B;    // 402

  const total = COUNTRIES.reduce((s, c) => s + c.co2, 0); // 35.8

  // 2-row layout:
  //   Row 1: USA + KOR  (two largest)
  //   Row 2: DEU + BRA + BGD + NGA
  const row1 = COUNTRIES.slice(0, 2);
  const row2 = COUNTRIES.slice(2);

  const row1Sum = row1.reduce((s, c) => s + c.co2, 0); // 25.1
  const row2Sum = row2.reduce((s, c) => s + c.co2, 0); // 10.7

  // Height: proportional with a guaranteed minimum of 70px per row
  const MIN_ROW_H = 70;
  const flex = chartH - 2 * MIN_ROW_H;
  const row1H = MIN_ROW_H + (row1Sum / total) * flex;
  const row2H = MIN_ROW_H + (row2Sum / total) * flex;

  interface Rect {
    x: number; y: number; w: number; h: number;
    iso3: string; name: string; flag: string; co2: number;
  }

  // Row 1 rectangles
  let curX = PAD_X;
  const row1Rects: Rect[] = row1.map(c => {
    const w = (c.co2 / row1Sum) * chartW;
    const rect: Rect = { x: curX, y: PAD_T, w, h: row1H, ...c };
    curX += w;
    return rect;
  });

  // Row 2 rectangles
  curX = PAD_X;
  const row2Rects: Rect[] = row2.map(c => {
    const w = (c.co2 / row2Sum) * chartW;
    const rect: Rect = { x: curX, y: PAD_T + row1H, w, h: row2H, ...c };
    curX += w;
    return rect;
  });

  const allRects: Rect[] = [...row1Rects, ...row2Rects];

  function renderLabel(rect: Rect): React.ReactNode {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const fill = '#FFFFFF';

    if (rect.w < 68) {
      // Very small: ISO3 + value stacked, small font
      return (
        <g key={rect.iso3}>
          <text x={cx} y={cy - 7} textAnchor="middle" fontSize={10} fontWeight="700"
            fontFamily="monospace" fill={fill}>{rect.iso3}</text>
          <text x={cx} y={cy + 7} textAnchor="middle" fontSize={9}
            fontFamily="monospace" fill={fill}>{rect.co2}</text>
        </g>
      );
    }

    if (rect.w < 150) {
      // Medium: flag emoji + value
      return (
        <g key={rect.iso3}>
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={16}
            fontFamily="Inter, system-ui, sans-serif" fill={fill}>{rect.flag}</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize={11} fontWeight="700"
            fontFamily="monospace" fill={fill}>{rect.co2} t</text>
        </g>
      );
    }

    // Large: flag + country name + big value
    const nameFontSize = rect.h > 140 ? 15 : 13;
    const valFontSize  = rect.h > 140 ? 26 : 20;
    return (
      <g key={rect.iso3}>
        <text x={cx} y={cy - valFontSize - 8} textAnchor="middle" fontSize={22}
          fontFamily="Inter, system-ui, sans-serif" fill={fill}>{rect.flag}</text>
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={nameFontSize}
          fontFamily="Inter, system-ui, sans-serif" fontWeight="500" fill={fill}>
          {rect.name}
        </text>
        <text x={cx} y={cy + nameFontSize + 16} textAnchor="middle" fontSize={valFontSize}
          fontFamily="monospace" fontWeight="700" fill={fill}>
          {rect.co2} t
        </text>
      </g>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label="CO2 per capita comparison — 6 countries, area proportional to emissions"
      >
        {/* Background */}
        <rect width={W} height={H} fill="#FAFAF9" />

        {/* Title */}
        <text x={W / 2} y={26} textAnchor="middle" fontSize={20} fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">
          Who Emits How Much?
        </text>
        <text x={W / 2} y={46} textAnchor="middle" fontSize={12}
          fontFamily="Inter, system-ui, sans-serif" fill="#94A3B8">
          CO&#x2082; per capita (tonnes) 2023 &#x2014; area &#x221D; emissions
        </text>

        {/* Colored rectangles */}
        {allRects.map(rect => (
          <rect key={rect.iso3}
            x={rect.x} y={rect.y} width={rect.w} height={rect.h}
            fill={co2Color(rect.co2)} rx={2}
          />
        ))}

        {/* 3px white borders between cells */}
        {allRects.map((rect, i) => (
          <rect key={`bdr-${i}`}
            x={rect.x} y={rect.y} width={rect.w} height={rect.h}
            fill="none" stroke="#FAFAF9" strokeWidth={3} rx={2}
          />
        ))}

        {/* Labels */}
        {allRects.map(rect => renderLabel(rect))}

        {/* Footer */}
        <text x={W / 2} y={H - 12} textAnchor="middle" fontSize={11}
          fontFamily="Inter, system-ui, sans-serif" fill="#C8C8D0">
          Source: World Bank WDI 2023 | visualclimate.org
        </text>
      </svg>
    </div>
  );
}
