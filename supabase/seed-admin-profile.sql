-- Seed/update the first admin profile after creating the user in Supabase Auth.
-- Change the email below if your admin email is different.

insert into public.profiles (id, nama, role)
select
  id,
  'Admin Swanda',
  'admin'::public.user_role
from auth.users
where email = 'admin@swanda.sch.id'
on conflict (id) do update
set
  nama = excluded.nama,
  role = excluded.role,
  updated_at = now();

select
  p.id,
  u.email,
  p.nama,
  p.role,
  p.created_at,
  p.updated_at
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'admin@swanda.sch.id';
