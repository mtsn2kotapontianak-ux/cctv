-- Add soft-deactivation for profiles and make role helper ignore inactive users.
-- Run after 202607010002_enable_rls.sql.

alter table public.profiles
add column if not exists is_active boolean not null default true;

create index if not exists profiles_is_active_idx
  on public.profiles (is_active);

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
  and is_active = true
$$;

create or replace function public.current_user_is_active()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and is_active = true
  )
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

create or replace function public.user_has_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_classes uc
    join public.profiles p on p.id = uc.user_id
    where uc.user_id = auth.uid()
    and uc.class_id = target_class_id
    and p.is_active = true
  )
$$;

create or replace function public.user_has_camera(target_camera_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_classes uc
    join public.profiles p on p.id = uc.user_id
    join public.class_cameras cc on cc.class_id = uc.class_id
    where uc.user_id = auth.uid()
    and cc.camera_id = target_camera_id
    and p.is_active = true
  )
$$;

drop policy if exists "user_classes_select_own" on public.user_classes;
create policy "user_classes_select_own"
on public.user_classes
for select
to authenticated
using (
  user_id = auth.uid()
  and public.current_user_is_active()
);

drop policy if exists "activity_logs_insert_own" on public.activity_logs;
create policy "activity_logs_insert_own"
on public.activity_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.current_user_is_active()
  and (
    camera_id is null
    or public.is_admin()
    or public.is_principal()
    or public.user_has_camera(camera_id)
  )
);
