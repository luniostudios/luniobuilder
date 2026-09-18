create table if not exists public.shop_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  provider text not null default 'stripe' check (provider in ('stripe', 'paypal', 'external')),
  currency text not null default 'usd' check (currency ~ '^[a-zA-Z]{3}$'),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);