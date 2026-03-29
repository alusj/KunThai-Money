begin;

alter table public.kuntai_profiles
  add column if not exists middle_name text;

commit;
