create table if not exists public.project_ai_credentials (
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null,
  encrypted_api_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, provider),
  constraint project_ai_credentials_provider check (provider in ('gemini', 'openai', 'claude'))
);