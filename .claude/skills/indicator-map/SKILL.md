---
name: indicator-map
description: Complete indicator map with 50+ indicators across 8 domains. Maps each indicator to data source, unit, ISSB S2 reference, and SDG target. Load when collecting data, building charts, or mapping frameworks.
---

# Indicator Map (8 Domains, 50+ Indicators)

## Domain A: GHG Emissions

| Indicator | Code/Source | Unit | ISSB S2 | SDG |
|---|---|---|---|---|
| Total GHG emissions | EN.ATM.GHGT.KT.CE (WDI) / Climate TRACE | kt CO2eq | Para 29(a) | 13.2 |
| CO2 per capita | EN.ATM.CO2E.PC (WDI) | metric tons | Para 29(a) | 13.2 |
| CO2 total | EN.ATM.CO2E.KT (WDI) / EDGAR | kt | Para 29(a) | 13.2 |
| Methane (CH4) | EN.ATM.METH.KT.CE (WDI) | kt CO2eq | Para 29(a) | 13.2 |
| N2O emissions | EN.ATM.NOXE.KT.CE (WDI) | kt CO2eq | Para 29(a) | 13.2 |
| Emissions by sector | Climate TRACE / EDGAR | kt CO2eq | Para 29(a) | 13.2 |
| Emissions intensity (per GDP) | Derived: GHG / GDP | kg CO2eq/USD | Para 29(b) | 13.2 |

## Domain B: Energy

| Indicator | Code/Source | Unit | ISSB S2 | SDG |
|---|---|---|---|---|
| Primary energy consumption | EG.USE.PCAP.KG.OE (WDI) | kg oil eq/cap | Para 29(b) | 7.2 |
| Electricity generation | Ember | TWh | Para 29(b) | 7.2 |
| Electricity mix (fossil/nuclear/renewable) | Ember | % share | Para 29(b) | 7.2 |
| Renewable energy share | EG.FEC.RNEW.ZS (WDI) / IRENA | % of total | Para 29(b) | 7.2 |
| Renewable capacity | IRENA | MW | Para 29(b) | 7.2 |
| Solar capacity | IRENA | MW | — | 7.2 |
| Wind capacity | IRENA | MW | — | 7.2 |
| Energy intensity | EG.EGY.PRIM.PP.KD (WDI) | MJ/USD | Para 29(b) | 7.3 |
| Fossil fuel subsidies | OWID / IEA | USD | Para 29(b) | 12.c |

## Domain C: Socioeconomic Context

| Indicator | Code/Source | Unit | ISSB S2 | SDG |
|---|---|---|---|---|
| GDP (current USD) | NY.GDP.MKTP.CD (WDI) | USD | Context | 8.1 |
| GDP per capita | NY.GDP.PCAP.CD (WDI) | USD | Context | 8.1 |
| GDP PPP | NY.GDP.MKTP.PP.CD (WDI) | intl USD | Context | 8.1 |
| Population | SP.POP.TOTL (WDI) | count | Context | — |
| Urban population % | SP.URB.TOTL.IN.ZS (WDI) | % | Context | 11.1 |
| HDI | UNDP | index 0-1 | Context | — |
| Poverty rate | SI.POV.DDAY (WDI) | % below $2.15/day | Context | 1.1 |

## Domain D: Land & Forests

| Indicator | Code/Source | Unit | ISSB S2 | SDG |
|---|---|---|---|---|
| Forest area | AG.LND.FRST.ZS (WDI) | % of land | Para 29(a) | 15.1 |
| Forest area change | AG.LND.FRST.K2 (WDI) + derived | km²/year | Para 29(a) | 15.2 |
| Agricultural land | AG.LND.AGRI.ZS (WDI) | % of land | — | 15.3 |
| Agricultural emissions | Climate TRACE / EDGAR | kt CO2eq | Para 29(a) | 2.4 |

## Domain E: Physical Climate Risk

| Indicator | Code/Source | Unit | ISSB S2 | SDG |
|---|---|---|---|---|
| Mean temperature anomaly | CCKP | °C vs baseline | Para 22 | 13.1 |
| Extreme heat days | CCKP | days/year > 35°C | Para 22 | 13.1 |
| Precipitation change | CCKP | % change | Para 22 | 13.1 |
| Sea level rise exposure | CCKP / ND-GAIN | population count | Para 22 | 13.1 |
| PM2.5 air pollution | EN.ATM.PM25.MC.M3 (WDI) | μg/m³ | Para 22 | 11.6 |
| Natural disaster damage | EM-DAT / WDI | USD / deaths | Para 22 | 13.1 |

## Domain F: Vulnerability & Readiness

| Indicator | Code/Source | Unit | ISSB S2 | SDG |
|---|---|---|---|---|
| ND-GAIN overall score | ND-GAIN | index 0-100 | Para 22 | 13.1 |
| ND-GAIN vulnerability | ND-GAIN | index 0-1 | Para 22 | 13.1 |
| ND-GAIN readiness | ND-GAIN | index 0-1 | Para 22 | 13.1 |
| Food sector vulnerability | ND-GAIN | index 0-1 | Para 22 | 2.4 |
| Water sector vulnerability | ND-GAIN | index 0-1 | Para 22 | 6.4 |
| Health sector vulnerability | ND-GAIN | index 0-1 | Para 22 | 3.d |
| Adaptation finance received | OWID / OECD | USD | Para 22 | 13.a |

## Domain G: Policy & NDC

| Indicator | Code/Source | Unit | ISSB S2 | SDG |
|---|---|---|---|---|
| NDC target (% reduction) | Climate Watch | % vs base year | Para 33-36 | 13.2 |
| NDC target year | Climate Watch | year | Para 33-36 | 13.2 |
| Net-zero declaration | Climate Watch / OWID | year or N/A | Para 33-36 | 13.2 |
| Carbon pricing mechanism | World Bank Carbon Pricing | type + USD/tCO2 | Para 29(b) | 13.2 |
| Climate law existence | Climate Watch / Grantham | yes/no + year | Para 33-36 | 13.2 |

## Domain H: ESG Framework Mapping

| Indicator | Framework | Reference | Mapped to |
|---|---|---|---|
| Scope 1+2 emissions | ISSB S2 | Para 29(a) | Domain A indicators |
| Transition risks | ISSB S2 | Para 20-21 | Domain B, G indicators |
| Physical risks | ISSB S2 / TCFD | Para 22 | Domain E, F indicators |
| Governance & Strategy | TCFD | Pillars 1-2 | Domain G indicators |
| Risk Management | TCFD | Pillar 3 | Domain E, F indicators |
| GHG Protocol alignment | GRI 305 | 305-1 to 305-7 | Domain A indicators |
| Climate Action | SDG 13 | Targets 13.1-13.3 | All domains |
