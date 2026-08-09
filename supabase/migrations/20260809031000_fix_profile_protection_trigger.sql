-- ============================================================================
-- Fix profiles_protect_privileged_fields (added in the previous migration).
--
-- Bug: auth.uid() is NULL for requests that aren't a specific end-user
-- session — the service-role key, and the SQL Editor / promote_to_admin.sql
-- script both fall into this category. The trigger's original condition,
-- `if not is_admin()`, evaluated true in those cases too (is_admin() also
-- reads auth.uid()), so it silently pinned role back to its old value even
-- for those trusted, already-privileged contexts. That broke the very
-- promote_to_admin.sql bootstrap script the project depends on for
-- creating the first admin.
--
-- Fix: only apply the protection when there's an actual authenticated
-- end-user session that ISN'T an admin (auth.uid() is not null and not
-- is_admin()). Service-role/direct-SQL contexts (auth.uid() is null) are
-- inherently trusted already — they bypass RLS entirely — so they should
-- bypass this trigger too.
-- ============================================================================

create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
    new.department_id := old.department_id;
    new.supervisor_id := old.supervisor_id;
    new.email := old.email;
  end if;
  return new;
end;
$$;
