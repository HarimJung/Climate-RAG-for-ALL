import { Metadata } from 'next';
import { createMetaTags } from '@/components/seo/MetaTags';
import { PostersClient } from './PostersClient';

export const metadata: Metadata = createMetaTags({
  title: 'Climate Posters',
  description: 'Downloadable climate data posters for 200+ countries. Share on LinkedIn.',
  path: '/posters',
});

export default function PostersPage() {
  return (
    <div className="bg-[--bg-primary]">
      <section className="px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-3xl font-bold text-[--text-primary]">Climate Posters</h1>
          <p className="mb-10 text-[--text-secondary]">
            Downloadable climate data visuals for 200+ countries.
            Filter by poster type, select a country, hover to download.
          </p>
          <PostersClient />
        </div>
      </section>
    </div>
  );
}
