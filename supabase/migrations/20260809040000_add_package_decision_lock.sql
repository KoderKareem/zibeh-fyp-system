-- ============================================================================
-- Support for /supervisor/dashboard and /supervisor/review/[id].
--
-- Everything else needed for the decision itself already existed in the
-- initial schema: RLS lets a supervisor update their own packages, and
-- constraints/triggers already enforce "comment required on decision",
-- "approved_topic_id set iff approved", and "approved topic must belong to
-- this package". The one missing piece: nothing stopped a decision from
-- being changed again after the fact, which "lock in the chosen topic"
-- implies shouldn't be possible — once a package is approved or rejected,
-- it's final; a rejected student submits a brand-new package instead.
-- ============================================================================

create or replace function public.prevent_redeciding_package()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'pending' and new.status is distinct from old.status then
    raise exception 'This package has already been decided and cannot be changed again.';
  end if;
  return new;
end;
$$;

create trigger submission_packages_prevent_redecision
  before update on public.submission_packages
  for each row execute function public.prevent_redeciding_package();
