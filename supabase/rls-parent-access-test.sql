-- Manual RLS test for parent camera isolation.
-- Run this in Supabase SQL Editor after creating:
-- 1. parent A auth user and profile role 'parent'
-- 2. parent B auth user and profile role 'parent'
-- 3. class A, class B, camera A, camera B
-- 4. mappings:
--    - parent A -> class A in public.user_classes
--    - parent B -> class B in public.user_classes
--    - class A -> camera A in public.class_cameras
--    - class B -> camera B in public.class_cameras
--
-- Replace the placeholders below.

begin;

select set_config(
  'request.jwt.claim.sub',
  'PARENT_A_USER_UUID',
  true
);

select set_config(
  'request.jwt.claim.role',
  'authenticated',
  true
);

set local role authenticated;

-- Expected: returns only parent A profile.
select id, nama, role
from public.profiles
order by nama;

-- Expected: returns only class A.
select id, nama_kelas
from public.classes
order by nama_kelas;

-- Expected: returns only camera A.
select id, nama_kamera, source_name
from public.cameras
order by nama_kamera;

-- Expected: returns only class-camera mapping for class A.
select class_id, camera_id
from public.class_cameras
order by class_id, camera_id;

-- Expected: returns zero rows for camera B.
select id, nama_kamera, source_name
from public.cameras
where id = 'CAMERA_B_UUID';

-- Expected: returns zero rows for class B.
select id, nama_kelas
from public.classes
where id = 'CLASS_B_UUID';

rollback;
