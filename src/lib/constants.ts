export const CLIMATE_INDICATORS = [
  { source: 'worldbank', code: 'EN.GHG.CO2.PC.CE.AR5', name: 'CO2 emissions per capita', unit: 't CO2e/capita', category: 'emissions' },
  { source: 'ember', code: 'EMBER.RENEWABLE.PCT', name: 'Renewable electricity share', unit: '%', category: 'energy' },
  { source: 'worldbank', code: 'EN.ATM.PM25.MC.M3', name: 'PM2.5 air pollution', unit: 'µg/m³', category: 'risk' },
  { source: 'worldbank', code: 'NY.GDP.PCAP.CD', name: 'GDP per capita', unit: 'US$', category: 'economy' },
  { source: 'worldbank', code: 'AG.LND.FRST.ZS', name: 'Forest area', unit: '% of land area', category: 'land' },
  { source: 'worldbank', code: 'EG.USE.PCAP.KG.OE', name: 'Energy use per capita', unit: 'kg oil eq.', category: 'energy' },
] as const;

export const PILOT_ISO3 = ['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD'] as const;

export const ALL_ISO3 = [
  // Original 6 pilot countries
  'KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD',
  // Expanded 14 countries
  'CHN', 'IND', 'JPN', 'GBR', 'FRA', 'CAN',
  'AUS', 'IDN', 'SAU', 'ZAF', 'MEX', 'RUS', 'TUR', 'EGY',
] as const;

export type Iso3 = typeof ALL_ISO3[number];

export const CHART_COLORS = ['#0066FF', '#00A67E', '#F59E0B', '#E5484D', '#8B5CF6', '#EC4899'];
