-- ============================================================================
-- Zibeh FYP Repository & Approval System — initial schema
-- Entities: departments, academic_sessions, profiles, submission_packages,
-- submission_topics, repository_projects, notifications, audit_logs,
-- system_settings.
-- Row Level Security is enabled on every table (see policies at the bottom).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Reference tables
-- ----------------------------------------------------------------------------

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  created_at timestamptz not null default now()
);

create table public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique, -- e.g. "2025/2026"
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- People
-- profiles extends auth.users 1:1 (auth.users holds login credentials;
-- profiles holds everything app-specific, including role).
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'supervisor', 'admin')),
  department_id uuid references public.departments (id) on delete set null,
  supervisor_id uuid references public.profiles (id) on delete set null, -- set for students only
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index profiles_supervisor_id_idx on public.profiles (supervisor_id);
create index profiles_department_id_idx on public.profiles (department_id);
create index profiles_role_idx on public.profiles (role);

-- ----------------------------------------------------------------------------
-- Submissions: a "package" is the batch of 3 topics a student submits together.
-- ----------------------------------------------------------------------------

create table public.submission_packages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  supervisor_id uuid not null references public.profiles (id) on delete restrict,
  session_id uuid not null references public.academic_sessions (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_topic_id uuid, -- FK added below, once submission_topics exists
  supervisor_comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint packages_comment_required_on_decision check (
    status = 'pending' or supervisor_comment is not null
  ),
  constraint packages_approved_topic_matches_status check (
    (status = 'approved' and approved_topic_id is not null)
    or (status <> 'approved' and approved_topic_id is null)
  )
);

create index submission_packages_student_id_idx on public.submission_packages (student_id);
create index submission_packages_supervisor_id_idx on public.submission_packages (supervisor_id);
create index submission_packages_session_id_idx on public.submission_packages (session_id);

create table public.submission_topics (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.submission_packages (id) on delete cascade,
  topic_number smallint not null check (topic_number between 1 and 3),
  title text not null,
  description text,
  keywords text[] not null default '{}',
  unique (package_id, topic_number)
);

create index submission_topics_package_id_idx on public.submission_topics (package_id);

alter table public.submission_packages
  add constraint submission_packages_approved_topic_id_fkey
  foreign key (approved_topic_id) references public.submission_topics (id) on delete set null;

-- Guards against approved_topic_id ever pointing at a topic from a different package.
create or replace function public.check_approved_topic_belongs_to_package()
returns trigger
language plpgsql
as $$
begin
  if new.approved_topic_id is not null and not exists (
    select 1 from public.submission_topics
    where id = new.approved_topic_id and package_id = new.id
  ) then
    raise exception 'approved_topic_id must belong to the same submission package';
  end if;
  return new;
end;
$$;

create trigger submission_packages_check_approved_topic
  before insert or update on public.submission_packages
  for each row execute function public.check_approved_topic_belongs_to_package();

-- ----------------------------------------------------------------------------
-- Repository: searchable list of approved / archived projects.
-- ----------------------------------------------------------------------------

create table public.repository_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  abstract text,
  keywords text[] not null default '{}',
  department_id uuid references public.departments (id) on delete set null,
  session_id uuid references public.academic_sessions (id) on delete set null,
  supervisor_id uuid references public.profiles (id) on delete set null,
  student_id uuid references public.profiles (id) on delete set null, -- null for backfilled archival entries
  submission_package_id uuid references public.submission_packages (id) on delete set null,
  document_path text, -- Supabase Storage object path
  source_code_path text,
  access_level text not null default 'restricted' check (access_level in ('public', 'restricted')),
  added_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index repository_projects_department_id_idx on public.repository_projects (department_id);
create index repository_projects_session_id_idx on public.repository_projects (session_id);
create index repository_projects_supervisor_id_idx on public.repository_projects (supervisor_id);

-- ----------------------------------------------------------------------------
-- Notifications & audit trail
-- ----------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_logs_actor_id_idx on public.audit_logs (actor_id);

-- System-generated notification + audit entry whenever a supervisor decides a package.
-- security definer: runs as the table owner, so it can write into notifications/audit_logs
-- for the *student*, even though the row is being updated by the *supervisor*.
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
  end if;
  return new;
end;
$$;

create trigger submission_packages_on_decision
  after update on public.submission_packages
  for each row execute function public.on_package_decision();

-- ----------------------------------------------------------------------------
-- Settings (single row)
-- ----------------------------------------------------------------------------

create table public.system_settings (
  id smallint primary key default 1 check (id = 1),
  active_session_id uuid references public.academic_sessions (id),
  submissions_open boolean not null default true,
  submission_deadline timestamptz,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Auth hooks: create a profile row whenever someone signs up, and keep
-- profiles.email in sync if they ever change their login email.
--
-- IMPORTANT: role is only ever set to 'student' or 'supervisor' here, never
-- 'admin' — self-registration can never grant admin access. Admin accounts
-- are promoted manually (see supabase/promote_to_admin.sql).
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_user_meta_data ->> 'role' = 'supervisor' then 'supervisor'
      else 'student'
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Helper functions. security definer + owned by the table owner (postgres)
-- means these can read `profiles` internally without triggering profiles'
-- own RLS policies again — this is what avoids infinite recursion.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.current_role_name()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_supervisor_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select supervisor_id from public.profiles where id = auth.uid();
$$;

alter table public.departments enable row level security;
alter table public.academic_sessions enable row level security;
alter table public.profiles enable row level security;
alter table public.submission_packages enable row level security;
alter table public.submission_topics enable row level security;
alter table public.repository_projects enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

-- departments — readable by anyone (public repository filters need it),
-- writable by admins only.
create policy departments_select_all on public.departments
  for select using (true);
create policy departments_admin_write on public.departments
  for all using (public.is_admin()) with check (public.is_admin());

-- academic_sessions — same pattern as departments.
create policy sessions_select_all on public.academic_sessions
  for select using (true);
create policy sessions_admin_write on public.academic_sessions
  for all using (public.is_admin()) with check (public.is_admin());

-- profiles — you can see your own row, your admin can see everyone,
-- a supervisor can see their assigned students, and a student can see
-- their own assigned supervisor's basic info.
create policy profiles_select_own_or_related on public.profiles
  for select using (
    id = auth.uid()
    or public.is_admin()
    or supervisor_id = auth.uid()
    or id = public.my_supervisor_id()
  );
create policy profiles_update_own_or_admin on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy profiles_admin_delete on public.profiles
  for delete using (public.is_admin());
-- (no insert policy: rows are only ever created by the handle_new_user trigger)

-- submission_packages — a student sees only their own packages, a supervisor
-- sees only packages assigned to them, admins see everything.
create policy packages_select_own on public.submission_packages
  for select using (
    student_id = auth.uid() or supervisor_id = auth.uid() or public.is_admin()
  );
create policy packages_insert_own_student on public.submission_packages
  for insert with check (
    student_id = auth.uid() and public.current_role_name() = 'student'
  );
create policy packages_update_supervisor_or_admin on public.submission_packages
  for update using (supervisor_id = auth.uid() or public.is_admin())
  with check (supervisor_id = auth.uid() or public.is_admin());
create policy packages_admin_delete on public.submission_packages
  for delete using (public.is_admin());

-- submission_topics — inherits visibility from the parent package.
create policy topics_select_via_package on public.submission_topics
  for select using (
    exists (
      select 1 from public.submission_packages p
      where p.id = package_id
        and (p.student_id = auth.uid() or p.supervisor_id = auth.uid() or public.is_admin())
    )
  );
create policy topics_insert_via_own_package on public.submission_topics
  for insert with check (
    exists (
      select 1 from public.submission_packages p
      where p.id = package_id and p.student_id = auth.uid()
    )
  );
create policy topics_admin_write on public.submission_topics
  for update using (public.is_admin()) with check (public.is_admin());
create policy topics_admin_delete on public.submission_topics
  for delete using (public.is_admin());

-- repository_projects — publicly browsable (this is the differentiator
-- feature), curated by admins only.
create policy repository_select_all on public.repository_projects
  for select using (true);
create policy repository_admin_write on public.repository_projects
  for all using (public.is_admin()) with check (public.is_admin());

-- notifications — you only ever see and manage your own.
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy notifications_delete_own on public.notifications
  for delete using (user_id = auth.uid() or public.is_admin());
create policy notifications_admin_insert on public.notifications
  for insert with check (public.is_admin());

-- audit_logs — append-only. Admins can read; anyone can log their own
-- action; nobody can edit or delete an entry once written.
create policy audit_select_admin on public.audit_logs
  for select using (public.is_admin());
create policy audit_insert_own on public.audit_logs
  for insert with check (actor_id = auth.uid() or public.is_admin());

-- system_settings — any logged-in user can read (e.g. "is submission open?"),
-- only admins can change it.
create policy settings_select_authenticated on public.system_settings
  for select using (auth.role() = 'authenticated');
create policy settings_admin_write on public.system_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Seed data — a starting academic session so the app is usable immediately.
-- ============================================================================

insert into public.academic_sessions (label, is_active)
values ('2025/2026', true);

insert into public.system_settings (id, active_session_id, submissions_open)
select 1, id, true from public.academic_sessions where label = '2025/2026';
