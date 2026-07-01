-- Enable Row Level Security for CCTV Digital Swanda.
-- Run after 202607010001_initial_schema.sql.

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
    where uc.user_id = auth.uid()
    and uc.class_id = target_class_id
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
    join public.class_cameras cc on cc.class_id = uc.class_id
    where uc.user_id = auth.uid()
    and cc.camera_id = target_camera_id
  )
$$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.cameras enable row level security;
alter table public.class_cameras enable row level security;
alter table public.user_classes enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_insert_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_select_admin"
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy "profiles_insert_admin"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "profiles_delete_admin"
on public.profiles
for delete
to authenticated
using (public.is_admin());

drop policy if exists "classes_select_admin_principal" on public.classes;
drop policy if exists "classes_select_parent_assigned" on public.classes;
drop policy if exists "classes_insert_admin" on public.classes;
drop policy if exists "classes_update_admin" on public.classes;
drop policy if exists "classes_delete_admin" on public.classes;

create policy "classes_select_admin_principal"
on public.classes
for select
to authenticated
using (public.is_admin() or public.is_principal());

create policy "classes_select_parent_assigned"
on public.classes
for select
to authenticated
using (public.user_has_class(id));

create policy "classes_insert_admin"
on public.classes
for insert
to authenticated
with check (public.is_admin());

create policy "classes_update_admin"
on public.classes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "classes_delete_admin"
on public.classes
for delete
to authenticated
using (public.is_admin());

drop policy if exists "cameras_select_admin_principal" on public.cameras;
drop policy if exists "cameras_select_parent_assigned" on public.cameras;
drop policy if exists "cameras_insert_admin" on public.cameras;
drop policy if exists "cameras_update_admin" on public.cameras;
drop policy if exists "cameras_delete_admin" on public.cameras;

create policy "cameras_select_admin_principal"
on public.cameras
for select
to authenticated
using (public.is_admin() or public.is_principal());

create policy "cameras_select_parent_assigned"
on public.cameras
for select
to authenticated
using (public.user_has_camera(id));

create policy "cameras_insert_admin"
on public.cameras
for insert
to authenticated
with check (public.is_admin());

create policy "cameras_update_admin"
on public.cameras
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "cameras_delete_admin"
on public.cameras
for delete
to authenticated
using (public.is_admin());

drop policy if exists "class_cameras_select_admin_principal" on public.class_cameras;
drop policy if exists "class_cameras_select_parent_assigned" on public.class_cameras;
drop policy if exists "class_cameras_insert_admin" on public.class_cameras;
drop policy if exists "class_cameras_update_admin" on public.class_cameras;
drop policy if exists "class_cameras_delete_admin" on public.class_cameras;

create policy "class_cameras_select_admin_principal"
on public.class_cameras
for select
to authenticated
using (public.is_admin() or public.is_principal());

create policy "class_cameras_select_parent_assigned"
on public.class_cameras
for select
to authenticated
using (public.user_has_class(class_id));

create policy "class_cameras_insert_admin"
on public.class_cameras
for insert
to authenticated
with check (public.is_admin());

create policy "class_cameras_update_admin"
on public.class_cameras
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "class_cameras_delete_admin"
on public.class_cameras
for delete
to authenticated
using (public.is_admin());

drop policy if exists "user_classes_select_own" on public.user_classes;
drop policy if exists "user_classes_select_admin" on public.user_classes;
drop policy if exists "user_classes_insert_admin" on public.user_classes;
drop policy if exists "user_classes_update_admin" on public.user_classes;
drop policy if exists "user_classes_delete_admin" on public.user_classes;

create policy "user_classes_select_own"
on public.user_classes
for select
to authenticated
using (user_id = auth.uid());

create policy "user_classes_select_admin"
on public.user_classes
for select
to authenticated
using (public.is_admin());

create policy "user_classes_insert_admin"
on public.user_classes
for insert
to authenticated
with check (public.is_admin());

create policy "user_classes_update_admin"
on public.user_classes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "user_classes_delete_admin"
on public.user_classes
for delete
to authenticated
using (public.is_admin());

drop policy if exists "activity_logs_select_admin" on public.activity_logs;
drop policy if exists "activity_logs_insert_own" on public.activity_logs;

create policy "activity_logs_select_admin"
on public.activity_logs
for select
to authenticated
using (public.is_admin());

create policy "activity_logs_insert_own"
on public.activity_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    camera_id is null
    or public.is_admin()
    or public.is_principal()
    or public.user_has_camera(camera_id)
  )
);
