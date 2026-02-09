create extension if not exists vector;

create table public.countries (
  id serial primary key,
  iso3 char(3) unique not null,
  name text not null,
  region text,
  sub_region text,
  income_group text,
  population bigint,
  lat numeric,
  lng numeric,
  flag_url text,
  created_at timestamptz default now()
);

create table public.indicators (
  id serial primary key,
  source text not null,
  code text not null,
  name text not null,
  unit text,
  category text,
  unique(source, code)
);

create table public.indicator_values (
  id serial primary key,
  indicator_id int references public.indicators(id) on delete cascade,
  country_id int references public.countries(id) on delete cascade,
  year int not null,
  value numeric,
  unique(indicator_id, country_id, year)
);

create table public.reports (
  id serial primary key,
  title text not null,
  org text not null,
  url text,
  published_date date,
  tags text[] default '{}',
  summary text,
  created_at timestamptz default now()
);

create table public.report_chunks (
  id serial primary key,
  report_id int references public.reports(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}'
);

create table public.email_signups (
  id serial primary key,
  email text unique not null,
  source text default 'landing',
  created_at timestamptz default now()
);

create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  plan text default 'free' check (plan in ('free', 'library', 'pro', 'kit')),
  stripe_customer_id text,
  rag_count_today int default 0,
  rag_reset_at date default current_date,
  created_at timestamptz default now()
);

create index idx_indicator_values_country on public.indicator_values(country_id);
create index idx_indicator_values_indicator on public.indicator_values(indicator_id);
create index idx_report_chunks_embedding on public.report_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 50);
create index idx_countries_iso3 on public.countries(iso3);

alter table public.countries enable row level security;
create policy "public_read" on public.countries for select using (true);
alter table public.indicators enable row level security;
create policy "public_read" on public.indicators for select using (true);
alter table public.indicator_values enable row level security;
create policy "public_read" on public.indicator_values for select using (true);
alter table public.reports enable row level security;
create policy "public_read" on public.reports for select using (true);
alter table public.report_chunks enable row level security;
create policy "public_read" on public.report_chunks for select using (true);
alter table public.email_signups enable row level security;
create policy "anyone_insert" on public.email_signups for insert with check (true);
alter table public.user_profiles enable row level security;
create policy "own_read" on public.user_profiles for select using (auth.uid() = id);
create policy "own_update" on public.user_profiles for update using (auth.uid() = id);

create or replace function match_report_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (id int, report_id int, content text, metadata jsonb, similarity float)
language sql stable
as $$
  select report_chunks.id, report_chunks.report_id, report_chunks.content, report_chunks.metadata,
    1 - (report_chunks.embedding <=> query_embedding) as similarity
  from report_chunks
  where 1 - (report_chunks.embedding <=> query_embedding) > match_threshold
  order by report_chunks.embedding <=> query_embedding
  limit match_count;
$$;
