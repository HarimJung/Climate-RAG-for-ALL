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
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    alternates: { canonical: url },
  };
}
