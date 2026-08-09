-- ============================================================================
-- Support for the admin module: /admin/dashboard, /admin/users,
-- /admin/departments, /admin/sessions, /admin/repository/add, /admin/reports.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Security fix: profiles_update_own_or_admin (from the initial migration)
-- lets a user update their OWN row via `id = auth.uid()`, but RLS is
-- row-level, not column-level — nothing stopped a logged-in student from
-- PATCHing their own row directly against the REST API and setting
-- role='admin', department_id, supervisor_id, or is_active to whatever they
-- want. This never had a UI path to trigger it, but it was reachable by
-- anyone with their own valid session and the (public) anon key.
--
-- Fix: a BEFORE UPDATE trigger that silently pins the privileged columns
-- back to their existing value whenever the actor updating the row isn't an
-- admin. Admins (is_admin() = true) are unaffected and can still edit any
-- profile, including these fields — that's how /admin/users edits work.
-- ----------------------------------------------------------------------------

create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
    new.department_id := old.department_id;
    new.supervisor_id := old.supervisor_id;
    new.email := old.email;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_privileged_profile_fields();

-- ----------------------------------------------------------------------------
-- Track how a repository_projects row got there: a real approved submission
-- vs. an admin backfilling a past year's project directly (/admin/repository/add).
-- ----------------------------------------------------------------------------

alter table public.repository_projects
  add column source text not null default 'submission'
  check (source in ('submission', 'admin_backfill'));

-- ----------------------------------------------------------------------------
-- Atomically mark one academic session active (and the rest inactive), and
-- point system_settings at it. Security invoker (default) — RLS on both
-- tables already restricts writes to admins, this just keeps the two
-- updates together instead of leaving them as separate round-trips.
-- ----------------------------------------------------------------------------

create or replace function public.set_active_session(p_session_id uuid)
returns void
language plpgsql
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change the active session';
  end if;

  update public.academic_sessions set is_active = (id = p_session_id);
  update public.system_settings set active_session_id = p_session_id, updated_at = now() where id = 1;
end;
$$;
