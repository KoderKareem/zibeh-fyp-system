-- ============================================================================
-- Fix set_active_session (added two migrations ago).
--
-- The unqualified `update academic_sessions set is_active = (id = ...)`
-- worked fine when run directly in the SQL Editor (which executes with an
-- elevated role), but Supabase enforces "no UPDATE without a WHERE clause"
-- as a hard restriction for normal roles — not just the lint warning shown
-- in the editor. So the RPC failed with "UPDATE requires a WHERE clause"
-- the moment a real admin session (authenticated role, not the SQL Editor)
-- called it.
--
-- Fix: same end result, split into two statements that each have an actual
-- WHERE clause.
-- ============================================================================

create or replace function public.set_active_session(p_session_id uuid)
returns void
language plpgsql
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change the active session';
  end if;

  update public.academic_sessions set is_active = true where id = p_session_id;
  update public.academic_sessions set is_active = false where id <> p_session_id;
  update public.system_settings set active_session_id = p_session_id, updated_at = now() where id = 1;
end;
$$;
