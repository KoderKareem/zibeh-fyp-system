-- ============================================================================
-- Support for citations on /repository/[id]. A citation needs an author,
-- but backfilled archival entries have student_id = null by design (no
-- student account exists for pre-system projects) — so there's currently
-- no way to record who actually wrote a backfilled project. Adds a plain
-- text fallback, used only when student_id is null.
-- ============================================================================

alter table public.repository_projects
  add column author_name text;
