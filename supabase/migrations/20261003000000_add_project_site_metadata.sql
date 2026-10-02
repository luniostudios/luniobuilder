alter table public.projects
add column if not exists site_metadata jsonb not null default '{}'::jsonb;