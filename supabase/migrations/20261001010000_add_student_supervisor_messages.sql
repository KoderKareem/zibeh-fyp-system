-- ============================================================================
-- Private message threads between a student and their supervisor, for
-- project discussion outside formal topic/chapter decisions.
--
-- - One thread per (student, supervisor) pairing, not per chapter. Threads
--   are created automatically whenever a student is assigned a supervisor
--   (and backfilled below for pairings that already exist), so the app never
--   has to "start" a conversation.
-- - If a student's supervisor changes, the old thread is left untouched as
--   history and a new thread is created for the new pairing. Both
--   participants can still read an old thread; only the *current* pairing
--   can post (checked against profiles.supervisor_id at insert time).
--   Reassigning a student back to an earlier supervisor resumes that
--   pairing's original thread, since it's the same pairing.
-- - Private to the two participants. Unlike every other table, there is no
--   is_admin() clause in these policies: admins can't read threads or
--   message contents through the app.
-- - Messages are immutable: no update/delete policies.
-- - New messages are delivered live via Supabase Realtime (postgres_changes),
--   which applies the same select policy per subscriber.
-- ============================================================================

create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  supervisor_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, supervisor_id)
);

create index message_threads_supervisor_id_idx on public.message_threads (supervisor_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(both from body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index messages_thread_id_created_at_idx on public.messages (thread_id, created_at);

-- ----------------------------------------------------------------------------
-- Thread creation: on every supervisor assignment (admin's /admin/users
-- edit, admin-direct approval, or on_package_decision's auto-assignment).
-- security definer: the acting user can be a supervisor or admin, neither of
-- whom has (or needs) an insert policy on message_threads.
-- ----------------------------------------------------------------------------

create or replace function public.ensure_message_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.supervisor_id is not null
     and (tg_op = 'INSERT' or new.supervisor_id is distinct from old.supervisor_id) then
    insert into public.message_threads (student_id, supervisor_id)
    values (new.id, new.supervisor_id)
    on conflict (student_id, supervisor_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger profiles_ensure_message_thread
  after insert or update of supervisor_id on public.profiles
  for each row execute function public.ensure_message_thread();

insert into public.message_threads (student_id, supervisor_id)
select id, supervisor_id from public.profiles where supervisor_id is not null
on conflict (student_id, supervisor_id) do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

-- security definer so policies can check participation/currency without
-- re-entering message_threads' or profiles' own RLS.
create or replace function public.is_thread_participant(p_thread_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.message_threads
    where id = p_thread_id
      and (student_id = auth.uid() or supervisor_id = auth.uid())
  );
$$;

create or replace function public.is_current_thread(p_thread_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.message_threads t
    join public.profiles p on p.id = t.student_id
    where t.id = p_thread_id and p.supervisor_id = t.supervisor_id
  );
$$;

alter table public.message_threads enable row level security;
alter table public.messages enable row level security;

create policy threads_select_participants on public.message_threads
  for select using (student_id = auth.uid() or supervisor_id = auth.uid());
-- (no insert/update/delete policies: threads are only created by the trigger)

create policy messages_select_participants on public.messages
  for select using (public.is_thread_participant(thread_id));

create policy messages_insert_current_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_thread_participant(thread_id)
    and public.is_current_thread(thread_id)
  );
-- (no update/delete policies: messages are immutable)

-- ----------------------------------------------------------------------------
-- Participant names for my threads. A student can't read a *former*
-- supervisor's profile row (and vice versa) under profiles' RLS, but needs
-- their name to label history. Rather than widening profiles' policy (which
-- would expose email etc.), this returns only names, only for threads the
-- caller is part of.
-- ----------------------------------------------------------------------------

create or replace function public.my_message_threads()
returns table (
  id uuid,
  student_id uuid,
  student_name text,
  supervisor_id uuid,
  supervisor_name text,
  is_current boolean,
  created_at timestamptz,
  last_message_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id,
    t.student_id,
    s.full_name,
    t.supervisor_id,
    sup.full_name,
    coalesce(s.supervisor_id = t.supervisor_id, false),
    t.created_at,
    (select max(m.created_at) from public.messages m where m.thread_id = t.id)
  from public.message_threads t
  join public.profiles s on s.id = t.student_id
  join public.profiles sup on sup.id = t.supervisor_id
  where t.student_id = auth.uid() or t.supervisor_id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- Realtime: broadcast inserts on messages to subscribed participants.
-- ----------------------------------------------------------------------------

alter publication supabase_realtime add table public.messages;
