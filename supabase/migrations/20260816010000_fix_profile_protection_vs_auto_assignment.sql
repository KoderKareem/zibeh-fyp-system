-- ============================================================================
-- Fix: profiles_protect_privileged_fields (see 20260809030000/31000) silently
-- reverts profiles.supervisor_id back to its old value on any update made by
-- a non-admin. It was written to stop a student/supervisor from escalating
-- their own row via a raw REST PATCH — but on_package_decision's new
-- delegated-path auto-assignment (20260816000000) is also a non-admin
-- update: it runs as the delegated supervisor's auth.uid(), not admin's.
-- The protection trigger can't tell "supervisor self-escalating" apart from
-- "system auto-assigning them after a legitimate approval" — both look
-- identical from auth.uid()'s point of view — so it was reverting the
-- auto-assignment too, silently (no error, so nothing caught this except
-- an end-to-end test).
--
-- Fix: on_package_decision sets a transaction-local flag immediately before
-- its trusted profiles update; protect_privileged_profile_fields treats that
-- flag as a narrow, deliberate bypass on top of its existing admin check.
-- The flag is transaction-scoped (set_config's third argument, is_local =
-- true) so it can never leak into or affect any other statement or request.
-- ============================================================================

create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_admin()
     and coalesce(current_setting('app.bypass_profile_protection', true), 'false') <> 'true' then
    new.role := old.role;
    new.is_active := old.is_active;
    new.department_id := old.department_id;
    new.supervisor_id := old.supervisor_id;
    new.email := old.email;
  end if;
  return new;
end;
$$;

create or replace function public.on_package_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_supervisor_name text;
begin
  if new.status <> 'pending' and new.status is distinct from old.status then
    insert into public.notifications (user_id, title, body, link)
    values (
      new.student_id,
      case when new.status = 'approved'
        then 'One of your topics was approved'
        else 'Your topic package was rejected'
      end,
      new.supervisor_comment,
      '/student/submissions/' || new.id
    );

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'submission_package.' || new.status,
      'submission_package',
      new.id,
      jsonb_build_object('student_id', new.student_id, 'supervisor_id', new.supervisor_id)
    );

    if new.status = 'approved' and new.supervisor_id is not null then
      perform set_config('app.bypass_profile_protection', 'true', true);
      update public.profiles set supervisor_id = new.supervisor_id where id = new.student_id;

      select full_name into v_supervisor_name from public.profiles where id = new.supervisor_id;

      insert into public.notifications (user_id, title, body, link)
      values (
        new.student_id,
        'You have been assigned a supervisor',
        coalesce(v_supervisor_name, 'Your supervisor') || ' is now your supervisor for this project.',
        '/student/history'
      );
    end if;
  end if;
  return new;
end;
$$;
