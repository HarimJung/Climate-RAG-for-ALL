'use client';

import { useEffect } from 'react';

export default function CountryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CountryPage Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[--bg-primary] px-4">
      <div className="mx-auto max-w-md rounded-xl border border-[--border-card] bg-white p-8 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="mb-3 text-xl font-semibold text-[--text-primary]">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-[--text-secondary]">
          This country profile encountered an error while loading. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-[#0066FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0052CC]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
