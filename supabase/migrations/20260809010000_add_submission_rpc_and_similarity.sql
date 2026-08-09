-- ============================================================================
-- Student topic submission: an RPC that inserts one submission_packages row
-- plus its 3 submission_topics rows in a single atomic call, and a fuzzy
-- title-similarity search against repository_projects for the pre-submit
-- duplicate-check warning.
-- ============================================================================

create extension if not exists pg_trgm;

create index repository_projects_title_trgm_idx
  on public.repository_projects using gin (title gin_trgm_ops);

-- Fuzzy title match against the repository, used for the "similar project
-- already exists" warning. Plain SQL scoring is deliberately simple here —
-- see docs/FYP-Feature-List-and-Roadmap.md: "a simple keyword/title match is
-- enough for FYP scope; true NLP similarity is a stretch goal."
create or replace function public.search_similar_projects(
  search_title text,
  similarity_threshold real default 0.3
)
returns table (id uuid, title text, similarity real)
language sql
stable
as $$
  select id, title, similarity(title, search_title) as similarity
  from public.repository_projects
  where similarity(title, search_title) > similarity_threshold
  order by similarity desc
  limit 5;
$$;

-- Submits a student's batch-of-3 topic package atomically. Runs with the
-- caller's own privileges (NOT security definer) so the existing RLS
-- policies on submission_packages/submission_topics still apply — this
-- function is a convenience wrapper, not a privilege escalation path.
--
-- supervisor_id and session_id are deliberately NOT parameters: they're
-- looked up server-side from the student's own profile and the active
-- academic session, so a caller can't submit against a supervisor they
-- aren't assigned to or a session that isn't current.
create or replace function public.submit_submission_package(p_topics jsonb)
returns uuid
language plpgsql
as $$
declare
  v_package_id uuid;
  v_supervisor_id uuid;
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

  select supervisor_id into v_supervisor_id
    from public.profiles where id = auth.uid();

  if v_supervisor_id is null then
    raise exception 'You have not been assigned a supervisor yet. Contact an administrator.';
  end if;

  if exists (
    select 1 from public.submission_packages
    where student_id = auth.uid() and status = 'pending'
  ) then
    raise exception 'You already have a submission pending review.';
  end if;

  insert into public.submission_packages (student_id, supervisor_id, session_id)
  values (auth.uid(), v_supervisor_id, v_session_id)
  returning id into v_package_id;

  for v_topic in select * from jsonb_array_elements(p_topics)
  loop
    v_topic_number := v_topic_number + 1;
    insert into public.submission_topics (package_id, topic_number, title, description, keywords)
    values (
      v_package_id,
      v_topic_number,
      trim(both from (v_topic ->> 'title')),
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
