create table if not exists public.cms_collections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_collections_name_not_empty check (length(trim(name)) > 0),
  constraint cms_collections_slug_format check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$')
);

create unique index if not exists cms_collections_project_slug_unique
  on public.cms_collections(project_id, slug);

create table if not exists public.cms_records (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.cms_collections(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_records_collection_id_idx
  on public.cms_records(collection_id);