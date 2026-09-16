create table if not exists public.account_ai_credentials (
  user_id uuid not null,
  provider text not null,
  encrypted_api_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider),
  constraint account_ai_credentials_provider check (provider in ('gemini', 'openai', 'claude'))
);

insert into public.account_ai_credentials (user_id, provider, encrypted_api_key, created_at, updated_at)
select projects.user_id, credentials.provider, credentials.encrypted_api_key, credentials.created_at, credentials.updated_at
from public.project_ai_credentials credentials
join public.projects projects on projects.id = credentials.project_id
on conflict (user_id, provider) do update
set encrypted_api_key = excluded.encrypted_api_key,
    updated_at = excluded.updated_at;

drop table if exists public.project_ai_credentials;