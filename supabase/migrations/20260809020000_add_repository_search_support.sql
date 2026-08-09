-- ============================================================================
-- Support for the public /repository search page:
--   1. A private Storage bucket to hold uploaded project documents.
--   2. A narrow, safe public view of supervisor names — the repository's
--      "search by supervisor" filter needs to work for anonymous visitors,
--      but profiles' own RLS rightly blocks anon/unrelated users from
--      reading arbitrary profile rows (which also carry email etc.). This
--      view exposes only (id, full_name) for role='supervisor', nothing else.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', false)
on conflict (id) do nothing;

-- Runs as the view owner (not security-invoker), so it deliberately bypasses
-- profiles' RLS to expose this narrow, non-sensitive subset publicly.
create or replace view public.public_supervisor_directory as
select id, full_name
from public.profiles
where role = 'supervisor';

grant select on public.public_supervisor_directory to anon, authenticated;
