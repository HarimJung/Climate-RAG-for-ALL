interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const SITE_URL = 'https://visualclimate.com';

export function buildCountryJsonLd({
  name,
  iso3,
  description,
}: {
  name: string;
  iso3: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${name} Climate Profile`,
    description,
    url: `${SITE_URL}/country/${iso3}`,
    creator: {
      '@type': 'Organization',
      name: 'VisualClimate',
      url: SITE_URL,
    },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    spatialCoverage: { '@type': 'Place', name },
    temporalCoverage: '2000/2023',
    variableMeasured: [
      'CO2 emissions per capita',
      'Renewable energy consumption',
      'Forest area',
      'GDP per capita',
      'PM2.5 air pollution',
    ],
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'VisualClimate',
    url: SITE_URL,
    description:
      'Open climate data platform. 200 countries. Real-time indicators for ESG analysts, consultants, and sustainability managers.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/compare?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
