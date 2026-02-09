export const PLANS = {
  free: { name: 'Free', price: 0, ragLimit: 3, features: ['200 Country Profiles', 'Public Dashboard', 'Weekly Newsletter', '3 AI Questions/day'] },
  library: { name: 'Climate Library', price: 29, ragLimit: 20, features: ['Everything in Free', '20+ Guides & Frameworks', 'Unlimited Report Library', '20 AI Questions/day', 'Community Access'] },
  pro: { name: 'Climate Pro', price: 79, ragLimit: 9999, features: ['Everything in Library', 'Unlimited AI Questions', 'CSV Data Download', 'Country Profile PDF Export', 'Custom Alerts'] },
  kit: { name: 'Climate Kit', price: 199, ragLimit: 9999, features: ['Everything in Pro', 'ISSB S2 Draft Generator', 'Custom Dashboard', 'API Access (1000 calls/mo)', '1:1 Onboarding Call'] },
} as const;

export const CLIMATE_INDICATORS = [
  { source: 'worldbank', code: 'EN.ATM.CO2E.PC', name: 'CO2 emissions (metric tons per capita)', unit: 'metric tons', category: 'emissions' },
  { source: 'worldbank', code: 'EG.FEC.RNEW.ZS', name: 'Renewable energy consumption (% of total)', unit: '%', category: 'energy' },
  { source: 'worldbank', code: 'EN.CLC.MDAT.ZS', name: 'Population affected by droughts/floods/extreme temps (%)', unit: '%', category: 'risk' },
  { source: 'worldbank', code: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)', unit: 'US$', category: 'economy' },
  { source: 'worldbank', code: 'AG.LND.FRST.ZS', name: 'Forest area (% of land area)', unit: '%', category: 'land' },
] as const;
