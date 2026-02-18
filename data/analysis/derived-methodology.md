# Derived Indicators Methodology

## Source Substitutions
- `EN.ATM.CO2E.PC` not available; used `EN.GHG.CO2.PC.CE.AR5` (Climate Watch CO2 per capita, tCO2e)
- `NY.GDP.MKTP.CD / SP.POP.TOTL` = GDP per capita; used `NY.GDP.PCAP.CD` directly (World Bank WDI, current USD)

---

## DERIVED.CO2_PER_GDP — Carbon intensity of GDP
- **Formula**: `EN.GHG.CO2.PC.CE.AR5 / NY.GDP.PCAP.CD * 1000`
- **Unit**: tCO2 per $1,000 GDP
- **Interpretation**: How much CO2 is emitted per unit of economic output. Lower = cleaner economy.
- **Coverage**: 6 countries, 2000-2023 (144 rows)
- **Validation (2023)**: DEU 0.13 < USA 0.17 < BRA 0.22 < NGA 0.26 < BGD 0.27 < KOR 0.32

## DERIVED.DECOUPLING — Decoupling Index
- **Formula**: `GDP_growth_rate(%) - CO2_growth_rate(%)`
  - `GDP_growth_rate = (GDP(t) - GDP(t-1)) / GDP(t-1) * 100`
  - `CO2_growth_rate = (CO2(t) - CO2(t-1)) / CO2(t-1) * 100`
- **Unit**: percentage points
- **Interpretation**: Positive = economy growing faster than emissions (decoupling). Negative = emissions growing faster (coupling).
- **Coverage**: 6 countries, 2001-2023 (138 rows; year 2000 excluded — no prior year for growth calc)
- **Validation (2023)**: DEU +19.0 (strong decoupling), USA +10.6, BRA +12.0, KOR +6.3, BGD -3.3, NGA -21.7

## DERIVED.ENERGY_TRANSITION — Energy Transition Momentum
- **Formula**: `EMBER.RENEWABLE.PCT(t) - EMBER.RENEWABLE.PCT(t-5)`
- **Unit**: percentage points (5-year change)
- **Interpretation**: How many percentage points the renewable electricity share changed over 5 years. Positive = increasing renewables.
- **Coverage**: 6 countries, 2005-2023 (114 rows; years 2000-2004 excluded — no t-5 data)
- **Validation (2023)**: DEU +19.2pp, BRA +6.6pp, USA +5.2pp, KOR +4.9pp, NGA +1.7pp, BGD -0.1pp

---

## Row Counts Summary
| Indicator | Rows | Years |
|-----------|------|-------|
| DERIVED.CO2_PER_GDP | 144 | 2000-2023 |
| DERIVED.DECOUPLING | 138 | 2001-2023 |
| DERIVED.ENERGY_TRANSITION | 114 | 2005-2023 |
| **Total** | **396** | |
