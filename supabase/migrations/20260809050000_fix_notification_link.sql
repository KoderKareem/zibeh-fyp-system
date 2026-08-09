-- ============================================================================
-- Fix on_package_decision: it points the notification's link at
-- '/student/submissions/<id>', a route that was never built. The actual
-- page showing a package's status and the supervisor's comment is
-- /student/history. Needed now because the notification bell UI is about
-- to render this link.
-- ============================================================================

create or replace function public.on_package_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
      '/student/history'
    );

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'submission_package.' || new.status,
      'submission_package',
      new.id,
      jsonb_build_object('student_id', new.student_id, 'supervisor_id', new.supervisor_id)
    );
  end if;
  return new;
end;
$$;
