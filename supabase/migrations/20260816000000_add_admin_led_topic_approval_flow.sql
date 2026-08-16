-- ============================================================================
-- Admin-led topic approval flow.
--
-- Old flow: every student has a permanent supervisor before they can submit;
-- submissions go straight to that supervisor.
--
-- New flow: students can submit immediately after registering, with no
-- supervisor assigned yet. Packages land in an admin queue. Admin either
-- (a) delegates the package to a supervisor for a normal approve-one/
-- reject-all decision, or (b) makes that decision directly as admin.
--
-- Path (a): once the delegated supervisor approves, they automatically
-- become the student's permanent supervisor — no separate assignment step.
-- Path (b): admin picks an oversight supervisor manually right after
-- approving; on rejection, no supervisor is assigned and the student
-- resubmits a fresh, unassigned package.
--
-- Design notes:
-- - "Unassigned, pending" and "delegated, pending" are NOT new states —
--   they're just submission_packages.supervisor_id being empty vs filled in
--   while status is still 'pending'. Reusing that column keeps this change
--   small: the supervisor dashboard's existing `.eq("supervisor_id", me)`
--   query already starts finding delegated packages the instant admin fills
--   the field in, with no query changes needed.
-- - supervisor_id can no longer double as "who decided this package" (an
--   admin-direct decision leaves it empty forever), so decided_by is added
--   to make that unambiguous without joining audit_logs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Packages can now start with no supervisor.
-- ----------------------------------------------------------------------------

alter table public.submission_packages alter column supervisor_id drop not null;

alter table public.submission_packages
  add column decided_by uuid references public.profiles (id) on delete set null;

-- Backfill decided_by for packages that were already decided before this
-- column existed, using the actor already recorded in audit_logs at the
-- time of the decision (the on_package_decision trigger has always logged
-- auth.uid() as actor_id on every approve/reject). Picks the most recent
-- matching log entry per package, in case a row was ever re-logged.
update public.submission_packages sp
set decided_by = backfill.actor_id
from (
  select distinct on (entity_id) entity_id, actor_id
  from public.audit_logs
  where action in ('submission_package.approved', 'submission_package.rejected')
  order by entity_id, created_at desc
) as backfill
where sp.id = backfill.entity_id
  and sp.status <> 'pending'
  and sp.decided_by is null;

alter table public.submission_packages
  add constraint packages_decided_by_required_on_decision check (
    status = 'pending' or decided_by is not null
  );

-- ----------------------------------------------------------------------------
-- RLS: a supervisor delegated a package (path a) needs to see that student's
-- basic profile (e.g. their name on the review page) even before that
-- supervisor becomes the student's permanent one. Previously this only
-- worked because a package's supervisor was always already the student's
-- permanent supervisor — that invariant no longer holds.
-- ----------------------------------------------------------------------------

drop policy profiles_select_own_or_related on public.profiles;

create policy profiles_select_own_or_related on public.profiles
  for select using (
    id = auth.uid()
    or public.is_admin()
    or supervisor_id = auth.uid()
    or id = public.my_supervisor_id()
    or exists (
      select 1 from public.submission_packages sp
      where sp.student_id = profiles.id and sp.supervisor_id = auth.uid()
    )
  );

-- No other policy changes are needed:
-- - submission_packages update/select already key off `is_admin()` or
--   `supervisor_id = auth.uid()`, both of which already do the right thing
--   once supervisor_id can be null or filled in later.
-- - submission_topics inherits visibility from the parent package, unaffected.
-- - profiles update already lets admin set any student's supervisor_id
--   (this is the existing /admin/users assignment path, reused as-is for
--   path b's post-approval oversight-supervisor assignment).

-- ----------------------------------------------------------------------------
-- Submission RPC: drop the "must already have a supervisor" requirement.
-- Every package now starts unassigned, full stop.
-- ----------------------------------------------------------------------------

create or replace function public.submit_submission_package(p_topics jsonb)
returns uuid
language plpgsql
as $$
declare
  v_package_id uuid;
  v_session_id uuid;
  v_submissions_open boolean;
  v_topic jsonb;
  v_topic_number smallint := 0;
begin
  if jsonb_array_length(p_topics) <> 3 then
    raise exception 'Exactly 3 topics are required';
  end if;

  select submissions_open, active_session_id
    into v_submissions_open, v_session_id
    from public.system_settings where id = 1;

  if v_session_id is null then
    raise exception 'No active academic session is set. Contact an administrator.';
  end if;
  if coalesce(v_submissions_open, false) is false then
    raise exception 'Submissions are currently closed.';
  end if;

  if exists (
    select 1 from public.submission_packages
    where student_id = auth.uid() and status = 'pending'
  ) then
    raise exception 'You already have a submission pending review.';
  end if;

  insert into public.submission_packages (student_id, supervisor_id, session_id)
  values (auth.uid(), null, v_session_id)
  returning id into v_package_id;

  for v_topic in select * from jsonb_array_elements(p_topics)
  loop
    v_topic_number := v_topic_number + 1;

    if nullif(trim(both from (v_topic ->> 'case_study')), '') is null then
      raise exception 'Case study is required for topic %', v_topic_number;
    end if;

    insert into public.submission_topics (package_id, topic_number, title, case_study, description, keywords)
    values (
      v_package_id,
      v_topic_number,
      trim(both from (v_topic ->> 'title')),
      trim(both from (v_topic ->> 'case_study')),
      nullif(trim(both from (v_topic ->> 'description')), ''),
      coalesce(
        (select array_agg(trim(both from k)) from jsonb_array_elements_text(v_topic -> 'keywords') as k
         where trim(both from k) <> ''),
        '{}'
      )
    );
  end loop;

  return v_package_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Decision trigger: unchanged approve/reject notification + audit logging,
-- plus delegated-path auto-assignment. security definer because the acting
-- user here can be a supervisor, who has no RLS rights to update another
-- user's profile or insert a notification for them directly.
-- ----------------------------------------------------------------------------

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

    -- Delegated-path (a) auto-assignment: a package only carries a
    -- supervisor_id here if admin delegated it to that supervisor. Admin's
    -- own direct decisions (path b) never set it, so this never fires for
    -- those — the oversight supervisor for path b is assigned separately,
    -- by admin, right after approval.
    if new.status = 'approved' and new.supervisor_id is not null then
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

-- Note: path (b)'s "assign an oversight supervisor right after a direct
-- approval" doesn't need any new database logic. Admin already has direct
-- insert rights on notifications (notifications_admin_insert) and full
-- write rights on profiles, so that step is just a plain update + a plain
-- notification insert from application code — no trigger involved.
