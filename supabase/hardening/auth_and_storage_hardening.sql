-- KunTai auth/storage hardening
-- Apply this in Supabase SQL Editor after reviewing bucket names and RPC expectations.

begin;

create extension if not exists pgcrypto;

-- Keep KYC files private.
insert into storage.buckets (id, name, public)
values ('kyc', 'kyc', false)
on conflict (id) do update set public = excluded.public;

-- Avatars can remain public for simpler profile rendering.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- Remove broad legacy storage policies first if you created any manually.
drop policy if exists "kyc_objects_select_own" on storage.objects;
drop policy if exists "kyc_objects_insert_own" on storage.objects;
drop policy if exists "kyc_objects_update_own" on storage.objects;
drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;

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

create policy "avatars_select_public"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and owner = auth.uid()
);

create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner = auth.uid()
)
with check (
  bucket_id = 'avatars'
  and owner = auth.uid()
);

alter table public.kuntai_security
  add column if not exists failed_pin_attempts integer not null default 0,
  add column if not exists locked_until timestamptz,
  add column if not exists last_pin_change_at timestamptz default timezone('utc', now());

alter table public.kuntai_profiles
  add column if not exists last_login_at timestamptz,
  add column if not exists phone_verified_at timestamptz;

-- Optional server-controlled transaction posting.
-- Call this from Edge Functions / trusted server code, not directly from the client.
create or replace function public.post_account_transaction(
  p_account_id uuid,
  p_transaction_type text,
  p_direction text,
  p_amount numeric,
  p_currency text,
  p_description text default null,
  p_counterparty_name text default null,
  p_counterparty_account text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_account public.kuntai_accounts%rowtype;
  v_new_balance numeric(18,2);
  v_transaction public.transactions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_account
  from public.kuntai_accounts
  where id = p_account_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Account not found';
  end if;

  if p_direction = 'debit' then
    v_new_balance := v_account.balance - p_amount;
    if v_new_balance < 0 then
      raise exception 'Insufficient balance';
    end if;
  else
    v_new_balance := v_account.balance + p_amount;
  end if;

  update public.kuntai_accounts
  set balance = v_new_balance,
      updated_at = timezone('utc', now())
  where id = v_account.id;

  insert into public.transactions (
    user_id,
    account_id,
    transaction_type,
    direction,
    amount,
    currency,
    description,
    counterparty_name,
    counterparty_account,
    metadata
  )
  values (
    v_user_id,
    v_account.id,
    p_transaction_type,
    p_direction,
    p_amount,
    p_currency,
    p_description,
    p_counterparty_name,
    p_counterparty_account,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_transaction;

  return v_transaction;
end;
$$;

revoke all on function public.post_account_transaction(uuid, text, text, numeric, text, text, text, text, jsonb) from public;
grant execute on function public.post_account_transaction(uuid, text, text, numeric, text, text, text, text, jsonb) to authenticated;

create or replace function public.set_user_pin(
  p_pin text
)
returns public.kuntai_security
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.kuntai_security%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_pin is null or p_pin !~ '^\d{6}$' then
    raise exception 'PIN must be exactly 6 digits';
  end if;

  insert into public.kuntai_security (
    user_id,
    pin_hash,
    failed_pin_attempts,
    locked_until,
    last_pin_change_at
  )
  values (
    v_user_id,
    crypt(p_pin, gen_salt('bf', 12)),
    0,
    null,
    timezone('utc', now())
  )
  on conflict (user_id)
  do update set
    pin_hash = crypt(p_pin, gen_salt('bf', 12)),
    failed_pin_attempts = 0,
    locked_until = null,
    last_pin_change_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  returning * into v_existing;

  return v_existing;
end;
$$;

revoke all on function public.set_user_pin(text) from public;
grant execute on function public.set_user_pin(text) to authenticated;

commit;
