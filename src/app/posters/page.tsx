import { Metadata } from 'next';
import { createMetaTags } from '@/components/seo/MetaTags';
import { PostersClient } from './PostersClient';

export const metadata: Metadata = createMetaTags({
  title: 'Climate Posters',
  description: 'Downloadable climate data posters for 200+ countries. Share on LinkedIn.',
  path: '/posters',
});

export default function PostersPage() {
  return <PostersClient />;
}
