create table if not exists public.project_domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  domain text not null,
  verified boolean not null default false,
  verification jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists project_domains_domain_unique
  on public.project_domains (lower(domain));

create index if not exists project_domains_project_id_idx
  on public.project_domains (project_id);

grant select, insert, update, delete on public.project_domains to service_role;