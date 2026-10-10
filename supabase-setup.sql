-- THEOS-2 Dashboard: shared GeoJSON storage and admin-only writes
-- Run this entire script in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.shared_datasets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  geojson jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shared_datasets_name_not_blank check (length(trim(name)) > 0),
  constraint shared_datasets_geojson_is_object check (jsonb_typeof(geojson) = 'object')
);

create index if not exists shared_datasets_created_at_idx
  on public.shared_datasets (created_at);

alter table public.admin_users enable row level security;
alter table public.shared_datasets enable row level security;

-- Remove these policies first so this script can safely be re-run.
drop policy if exists "Admins can read their own admin row" on public.admin_users;
drop policy if exists "Anyone can read shared datasets" on public.shared_datasets;
drop policy if exists "Admins can insert shared datasets" on public.shared_datasets;
drop policy if exists "Admins can delete shared datasets" on public.shared_datasets;

create policy "Admins can read their own admin row"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Anyone can read shared datasets"
  on public.shared_datasets for select to anon, authenticated
  using (true);

create policy "Admins can insert shared datasets"
  on public.shared_datasets for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
    )
  );

create policy "Admins can delete shared datasets"
  on public.shared_datasets for delete to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- Enable Supabase Realtime for the shared dataset table (only if not already enabled).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'shared_datasets'
     ) then
    execute 'alter publication supabase_realtime add table public.shared_datasets';
  end if;
end $$;

-- After creating the administrator account in Authentication, add its UUID like this:
-- insert into public.admin_users (user_id) values ('PASTE_AUTH_USER_UUID_HERE');
