-- ============================================================================
-- Match the institution's real topic-proposal format: Title, Case Study,
-- Abstract (the "description" column is kept as-is and just relabeled to
-- "Abstract" in the UI). Case Study is the organization/institution the
-- project focuses on, e.g. "Zibeh Institute of Technology, Jos".
--
-- Nullable at the column level (existing rows predate this field) — it's
-- enforced as required by the submit_submission_package RPC below and by
-- the submission form, not by a NOT NULL constraint.
-- ============================================================================

alter table public.submission_topics add column case_study text;

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
