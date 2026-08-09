-- One-time bootstrap: promote an existing account to admin.
--
-- Self-registration can never create an admin account (by design — see
-- handle_new_user() in the init migration). So the very first admin has to
-- be created this way:
--   1. Sign up normally through the app (as a student or supervisor).
--   2. Run this script in the Supabase SQL Editor, with your email below.
--
-- Safe to run again later for additional admins.

update public.profiles
set role = 'admin'
where email = 'REPLACE_WITH_YOUR_EMAIL@example.com';
