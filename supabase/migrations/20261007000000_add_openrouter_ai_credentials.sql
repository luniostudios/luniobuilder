alter table public.account_ai_credentials
  drop constraint if exists account_ai_credentials_provider;

alter table public.account_ai_credentials
  add constraint account_ai_credentials_provider
  check (provider in ('gemini', 'openai', 'claude', 'openrouter'));