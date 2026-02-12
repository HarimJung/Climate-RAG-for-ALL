/**
 * scripts/co2-trend-comparison.ts
 * Phase 2 분석: CO2 1인당 배출량 추세 비교 (2000 vs 최신)
 *
 * 데이터 소스:
 *   - country_data 테이블, indicator_code='EN.GHG.CO2.PC.CE.AR5'
 *   - 6개 파일럿 국가: KOR, USA, DEU, BRA, NGA, BGD
 *
 * 계산:
 *   - 2000년 기준값과 최신 연도(2022 또는 2023) 값 비교
 *   - 변화율: ((latest - 2000) / 2000) * 100
 *   - 변화율 순으로 랭킹
 *
 * 출력: data/analysis/co2-trend-comparison.md
 * 실행: npx tsx --env-file=.env.local scripts/co2-trend-comparison.ts
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ── 환경변수 검증 ──
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수 누락');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── 상수 ──
const INDICATOR_CODE = 'EN.GHG.CO2.PC.CE.AR5';
const PILOT_COUNTRIES: Record<string, string> = {
  KOR: 'South Korea',
  USA: 'United States',
  DEU: 'Germany',
  BRA: 'Brazil',
  NGA: 'Nigeria',
  BGD: 'Bangladesh',
};

// ── 결과 타입 ──
interface TrendResult {
  iso3: string;
  country: string;
  value2000: number | null;
  latestYear: number | null;
  latestValue: number | null;
  changePercent: number | null;
  trend: string;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Phase 2: CO2 1인당 배출량 추세 비교 (2000-2023)');
  console.log(`시각: ${new Date().toISOString()}`);
  console.log(`지표: ${INDICATOR_CODE}`);
  console.log('='.repeat(60));

  // country_data 테이블에서 해당 지표의 전체 데이터 조회
  const { data: allData, error } = await supabase
    .from('country_data')
    .select('country_iso3, year, value')
    .eq('indicator_code', INDICATOR_CODE)
    .in('country_iso3', Object.keys(PILOT_COUNTRIES))
    .order('year', { ascending: true });

  if (error) {
    console.error('[ERROR] country_data 조회 실패:', error.message);
    process.exit(1);
  }

  if (!allData || allData.length === 0) {
    console.error(`[ERROR] ${INDICATOR_CODE} 데이터 없음`);
    process.exit(1);
  }

  console.log(`[INFO] 총 ${allData.length}개 데이터 포인트 로드됨`);

  // 국가별 데이터 그룹화
  const byCountry = new Map<string, Array<{ year: number; value: number }>>();
  for (const row of allData) {
    const iso3 = row.country_iso3.trim();
    if (!byCountry.has(iso3)) {
      byCountry.set(iso3, []);
    }
    if (row.value !== null && row.value !== undefined) {
      byCountry.get(iso3)!.push({ year: row.year, value: Number(row.value) });
    }
  }

  // 각 국가의 2000년 값과 최신 값 추출
  const results: TrendResult[] = [];

  for (const [iso3, name] of Object.entries(PILOT_COUNTRIES)) {
    const countryData = byCountry.get(iso3);
    if (!countryData || countryData.length === 0) {
      console.log(`[WARN] ${iso3}: 데이터 없음`);
      results.push({
        iso3,
        country: name,
        value2000: null,
        latestYear: null,
        latestValue: null,
        changePercent: null,
        trend: 'N/A',
      });
      continue;
    }

    // 2000년 값
    const data2000 = countryData.find(d => d.year === 2000);

    // 최신 연도 값 (2023 우선, 없으면 2022)
    const sortedDesc = [...countryData].sort((a, b) => b.year - a.year);
    const latest = sortedDesc[0];

    const value2000 = data2000?.value ?? null;
    const latestYear = latest?.year ?? null;
    const latestValue = latest?.value ?? null;

    let changePercent: number | null = null;
    let trend = 'N/A';

    if (value2000 !== null && latestValue !== null && value2000 !== 0) {
      changePercent = ((latestValue - value2000) / value2000) * 100;
      trend = changePercent >= 0 ? 'Increasing' : 'Decreasing';
    }

    console.log(`  ${iso3}: 2000=${value2000?.toFixed(2) ?? 'N/A'} -> ${latestYear}=${latestValue?.toFixed(2) ?? 'N/A'} (${changePercent !== null ? changePercent.toFixed(1) + '%' : 'N/A'})`);

    results.push({
      iso3,
      country: name,
      value2000,
      latestYear,
      latestValue,
      changePercent,
      trend,
    });
  }

  // 변화율 순 정렬 (null은 마지막)
  const ranked = [...results].sort((a, b) => {
    if (a.changePercent === null && b.changePercent === null) return 0;
    if (a.changePercent === null) return 1;
    if (b.changePercent === null) return -1;
    return a.changePercent - b.changePercent;
  });

  // Markdown 생성
  const now = new Date().toISOString().split('T')[0];
  let md = `# CO2 Per Capita Trend Comparison (2000-2023)\n\n`;
  md += `> Phase 2 Analysis | Generated: ${now}\n`;
  md += `> Source indicator: \`${INDICATOR_CODE}\` from \`country_data\` table\n`;
  md += `> Unit: metric tons CO2 equivalent per capita\n`;
  md += `> Confidence: MEDIUM (single source - Climate Watch / WDI)\n\n`;

  md += `## Methodology\n\n`;
  md += `- **Base year**: 2000\n`;
  md += `- **Comparison**: Latest available year (2022 or 2023)\n`;
  md += `- **Formula**: Change % = ((Latest Value - 2000 Value) / 2000 Value) x 100\n`;
  md += `- **Countries**: 6 pilot countries (KOR, USA, DEU, BRA, NGA, BGD)\n\n`;

  md += `## Results (Ranked by Change %)\n\n`;
  md += `| Rank | Country | ISO3 | 2000 Value | Latest Year | Latest Value | Change % | Trend |\n`;
  md += `|------|---------|------|-----------|-------------|-------------|---------|-------|\n`;

  ranked.forEach((r, idx) => {
    const arrow = r.trend === 'Increasing' ? 'Increasing' : r.trend === 'Decreasing' ? 'Decreasing' : 'N/A';
    md += `| ${idx + 1} | ${r.country} | ${r.iso3} | ${r.value2000 !== null ? r.value2000.toFixed(2) : 'N/A'} | ${r.latestYear ?? 'N/A'} | ${r.latestValue !== null ? r.latestValue.toFixed(2) : 'N/A'} | ${r.changePercent !== null ? (r.changePercent >= 0 ? '+' : '') + r.changePercent.toFixed(1) + '%' : 'N/A'} | ${arrow} |\n`;
  });

  md += `\n## Analysis\n\n`;

  // 분석 텍스트 생성
  const decreasing = ranked.filter(r => r.changePercent !== null && r.changePercent < 0);
  const increasing = ranked.filter(r => r.changePercent !== null && r.changePercent >= 0);

  if (decreasing.length > 0 || increasing.length > 0) {
    md += `Among the six pilot countries, `;

    if (decreasing.length > 0) {
      md += `${decreasing.map(r => `${r.country} (${r.changePercent!.toFixed(1)}%)`).join(', ')} showed declining per-capita CO2 emissions from 2000 to their latest available year. `;
    }

    if (increasing.length > 0) {
      md += `In contrast, ${increasing.map(r => `${r.country} (+${r.changePercent!.toFixed(1)}%)`).join(', ')} showed increasing per-capita emissions over the same period. `;
    }

    // 추가 해석
    const highIncome = ranked.filter(r => ['USA', 'DEU', 'KOR'].includes(r.iso3));
    const lowIncome = ranked.filter(r => ['NGA', 'BGD', 'BRA'].includes(r.iso3));

    const hiDecreasing = highIncome.filter(r => r.changePercent !== null && r.changePercent < 0);
    const loIncreasing = lowIncome.filter(r => r.changePercent !== null && r.changePercent > 0);

    if (hiDecreasing.length > 0 && loIncreasing.length > 0) {
      md += `\n\nThis pattern reflects a broader global trend: high-income economies (${hiDecreasing.map(r => r.country).join(', ')}) have been reducing per-capita emissions through energy efficiency improvements and decarbonization policies, while developing economies (${loIncreasing.map(r => r.country).join(', ')}) are still on upward trajectories driven by industrialization and rising energy demand. The absolute emissions per capita in developing countries remain far below those of high-income nations, even after years of growth.`;
    }
  } else {
    md += `Insufficient data available for trend analysis across all pilot countries.`;
  }

  md += `\n\n---\n\n`;
  md += `*Generated by VisualClimate Phase 2 analysis pipeline*\n`;

  // 파일 저장
  const outputPath = join(process.cwd(), 'data', 'analysis', 'co2-trend-comparison.md');
  writeFileSync(outputPath, md, 'utf-8');
  console.log(`\n[OUTPUT] ${outputPath} 저장 완료`);

  // 최종 요약
  console.log('\n' + '='.repeat(60));
  console.log('CO2 추세 비교 분석 완료');
  console.log(`  국가 수: ${results.filter(r => r.changePercent !== null).length}/${Object.keys(PILOT_COUNTRIES).length}`);
  console.log(`  감소 국가: ${decreasing.length}개`);
  console.log(`  증가 국가: ${increasing.length}개`);
  console.log(`  출력 파일: data/analysis/co2-trend-comparison.md`);
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
