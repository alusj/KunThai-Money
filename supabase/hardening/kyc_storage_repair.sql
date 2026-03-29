-- KYC storage repair for environments where Verify Identity fails with:
-- "Bucket not found" or "front_id_url violates not-null constraint"
--
-- Run this in the Supabase SQL Editor for the target project.

begin;

insert into storage.buckets (id, name, public)
values ('kyc', 'kyc', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "kyc_objects_select_own" on storage.objects;
drop policy if exists "kyc_objects_insert_own" on storage.objects;
drop policy if exists "kyc_objects_update_own" on storage.objects;

create policy "kyc_objects_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kyc'
  and owner = auth.uid()
);

create policy "kyc_objects_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'kyc'
  and owner = auth.uid()
);

create policy "kyc_objects_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'kyc'
  and owner = auth.uid()
)
with check (
  bucket_id = 'kyc'
  and owner = auth.uid()
);

commit;
