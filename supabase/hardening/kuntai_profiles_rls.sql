begin;

alter table public.kuntai_profiles enable row level security;

drop policy if exists "kuntai_profiles_select_own" on public.kuntai_profiles;
drop policy if exists "kuntai_profiles_insert_own" on public.kuntai_profiles;
drop policy if exists "kuntai_profiles_update_own" on public.kuntai_profiles;

create policy "kuntai_profiles_select_own"
on public.kuntai_profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "kuntai_profiles_insert_own"
on public.kuntai_profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "kuntai_profiles_update_own"
on public.kuntai_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

commit;
