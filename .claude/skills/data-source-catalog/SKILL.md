---
name: data-source-catalog
description: Complete catalog of 12 climate data sources with API endpoints, formats, and access methods. Load when collecting data or checking source availability.
---

# Data Source Catalog (12 Sources)

## Tier 1 — Emissions

### 1. Climate TRACE
- **Endpoint**: https://api.climatetrace.org/v6/
- **Coverage**: Global, sector-level, facility-level, monthly updates
- **Format**: CSV, JSON, REST API v6
- **Unique value**: Satellite-based independent measurement; cross-verify with EDGAR/UNFCCC
- **Rate limit**: Check api.climatetrace.org/docs
- **Pilot use**: Sector-level emissions for 6 countries

### 2. EDGAR (JRC)
- **Endpoint**: https://edgar.jrc.europa.eu/ (bulk download)
- **Coverage**: Global, country, sector, 1970–2023
- **Format**: Excel, CSV download
- **Unique value**: EU official; longest time series; 0.1°×0.1° gridmap; IPCC classification
- **Access**: Bulk download, no API key needed
- **Pilot use**: Historical emissions baseline, cross-validation with Climate TRACE

### 3. Climate Watch (WRI/CAIT)
- **Endpoint**: https://www.climatewatchdata.org/api/v1/
- **Coverage**: GHG emissions, NDC text, LTS, adaptation
- **Format**: JSON API
- **Key endpoints**:
  - `/emissions`: GHG data by country/sector/gas
  - `/ndcs`: NDC targets and text
  - `/adaptation`: Adaptation actions
- **Unique value**: NDC text parsing, policy linkage, SDG mapping
- **Pilot use**: NDC targets, policy data

## Tier 2 — Energy & Economy

### 4. World Bank WDI
- **Endpoint**: https://api.worldbank.org/v2/
- **Coverage**: 1,400+ indicators, 266 economies, 1960–present
- **Format**: JSON API
- **Pattern**: `https://api.worldbank.org/v2/country/{iso2}/indicator/{code}?format=json&date=2000:2023&per_page=500`
- **Key indicators**:
  - EN.ATM.CO2E.PC (CO2 per capita)
  - EG.USE.PCAP.KG.OE (energy use per capita)
  - AG.LND.FRST.ZS (forest area %)
  - EN.ATM.PM25.MC.M3 (PM2.5)
  - NY.GDP.PCAP.CD (GDP per capita)
  - SP.POP.TOTL (population)
  - SP.URB.TOTL.IN.ZS (urban population %)
  - EG.FEC.RNEW.ZS (renewable energy %)
  - EN.ATM.GHGT.KT.CE (total GHG)
  - NY.GDP.MKTP.CD (GDP current USD)
- **Rate limit**: ~50 requests/minute
- **Pilot use**: Primary socioeconomic context, energy indicators

### 5. Ember
- **Endpoint**: https://ember-energy.org/data/
- **Coverage**: Electricity generation/consumption, monthly
- **Format**: CSV download, API
- **Unique value**: Faster monthly updates than IEA; detailed power mix
- **Pilot use**: Electricity mix, generation trends

### 6. IRENA
- **Endpoint**: https://irena.org/Data
- **Coverage**: Renewable capacity/generation, country-level, 2000–present
- **Format**: CSV download
- **Unique value**: Renewable energy specialist; solar/wind/hydro/bio breakdown
- **Pilot use**: Renewable energy capacity and trends

## Tier 3 — Vulnerability & Adaptation

### 7. ND-GAIN
- **Endpoint**: https://gain.nd.edu/our-work/country-index/download-data/
- **Coverage**: Vulnerability/readiness index, 185 countries, 45 indicators, 1995–present
- **Format**: CSV bulk download
- **Unique value**: Country-level adaptation readiness; 6-sector vulnerability decomposition
- **Pilot use**: Vulnerability scores, adaptation readiness comparison

### 8. World Bank CCKP
- **Endpoint**: https://climateknowledgeportal.worldbank.org
- **Coverage**: Temperature/precipitation projections, scenario-based, country/basin level
- **Format**: CSV, API
- **Unique value**: Physical climate risk (CMIP6-based projections)
- **Pilot use**: Temperature/precipitation projections, physical risk data

## Tier 4 — Policy & Framework

### 9. UNFCCC NDC Registry
- **Access**: Via Climate Watch API integration
- **Coverage**: Global NDC original text, targets, timelines
- **Format**: PDF + Climate Watch parsing
- **Pilot use**: NDC targets as primary source

### 10. ISSB/IFRS S2
- **Access**: https://ifrs.org (PDF download)
- **Coverage**: Full climate disclosure requirements
- **Format**: PDF
- **Data points**: 93 disclosure data points across 4 pillars
- **Pilot use**: Framework mapping baseline document

### 11. TCFD Final Report
- **Access**: https://fsb-tcfd.org (PDF download)
- **Coverage**: Climate-related financial disclosure recommendations
- **Format**: PDF
- **Structure**: Governance / Strategy / Risk Management / Metrics & Targets
- **Pilot use**: Risk categorization framework

### 12. Our World in Data (OWID)
- **Endpoint**: https://github.com/owid/owid-datasets
- **Coverage**: Pre-processed climate/energy/population data
- **Format**: CSV (GitHub)
- **Unique value**: Already cleaned data; fast prototyping
- **Pilot use**: Quick validation, gap-filling for missing indicators
