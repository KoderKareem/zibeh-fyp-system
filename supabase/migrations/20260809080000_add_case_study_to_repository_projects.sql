-- ============================================================================
-- Same Case Study field as submission_topics (see
-- 20260809070000_add_case_study_to_submission_topics.sql), now for
-- repository_projects so admin-backfilled archival entries can record it too.
-- ============================================================================

alter table public.repository_projects add column case_study text;
