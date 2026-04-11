begin;

create table if not exists public.kuntai_account_transfers (
  id uuid primary key default gen_random_uuid(),
  reference_number text unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_account_id uuid not null references public.kuntai_accounts(id) on delete cascade,
  source_account_number text not null,
  source_account_type text not null default 'main',
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_account_id uuid references public.kuntai_accounts(id) on delete set null,
  recipient_name text not null,
  recipient_account_number text not null,
  amount numeric(18,2) not null,
  transaction_fee numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null,
  currency text not null,
  reason text,
  status text not null default 'completed',
  failure_reason text,
  sender_transaction_id uuid references public.transactions(id) on delete set null,
  recipient_transaction_id uuid references public.transactions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  constraint kuntai_account_transfers_status_check
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  constraint kuntai_account_transfers_amount_check
    check (
      amount > 0
      and transaction_fee >= 0
      and tax_amount >= 0
      and total_amount >= amount
    )
);

create index if not exists kuntai_account_transfers_user_created_at_idx
  on public.kuntai_account_transfers (user_id, created_at desc);

create index if not exists kuntai_account_transfers_source_account_idx
  on public.kuntai_account_transfers (source_account_id, created_at desc);

create index if not exists kuntai_account_transfers_recipient_account_idx
  on public.kuntai_account_transfers (recipient_account_id, created_at desc);

create index if not exists kuntai_account_transfers_recipient_account_number_idx
  on public.kuntai_account_transfers (recipient_account_number, created_at desc);

alter table public.kuntai_account_transfers enable row level security;

drop policy if exists "kuntai_account_transfers_select_own" on public.kuntai_account_transfers;

create policy "kuntai_account_transfers_select_own"
on public.kuntai_account_transfers
for select
to authenticated
using (
  user_id = auth.uid()
  or recipient_user_id = auth.uid()
);

drop function if exists public.get_account_transfer_recipient(uuid, text);

create or replace function public.generate_transfer_reference()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference text;
begin
  loop
    v_reference := 'KTM-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    exit when not exists (
      select 1
      from public.kuntai_account_transfers
      where reference_number = v_reference
    );
  end loop;

  return v_reference;
end;
$$;

revoke all on function public.generate_transfer_reference() from public;
grant execute on function public.generate_transfer_reference() to authenticated;

create or replace function public.resolve_transfer_recipient_name(
  p_user_id uuid,
  p_account_number text
)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    nullif(trim(concat_ws(' ', kp.first_name, kp.middle_name, kp.last_name)), ''),
    kp.phone,
    p_account_number
  )
  from public.kuntai_profiles kp
  where kp.user_id = p_user_id
  limit 1;
$$;

create or replace function public.get_account_transfer_recipient(
  p_source_account_id uuid,
  p_recipient_account_number text
)
returns table (
  is_valid boolean,
  recipient_name text,
  recipient_profile_image text,
  recipient_account_id uuid,
  recipient_user_id uuid,
  currency text,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_source_account public.kuntai_accounts%rowtype;
  v_recipient_account public.kuntai_accounts%rowtype;
  v_profile_image text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_source_account_id is null then
    raise exception 'Source account is required';
  end if;

  select *
  into v_source_account
  from public.kuntai_accounts
  where id = p_source_account_id
    and user_id = v_user_id
    and account_type = 'main'
  limit 1;

  if not found then
    raise exception 'Source account not found';
  end if;

  if nullif(trim(coalesce(p_recipient_account_number, '')), '') is null then
    return query
    select false, null::text, null::text, null::uuid, null::uuid, null::text, 'Enter an account number.';
    return;
  end if;

  select *
  into v_recipient_account
  from public.kuntai_accounts
  where account_number = trim(p_recipient_account_number)
    and account_type = 'main'
  limit 1;

  if not found then
    return query
    select false, null::text, null::text, null::uuid, null::uuid, null::text, 'Account number not found.';
    return;
  end if;

  if coalesce(v_recipient_account.status, 'active') <> 'active' then
    return query
    select false, null::text, null::text, null::uuid, null::uuid, null::text, 'Recipient account is not active.';
    return;
  end if;

  if v_recipient_account.id = v_source_account.id then
    return query
    select false, null::text, null::text, null::uuid, null::uuid, null::text, 'You cannot transfer to your own account.';
    return;
  end if;

  if upper(coalesce(v_source_account.currency, '')) <> upper(coalesce(v_recipient_account.currency, '')) then
    return query
    select false, null::text, null::text, null::uuid, null::uuid, null::text, 'Recipient wallet uses a different currency.';
    return;
  end if;

  select kp.profile_image
  into v_profile_image
  from public.kuntai_profiles kp
  where kp.user_id = v_recipient_account.user_id
  limit 1;

  return query
  select
    true,
    public.resolve_transfer_recipient_name(v_recipient_account.user_id, v_recipient_account.account_number),
    v_profile_image,
    v_recipient_account.id,
    v_recipient_account.user_id,
    upper(v_recipient_account.currency),
    'Recipient account verified.';
end;
$$;

revoke all on function public.get_account_transfer_recipient(uuid, text) from public;
grant execute on function public.get_account_transfer_recipient(uuid, text) to authenticated;

create or replace function public.create_account_transfer(
  p_source_account_id uuid,
  p_recipient_account_number text,
  p_amount numeric,
  p_reason text default null,
  p_pin text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.kuntai_account_transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_source_account public.kuntai_accounts%rowtype;
  v_recipient_account public.kuntai_accounts%rowtype;
  v_transfer public.kuntai_account_transfers%rowtype;
  v_sender_transaction public.transactions%rowtype;
  v_recipient_transaction public.transactions%rowtype;
  v_security public.kuntai_security%rowtype;
  v_amount numeric(18,2) := round(coalesce(p_amount, 0)::numeric, 2);
  v_transaction_fee numeric(18,2) := 0;
  v_tax_amount numeric(18,2) := 0;
  v_total_amount numeric(18,2);
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_completed_at timestamptz := timezone('utc', now());
  v_recipient_name text;
  v_reference_number text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_source_account_id is null then
    raise exception 'Source account is required';
  end if;

  if nullif(trim(coalesce(p_recipient_account_number, '')), '') is null then
    raise exception 'Recipient account number is required';
  end if;

  if p_pin is null or p_pin !~ '^\d{6}$' then
    raise exception 'Transaction PIN must be exactly 6 digits';
  end if;

  if v_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero';
  end if;

  select *
  into v_security
  from public.kuntai_security
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'Transaction PIN has not been set up';
  end if;

  if v_security.locked_until is not null and v_security.locked_until > timezone('utc', now()) then
    raise exception 'Transaction PIN is temporarily locked. Try again later.';
  end if;

  if v_security.pin_hash is null or crypt(p_pin, v_security.pin_hash) <> v_security.pin_hash then
    update public.kuntai_security
    set failed_pin_attempts = coalesce(failed_pin_attempts, 0) + 1,
        locked_until = case
          when coalesce(failed_pin_attempts, 0) + 1 >= 5 then timezone('utc', now()) + interval '15 minutes'
          else locked_until
        end,
        updated_at = timezone('utc', now())
    where user_id = v_user_id;

    raise exception 'Incorrect transaction PIN';
  end if;

  update public.kuntai_security
  set failed_pin_attempts = 0,
      locked_until = null,
      updated_at = timezone('utc', now())
  where user_id = v_user_id;

  select *
  into v_source_account
  from public.kuntai_accounts
  where id = p_source_account_id
    and user_id = v_user_id
    and account_type = 'main'
  for update;

  if not found then
    raise exception 'Source account not found';
  end if;

  if coalesce(v_source_account.status, 'active') <> 'active' then
    raise exception 'Source account is not active';
  end if;

  select *
  into v_recipient_account
  from public.kuntai_accounts
  where account_number = trim(p_recipient_account_number)
    and account_type = 'main'
  for update;

  if not found then
    raise exception 'Recipient account not found';
  end if;

  if coalesce(v_recipient_account.status, 'active') <> 'active' then
    raise exception 'Recipient account is not active';
  end if;

  if v_recipient_account.id = v_source_account.id then
    raise exception 'You cannot transfer to the same account';
  end if;

  if upper(coalesce(v_source_account.currency, '')) <> upper(coalesce(v_recipient_account.currency, '')) then
    raise exception 'Recipient account currency does not match your wallet currency';
  end if;

  v_total_amount := round((v_amount + v_transaction_fee + v_tax_amount)::numeric, 2);

  if coalesce(v_source_account.balance, 0) < v_total_amount then
    raise exception 'Insufficient balance';
  end if;

  v_recipient_name := public.resolve_transfer_recipient_name(
    v_recipient_account.user_id,
    v_recipient_account.account_number
  );
  v_reference_number := public.generate_transfer_reference();

  insert into public.kuntai_account_transfers (
    reference_number,
    user_id,
    source_account_id,
    source_account_number,
    source_account_type,
    recipient_user_id,
    recipient_account_id,
    recipient_name,
    recipient_account_number,
    amount,
    transaction_fee,
    tax_amount,
    total_amount,
    currency,
    reason,
    status,
    metadata,
    completed_at
  )
  values (
    v_reference_number,
    v_user_id,
    v_source_account.id,
    v_source_account.account_number,
    v_source_account.account_type,
    v_recipient_account.user_id,
    v_recipient_account.id,
    v_recipient_name,
    trim(p_recipient_account_number),
    v_amount,
    v_transaction_fee,
    v_tax_amount,
    v_total_amount,
    upper(v_source_account.currency),
    v_reason,
    'processing',
    coalesce(p_metadata, '{}'::jsonb),
    null
  )
  returning * into v_transfer;

  update public.kuntai_accounts
  set balance = balance - v_total_amount,
      updated_at = timezone('utc', now())
  where id = v_source_account.id;

  update public.kuntai_accounts
  set balance = balance + v_amount,
      updated_at = timezone('utc', now())
  where id = v_recipient_account.id;

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
    v_source_account.id,
    'account_transfer',
    'debit',
    v_total_amount,
    upper(v_source_account.currency),
    case
      when v_reason is not null then 'Transfer to ' || v_recipient_name || ' - ' || v_reason
      else 'Transfer to ' || v_recipient_name
    end,
    v_recipient_name,
    trim(p_recipient_account_number),
    jsonb_build_object(
      'transfer_id', v_transfer.id,
      'reference_number', v_reference_number,
      'principal_amount', v_amount,
      'transaction_fee', v_transaction_fee,
      'tax_amount', v_tax_amount
    ) || coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_sender_transaction;

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
    v_recipient_account.user_id,
    v_recipient_account.id,
    'account_transfer',
    'credit',
    v_amount,
    upper(v_recipient_account.currency),
    case
      when v_reason is not null then 'Transfer from ' || v_source_account.account_number || ' - ' || v_reason
      else 'Transfer from ' || v_source_account.account_number
    end,
    v_source_account.account_number,
    v_source_account.account_number,
    jsonb_build_object(
      'transfer_id', v_transfer.id,
      'reference_number', v_reference_number,
      'sender_account_id', v_source_account.id,
      'sender_account_number', v_source_account.account_number
    ) || coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_recipient_transaction;

  update public.kuntai_account_transfers
  set status = 'completed',
      sender_transaction_id = v_sender_transaction.id,
      recipient_transaction_id = v_recipient_transaction.id,
      updated_at = v_completed_at,
      completed_at = v_completed_at
  where id = v_transfer.id
  returning * into v_transfer;

  return v_transfer;
exception
  when others then
    if v_transfer.id is not null then
      update public.kuntai_account_transfers
      set status = 'failed',
          failure_reason = sqlerrm,
          updated_at = timezone('utc', now())
      where id = v_transfer.id;
    end if;
    raise;
end;
$$;

revoke all on function public.create_account_transfer(uuid, text, numeric, text, text, jsonb) from public;
grant execute on function public.create_account_transfer(uuid, text, numeric, text, text, jsonb) to authenticated;

commit;
