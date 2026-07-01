-- Initial schema for CCTV Digital Swanda.
-- This migration intentionally does not enable Row Level Security (RLS).

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role'
    and n.nspname = 'public'
  ) then
    create type public.user_role as enum ('admin', 'principal', 'parent');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role public.user_role not null default 'parent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  nama_kelas text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cameras (
  id uuid primary key default gen_random_uuid(),
  nama_kamera text not null,
  source_name text not null unique,
  tunnel_url text not null,
  snapshot_url text,
  deskripsi text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_cameras (
  class_id uuid not null references public.classes(id) on delete cascade,
  camera_id uuid not null references public.cameras(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (class_id, camera_id)
);

create table if not exists public.user_classes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, class_id)
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  camera_id uuid references public.cameras(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx
  on public.profiles (role);

create index if not exists class_cameras_camera_id_idx
  on public.class_cameras (camera_id);

create index if not exists user_classes_class_id_idx
  on public.user_classes (class_id);

create index if not exists activity_logs_user_id_idx
  on public.activity_logs (user_id);

create index if not exists activity_logs_camera_id_idx
  on public.activity_logs (camera_id);

create index if not exists activity_logs_created_at_idx
  on public.activity_logs (created_at desc);

create index if not exists cameras_is_active_idx
  on public.cameras (is_active);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_classes_updated_at on public.classes;
create trigger set_classes_updated_at
before update on public.classes
for each row
execute function public.set_updated_at();

drop trigger if exists set_cameras_updated_at on public.cameras;
create trigger set_cameras_updated_at
before update on public.cameras
for each row
execute function public.set_updated_at();

drop trigger if exists set_class_cameras_updated_at on public.class_cameras;
create trigger set_class_cameras_updated_at
before update on public.class_cameras
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_classes_updated_at on public.user_classes;
create trigger set_user_classes_updated_at
before update on public.user_classes
for each row
execute function public.set_updated_at();

drop trigger if exists set_activity_logs_updated_at on public.activity_logs;
create trigger set_activity_logs_updated_at
before update on public.activity_logs
for each row
execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_principal()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'principal', false)
$$;
