import type { Metadata } from 'next';

const SITE_URL = 'https://visualclimate.com';

interface MetaTagsConfig {
  title: string;
  description: string;
  ogImage?: string;
  path?: string;
}

export function createMetaTags({
  title,
  description,
  ogImage,
  path = '',
}: MetaTagsConfig): Metadata {
  const url = `${SITE_URL}${path}`;
  // Default OG image via /api/og if none is explicitly provided
  const imageUrl = ogImage || `${SITE_URL}/api/og?title=${encodeURIComponent(title)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'VisualClimate',
      type: 'website',
      locale: 'en_US',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: url },
  };
}
