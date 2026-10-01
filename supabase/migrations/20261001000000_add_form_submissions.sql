create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  page_id text not null default 'unknown',
  form_id text not null default 'unknown',
  fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists form_submissions_project_id_idx
  on public.form_submissions(project_id);

create index if not exists form_submissions_created_at_idx
  on public.form_submissions(created_at desc);
