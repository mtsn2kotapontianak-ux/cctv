-- Manual inactive-user access test.
-- Replace the IDs before running in Supabase SQL Editor.

-- 1. Deactivate a test parent.
update public.profiles
set is_active = false
where id = '00000000-0000-0000-0000-000000000000';

-- 2. Verify the role helper returns null for inactive users.
-- Run this check while impersonating the same user JWT in Supabase, or test via the app.
select public.current_user_role() as inactive_role;

-- 3. Admin can reactivate the user.
update public.profiles
set is_active = true
where id = '00000000-0000-0000-0000-000000000000';
