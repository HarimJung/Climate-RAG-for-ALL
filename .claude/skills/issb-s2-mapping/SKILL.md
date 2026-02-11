---
name: issb-s2-mapping
description: Complete ISSB S2 + TCFD + GRI 305 + SDG 13 framework mapping to VisualClimate indicators. Load when mapping data to disclosure frameworks.
---

# ISSB S2 / TCFD / GRI / SDG Framework Mapping

## ISSB S2 Pillar Mapping

### Pillar 1: Governance (S2 Para 5-10)
| Requirement | Para | VisualClimate Data | Status |
|---|---|---|---|
| Board oversight of climate risks | 5-6 | NDC policy data, climate law existence | Partial (policy indicators) |
| Management role in assessment | 7-10 | N/A (corporate-level) | Not applicable for country-level |

### Pillar 2: Strategy (S2 Para 11-22)
| Requirement | Para | VisualClimate Data | Status |
|---|---|---|---|
| Climate risks and opportunities | 11-12 | Physical risk indicators (Domain E) | Mapped |
| Impact on business model | 13-14 | Energy transition indicators (Domain B) | Mapped |
| Financial impact | 15-19 | GDP impact, adaptation finance (Domain C, F) | Partial |
| Climate resilience / scenario analysis | 20-22 | CCKP scenario data (SSP1/2/5) | Mapped |

### Pillar 3: Risk Management (S2 Para 23-28)
| Requirement | Para | VisualClimate Data | Status |
|---|---|---|---|
| Risk identification process | 23-24 | ND-GAIN vulnerability sectors | Mapped |
| Risk management process | 25-26 | Adaptation readiness indicators | Mapped |
| Integration into overall risk | 27-28 | Composite vulnerability score | Mapped |

### Pillar 4: Metrics & Targets (S2 Para 29-37)
| Requirement | Para | VisualClimate Data | Status |
|---|---|---|---|
| GHG emissions (Scope 1, 2, 3) | 29(a) | Total GHG, CO2 per capita, sector breakdown | Mapped |
| Transition risks metrics | 29(b) | Energy intensity, renewable share, fossil subsidies | Mapped |
| Physical risks metrics | 29(c) | Temperature anomaly, extreme events, sea level | Mapped |
| Climate targets | 33-36 | NDC targets, net-zero year, carbon pricing | Mapped |
| Carbon credits | 37 | N/A at country level | Not applicable |

## TCFD Cross-Reference

| TCFD Pillar | TCFD Recommendation | ISSB S2 Equivalent | VisualClimate Domain |
|---|---|---|---|
| Governance | a) Board oversight | Para 5-6 | Domain G |
| Governance | b) Management role | Para 7-10 | Domain G |
| Strategy | a) Risks & opportunities | Para 11-12 | Domain E, F |
| Strategy | b) Impact on organization | Para 13-19 | Domain B, C |
| Strategy | c) Resilience / scenarios | Para 20-22 | Domain E (CCKP) |
| Risk Management | a) Risk identification | Para 23-24 | Domain F (ND-GAIN) |
| Risk Management | b) Risk management | Para 25-26 | Domain F |
| Risk Management | c) Integration | Para 27-28 | Domain F |
| Metrics & Targets | a) Metrics used | Para 29 | Domain A, B, E |
| Metrics & Targets | b) GHG emissions | Para 29(a) | Domain A |
| Metrics & Targets | c) Targets | Para 33-36 | Domain G |

## GRI 305 Cross-Reference

| GRI Standard | Disclosure | VisualClimate Indicator | Source |
|---|---|---|---|
| GRI 305-1 | Direct GHG (Scope 1) | Total GHG by sector | Climate TRACE, EDGAR |
| GRI 305-2 | Energy indirect GHG (Scope 2) | Electricity generation emissions | Ember, EDGAR |
| GRI 305-3 | Other indirect GHG (Scope 3) | Consumption-based emissions | OWID |
| GRI 305-4 | GHG emissions intensity | Emissions per GDP | Derived |
| GRI 305-5 | Reduction of GHG | YoY emissions change | Derived |
| GRI 305-6 | ODS emissions | N/A | Not collected |
| GRI 305-7 | NOx, SOx, other | PM2.5 (proxy) | WDI |

## SDG 13 Target Mapping

| SDG Target | Description | VisualClimate Indicators |
|---|---|---|
| 13.1 | Strengthen resilience to climate hazards | ND-GAIN scores, physical risk indicators, disaster damage |
| 13.2 | Integrate climate into policy | NDC targets, climate law, carbon pricing, emissions trends |
| 13.3 | Climate education and awareness | Not directly measured (future expansion) |
| 13.a | Mobilize $100B/year for developing countries | Adaptation finance received |
| 13.b | Promote mechanisms for LDCs and SIDS | Policy indicators for BGD, NGA |
