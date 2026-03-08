'use client';

import React from 'react';
import { SankeyCard } from '@/components/linkedin/SankeyCard';

interface Props {
  countryName: string;
  iso3: string;
  fossil: number;
  renewable: number;
  nuclear: number;
  year: number;
}

export function SankeyCardClient(props: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] py-12">
      <SankeyCard {...props} />
    </div>
  );
}
