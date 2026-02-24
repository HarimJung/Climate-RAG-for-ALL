-- NDC (Nationally Determined Contribution) targets table
create table if not exists public.ndc_targets (
  iso3 char(3) primary key references public.countries(iso3),
  country_name text not null,
  target_year int not null default 2030,
  target_pct_reduction numeric,
  target_abs_mtco2e numeric,
  reference_year int,
  base_year_value numeric,
  submission_status text not null default 'not_submitted'
    check (submission_status in ('submitted', 'not_submitted', 'updated')),
  source_url text,
  updated_at timestamptz default now()
);

alter table public.ndc_targets enable row level security;
create policy "public_read" on public.ndc_targets for select using (true);
