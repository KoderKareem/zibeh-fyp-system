-- ============================================================================
-- Chapter-by-chapter project submission.
--
-- Once a student has an approved topic package AND an assigned supervisor
-- (profiles.supervisor_id), they submit their project as 5 sequential
-- chapters from /student/chapters. Their supervisor approves each chapter or
-- requests a revision (comment required) from /supervisor/chapters. Chapter N
-- can only be submitted once chapter N-1 is approved. The final project
-- upload (submit_final_project) now also requires all 5 to be approved.
--
-- Design notes:
-- - One row per (package, chapter). "Not Submitted" isn't stored — it's just
--   the absence of a row. A re-upload after a revision request overwrites
--   the same row (same pattern as a rejected final project), bumping
--   submission_count. supervisor_comment is deliberately kept on re-upload,
--   so the supervisor reviewing a resubmission can still see what they asked
--   for; it's replaced by their next decision.
-- - The reviewer is the student's *current* supervisor (profiles.
--   supervisor_id), resolved at read/decide time rather than copied onto the
--   row — if admin reassigns a student, pending chapters follow them to the
--   new supervisor automatically.
-- - No insert/update/delete RLS policies at all: every write goes through
--   submit_chapter / decide_chapter (security definer), which enforce the
--   sequencing, ownership and status rules server-side — same reasoning as
--   submit_final_project. Clients can only read.
-- ============================================================================

create table public.project_chapters (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.submission_packages (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  chapter_number smallint not null check (chapter_number between 1 and 5),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'revision_requested')),
  document_path text not null, -- object path in the private project-documents bucket
  original_filename text,
  submission_count integer not null default 1,
  supervisor_comment text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  unique (package_id, chapter_number),
  constraint chapters_comment_required_on_revision check (
    status <> 'revision_requested' or supervisor_comment is not null
  )
);

create index project_chapters_student_id_idx on public.project_chapters (student_id);
create index project_chapters_status_idx on public.project_chapters (status);

-- ----------------------------------------------------------------------------
-- RLS: read-only for the owning student, their current supervisor, and admin.
-- ----------------------------------------------------------------------------

-- security definer so it reads profiles without re-entering profiles' RLS
-- (same approach as is_admin / my_supervisor_id).
create or replace function public.is_supervisor_of(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = p_student_id and supervisor_id = auth.uid()
  );
$$;

alter table public.project_chapters enable row level security;

create policy chapters_select_related on public.project_chapters
  for select using (
    student_id = auth.uid()
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- Student: submit a chapter, or re-upload one after a revision request.
-- ----------------------------------------------------------------------------

create or replace function public.submit_chapter(
  p_chapter_number integer,
  p_document_path text,
  p_original_filename text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package_id uuid;
  v_supervisor_id uuid;
  v_existing public.project_chapters%rowtype;
  v_chapter_id uuid;
begin
  if p_chapter_number is null or p_chapter_number not between 1 and 5 then
    raise exception 'Invalid chapter number';
  end if;
  if nullif(trim(both from p_document_path), '') is null then
    raise exception 'A document is required';
  end if;

  select id into v_package_id
    from public.submission_packages
    where student_id = auth.uid() and status = 'approved'
    order by decided_at desc nulls last
    limit 1;
  if v_package_id is null then
    raise exception 'You need an approved topic before submitting chapters';
  end if;

  select supervisor_id into v_supervisor_id from public.profiles where id = auth.uid();
  if v_supervisor_id is null then
    raise exception 'You need an assigned supervisor before submitting chapters';
  end if;

  if p_chapter_number > 1 and not exists (
    select 1 from public.project_chapters
    where package_id = v_package_id
      and chapter_number = p_chapter_number - 1
      and status = 'approved'
  ) then
    raise exception 'Chapter % must be approved before you can submit chapter %',
      p_chapter_number - 1, p_chapter_number;
  end if;

  select * into v_existing
    from public.project_chapters
    where package_id = v_package_id and chapter_number = p_chapter_number
    for update;

  if v_existing.id is not null then
    if v_existing.status <> 'revision_requested' then
      raise exception 'Chapter % has already been submitted', p_chapter_number;
    end if;

    update public.project_chapters set
      status = 'pending',
      document_path = p_document_path,
      original_filename = nullif(trim(both from p_original_filename), ''),
      submission_count = submission_count + 1,
      submitted_at = now(),
      decided_at = null,
      decided_by = null
    where id = v_existing.id
    returning id into v_chapter_id;
  else
    insert into public.project_chapters (
      package_id, student_id, chapter_number, document_path, original_filename
    ) values (
      v_package_id, auth.uid(), p_chapter_number, p_document_path,
      nullif(trim(both from p_original_filename), '')
    )
    returning id into v_chapter_id;
  end if;

  return v_chapter_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Supervisor: approve a pending chapter, or request a revision (comment
-- required). Only the student's current supervisor can decide, and only
-- while the chapter is pending — an approved chapter is final.
-- ----------------------------------------------------------------------------

create or replace function public.decide_chapter(
  p_chapter_id uuid,
  p_decision text,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chapter public.project_chapters%rowtype;
  v_comment text := nullif(trim(both from p_comment), '');
begin
  if p_decision is null or p_decision not in ('approved', 'revision_requested') then
    raise exception 'Invalid decision';
  end if;

  select * into v_chapter from public.project_chapters where id = p_chapter_id for update;
  if v_chapter.id is null or not public.is_supervisor_of(v_chapter.student_id) then
    raise exception 'Chapter not found';
  end if;
  if v_chapter.status <> 'pending' then
    raise exception 'This chapter has already been reviewed';
  end if;
  if p_decision = 'revision_requested' and v_comment is null then
    raise exception 'A comment is required when requesting a revision';
  end if;

  update public.project_chapters set
    status = p_decision,
    supervisor_comment = v_comment, -- optional on approval, required (checked above) on revision
    decided_at = now(),
    decided_by = auth.uid()
  where id = p_chapter_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Notify + audit-log each chapter decision — same pattern as
-- on_package_decision / on_repository_review_decision.
-- ----------------------------------------------------------------------------

create or replace function public.on_chapter_decision()
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
        then 'Chapter ' || new.chapter_number || ' was approved'
        else 'Revision requested on Chapter ' || new.chapter_number
      end,
      new.supervisor_comment,
      '/student/chapters'
    );

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'project_chapter.' || new.status,
      'project_chapter',
      new.id,
      jsonb_build_object(
        'student_id', new.student_id,
        'chapter_number', new.chapter_number,
        'submission_count', new.submission_count
      )
    );
  end if;
  return new;
end;
$$;

create trigger project_chapters_on_decision
  after update on public.project_chapters
  for each row execute function public.on_chapter_decision();

-- ----------------------------------------------------------------------------
-- Notify the student's current supervisor whenever a chapter lands in their
-- queue — a first submission (insert) or a re-upload after a revision
-- request (update back to 'pending'). security definer for the same reason
-- as the decision triggers: the acting user (the student) has no RLS right
-- to insert a notification for someone else.
-- ----------------------------------------------------------------------------

create or replace function public.on_chapter_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_supervisor_id uuid;
  v_student_name text;
begin
  if new.status = 'pending'
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    select supervisor_id, full_name into v_supervisor_id, v_student_name
      from public.profiles where id = new.student_id;

    if v_supervisor_id is not null then
      insert into public.notifications (user_id, title, body, link)
      values (
        v_supervisor_id,
        case when new.submission_count > 1
          then 'Chapter ' || new.chapter_number || ' resubmitted for review'
          else 'Chapter ' || new.chapter_number || ' submitted for review'
        end,
        coalesce(nullif(v_student_name, ''), 'A student') || ' submitted Chapter ' || new.chapter_number || '.',
        '/supervisor/chapters/' || new.id
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger project_chapters_on_submitted
  after insert or update on public.project_chapters
  for each row execute function public.on_chapter_submitted();

-- ----------------------------------------------------------------------------
-- Final project upload now also requires all 5 chapters approved. Identical
-- to the 20260809090000 version apart from the added chapter check.
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
  if (
    select count(*) from public.project_chapters
    where package_id = p_package_id and status = 'approved'
  ) < 5 then
    raise exception 'All 5 chapters must be approved before you can upload your final project';
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
