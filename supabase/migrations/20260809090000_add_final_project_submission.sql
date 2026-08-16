-- ============================================================================
-- Final project submission: once a supervisor approves a topic package, the
-- student can upload their finished project (abstract, document, optional
-- source code link) from /student/history. This lands in repository_projects
-- as source = 'live_submission' with review_status = 'pending' — hidden from
-- /repository until an admin approves it at /admin/repository/pending.
-- Admin-backfilled entries are considered pre-reviewed (review_status
-- defaults to 'approved', matching their existing immediate visibility).
-- ============================================================================

-- source was seeded with a 'submission' value that nothing ever wrote — the
-- live submission flow didn't exist yet. Renaming it to the value this
-- migration actually uses.
alter table public.repository_projects drop constraint repository_projects_source_check;
alter table public.repository_projects
  add constraint repository_projects_source_check
  check (source in ('live_submission', 'admin_backfill'));

-- Never used by any app code — repurposing it to hold an external URL
-- (a link to the student's own repo) rather than a Storage object path.
alter table public.repository_projects rename column source_code_path to source_code_url;

alter table public.repository_projects
  add column review_status text not null default 'approved'
    check (review_status in ('pending', 'approved', 'rejected')),
  add column review_comment text,
  add column reviewed_by uuid references public.profiles (id) on delete set null,
  add column reviewed_at timestamptz,
  add constraint repository_review_comment_required_on_rejection check (
    review_status <> 'rejected' or review_comment is not null
  );

create index repository_projects_review_status_idx on public.repository_projects (review_status);

-- ----------------------------------------------------------------------------
-- Submits (or re-submits, after a rejection) the finished project for a
-- student's approved package. Security definer: repository_projects has no
-- general student write policy (repository_admin_write is admin-only, same
-- reasoning as submit_submission_package — every privileged/derived field
-- here (title, case_study, keywords, department/session/supervisor,
-- review_status, source, added_by) is controlled server-side rather than
-- trusted from the client, so no student-facing RLS write policy is needed).
-- ----------------------------------------------------------------------------

create or replace function public.submit_final_project(
  p_package_id uuid,
  p_abstract text,
  p_document_path text,
  p_source_code_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package public.submission_packages%rowtype;
  v_topic public.submission_topics%rowtype;
  v_department_id uuid;
  v_project_id uuid;
  v_existing_status text;
begin
  select * into v_package from public.submission_packages where id = p_package_id;
  if v_package.id is null then
    raise exception 'Submission package not found';
  end if;
  if v_package.student_id <> auth.uid() then
    raise exception 'You can only upload your own project';
  end if;
  if v_package.status <> 'approved' then
    raise exception 'This package has not been approved yet';
  end if;
  if nullif(trim(both from p_document_path), '') is null then
    raise exception 'A document is required';
  end if;

  select * into v_topic from public.submission_topics where id = v_package.approved_topic_id;
  select department_id into v_department_id from public.profiles where id = v_package.student_id;

  select id, review_status into v_project_id, v_existing_status
    from public.repository_projects where submission_package_id = p_package_id;

  if v_project_id is not null then
    if v_existing_status <> 'rejected' then
      raise exception 'This project has already been submitted for review';
    end if;

    update public.repository_projects set
      title = v_topic.title,
      case_study = v_topic.case_study,
      abstract = nullif(trim(both from p_abstract), ''),
      keywords = v_topic.keywords,
      department_id = v_department_id,
      document_path = p_document_path,
      source_code_url = nullif(trim(both from p_source_code_url), ''),
      review_status = 'pending',
      review_comment = null,
      reviewed_by = null,
      reviewed_at = null
    where id = v_project_id;
  else
    insert into public.repository_projects (
      title, case_study, abstract, keywords, department_id, session_id, supervisor_id,
      student_id, submission_package_id, document_path, source_code_url, access_level,
      source, review_status, added_by
    ) values (
      v_topic.title, v_topic.case_study, nullif(trim(both from p_abstract), ''), v_topic.keywords,
      v_department_id, v_package.session_id, v_package.supervisor_id, v_package.student_id,
      p_package_id, p_document_path, nullif(trim(both from p_source_code_url), ''), 'restricted',
      'live_submission', 'pending', v_package.student_id
    )
    returning id into v_project_id;
  end if;

  return v_project_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Notify + audit-log an admin's approve/reject decision on a final project
-- submission — same pattern as on_package_decision for topic decisions.
-- ----------------------------------------------------------------------------

create or replace function public.on_repository_review_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source = 'live_submission'
     and new.review_status <> 'pending'
     and new.review_status is distinct from old.review_status then
    insert into public.notifications (user_id, title, body, link)
    values (
      new.student_id,
      case when new.review_status = 'approved'
        then 'Your final project was approved'
        else 'Your final project submission was rejected'
      end,
      new.review_comment,
      '/student/history'
    );

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'repository_project.' || new.review_status,
      'repository_project',
      new.id,
      jsonb_build_object('student_id', new.student_id, 'title', new.title)
    );
  end if;
  return new;
end;
$$;

create trigger repository_projects_on_review_decision
  after update on public.repository_projects
  for each row execute function public.on_repository_review_decision();
