alter table public.projects
  add column if not exists site_slug text;

update public.projects
set site_slug = substr(regexp_replace(
  lower(regexp_replace(coalesce(nullif(title, ''), 'site'), '[^a-zA-Z0-9]+', '-', 'g')),
  '(^-+|-+$)', '', 'g'
), 1, 56) || '-' || substr(md5(id::text), 1, 6)
where site_slug is null;

alter table public.projects
  alter column site_slug set not null;

create unique index if not exists projects_site_slug_unique
  on public.projects (site_slug);

alter table public.projects
  add constraint projects_site_slug_format
  check (site_slug ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$');
