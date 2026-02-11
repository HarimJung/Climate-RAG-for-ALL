export const CLIMATE_INDICATORS = [
  { source: 'worldbank', code: 'EN.ATM.CO2E.PC', name: 'CO2 emissions (metric tons per capita)', unit: 'metric tons', category: 'emissions' },
  { source: 'worldbank', code: 'EG.FEC.RNEW.ZS', name: 'Renewable energy consumption (% of total)', unit: '%', category: 'energy' },
  { source: 'worldbank', code: 'EN.CLC.MDAT.ZS', name: 'Population affected by droughts/floods/extreme temps (%)', unit: '%', category: 'risk' },
  { source: 'worldbank', code: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)', unit: 'US$', category: 'economy' },
  { source: 'worldbank', code: 'AG.LND.FRST.ZS', name: 'Forest area (% of land area)', unit: '%', category: 'land' },
] as const;
