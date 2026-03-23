# QA Report

## 2026-02-11 Full Validation

### Build: PASS
- Next.js 16.1.6 (Turbopack)
- Compiled successfully in 1486.1ms
- 9 routes, 0 errors

### TypeScript: PASS
- `npx tsc --noEmit` — 0 errors
- Note: Stale `.next/dev/types/validator.ts` cache referenced deleted pages (chat, login, pricing, signup, api/rag, api/stripe). Fixed by clearing `.next/dev/types/`.

### Table Counts

| Table | Rows |
|-------|------|
| countries | 250 |
| indicators | 10 |
| country_data | 700 |

### Data Rows by Indicator x Country

| Indicator | BGD | BRA | DEU | KOR | NGA | USA |
|-----------|-----|-----|-----|-----|-----|-----|
| AG.LND.FRST.ZS | 24 | 24 | 24 | 24 | 24 | 24 |
| EG.USE.PCAP.KG.OE | 23 | 24 | 24 | 24 | 23 | 24 |
| EN.ATM.PM25.MC.M3 | 21 | 21 | 21 | 21 | 21 | 21 |
| EN.GHG.CO2.PC.CE.AR5 | 24 | 24 | 24 | 24 | 24 | 24 |
| NY.GDP.PCAP.CD | 24 | 24 | 24 | 24 | 24 | 24 |

### Issues Found
1. **EN.ATM.CO2E.PC deprecated** — World Bank API returns "deleted or archived". Using EN.GHG.CO2.PC.CE.AR5 (pre-existing data) as CO2/capita proxy.
2. **EG.USE.PCAP.KG.OE missing 2023** for BGD and NGA — World Bank has no 2023 data for these countries yet.
3. **EN.ATM.PM25.MC.M3 data ends at 2020** — PM2.5 dataset lags ~3 years across all countries.
4. **indicators table has 10 rows** (not 5) — 5 new + 5 legacy from previous schema. Consider cleaning legacy entries.

### Recommended Fixes
1. Register EN.GHG.CO2.PC.CE.AR5 in indicators table with proper ISSB/SDG mapping
2. Add EN.ATM.CO2E.PC -> EN.GHG.CO2.PC.CE.AR5 note to data-source-catalog skill
3. Clean up legacy indicator rows that aren't in the 5 core set
4. Update CLAUDE.md indicator list to reflect the CO2 code change
