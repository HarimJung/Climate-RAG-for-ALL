/**
 * ND-GAIN Vulnerability & Readiness ETL
 * 6개 파일럿 국가의 연도별 vulnerability/readiness score 파싱
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const COUNTRIES = new Set(['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD']);
const YEAR_START = 2000;
const YEAR_END = 2023;

interface Row {
  country_iso3: string;
  indicator_code: string;
  year: number;
  value: number;
  source: string;
}

function parseCsv(filePath: string, indicatorCode: string): Row[] {
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.trim().split('\n');
  const header = lines[0].replace(/"/g, '').split(',');
  // header: ISO3, Name, 1995, 1996, ..., 2023
  const yearIndices: { year: number; col: number }[] = [];
  for (let i = 2; i < header.length; i++) {
    const y = parseInt(header[i]);
    if (y >= YEAR_START && y <= YEAR_END) {
      yearIndices.push({ year: y, col: i });
    }
  }

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].replace(/"/g, '').split(',');
    const iso3 = cols[0]?.trim();
    if (!iso3 || !COUNTRIES.has(iso3)) continue;

    for (const { year, col } of yearIndices) {
      const val = parseFloat(cols[col]);
      if (isNaN(val)) continue;
      rows.push({
        country_iso3: iso3,
        indicator_code: indicatorCode,
        year,
        value: Math.round(val * 1000000) / 1000000,
        source: 'ND-GAIN',
      });
    }
  }
  return rows;
}

const vulnRows = parseCsv('/tmp/ndgain/resources/vulnerability/vulnerability.csv', 'NDGAIN.VULNERABILITY');
const readyRows = parseCsv('/tmp/ndgain/resources/readiness/readiness.csv', 'NDGAIN.READINESS');
const allRows = [...vulnRows, ...readyRows];

console.log(`Vulnerability: ${vulnRows.length} rows`);
console.log(`Readiness: ${readyRows.length} rows`);
console.log(`Total: ${allRows.length} rows`);

for (const iso3 of COUNTRIES) {
  const v = vulnRows.filter(r => r.country_iso3 === iso3).length;
  const r = readyRows.filter(r => r.country_iso3 === iso3).length;
  console.log(`  ${iso3}: vuln=${v}, ready=${r}`);
}

mkdirSync('/Users/harimgemmajung/Documents/visualclimate/data', { recursive: true });
writeFileSync('/Users/harimgemmajung/Documents/visualclimate/data/ndgain-scores.json', JSON.stringify(allRows, null, 2));
console.log(`\nJSON written to data/ndgain-scores.json`);
