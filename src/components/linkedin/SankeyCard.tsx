'use client';

import React from 'react';
import { ClimateSankey } from '@/components/charts/ClimateSankey';
import { LinkedInCard } from './LinkedInCard';

interface SankeyCardProps {
  countryName: string;
  iso3: string;
  fossil: number;
  renewable: number;
  nuclear: number;
  year: number;
}

export function SankeyCard({ countryName, iso3, fossil, renewable, nuclear, year }: SankeyCardProps) {
  return (
    <LinkedInCard
      countryName={countryName}
      iso3={iso3}
      title="Electricity Generation Mix"
      subtitle={`Energy flow ${year}`}
      stat={{
        value: `${renewable.toFixed(1)}%`,
        label: 'Renewable share',
      }}
      source={`Source: Ember Global Electricity Review ${year}`}
    >
      <div className="flex h-full items-center justify-center py-4">
        <ClimateSankey
          country={countryName}
          fossil={fossil}
          renewable={renewable}
          nuclear={nuclear}
        />
      </div>
    </LinkedInCard>
  );
}
