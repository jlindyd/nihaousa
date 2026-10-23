-- NiHaoUSA: what a signed-in viewer keeps. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- One row per person. Lists hold show ids. progress maps show id -> {ep, pct, t}. watched maps show id -> last episode watched.

create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  later      int[]       not null default '{}',
  favs       int[]       not null default '{}',
  follow     int[]       not null default '{}',
  progress   jsonb       not null default '{}'::jsonb,
  watched    jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row-level security: a person can only ever see and change their own row.
alter table public.user_data enable row level security;

drop policy if exists "read own data"   on public.user_data;
drop policy if exists "insert own data" on public.user_data;
drop policy if exists "update own data" on public.user_data;
drop policy if exists "delete own data" on public.user_data;

create policy "read own data"   on public.user_data for select using ((select auth.uid()) = user_id);
create policy "insert own data" on public.user_data for insert with check ((select auth.uid()) = user_id);
create policy "update own data" on public.user_data for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own data" on public.user_data for delete using ((select auth.uid()) = user_id);
