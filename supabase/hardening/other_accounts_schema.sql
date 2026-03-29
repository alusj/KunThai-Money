begin;

alter table public.kuntai_accounts
  add column if not exists account_type text not null default 'main',
  add column if not exists is_primary boolean not null default true,
  add column if not exists is_system_created boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'kuntai_accounts_account_type_check'
  ) then
    alter table public.kuntai_accounts
      add constraint kuntai_accounts_account_type_check
      check (account_type in ('main'));
  end if;
end $$;

create unique index if not exists kuntai_accounts_one_main_per_user_idx
  on public.kuntai_accounts (user_id, account_type);

create table if not exists public.kuntai_other_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  linked_main_account_id uuid not null references public.kuntai_accounts(id) on delete cascade,
  account_type text not null,
  account_name text not null,
  account_number text not null unique,
  country_code text not null,
  country text not null,
  currency text not null,
  status text not null default 'active',
  location_mode text not null default 'manual',
  use_current_location boolean not null default false,
  location_country text,
  location_city text,
  location_address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  nearby_discovery_enabled boolean not null default false,
  is_system_created boolean not null default false,
  created_from text not null default 'wallet_app',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint kuntai_other_accounts_type_check
    check (
      account_type in (
        'business',
        'transport',
        'merchant',
        'airtime',
        'electricity',
        'government',
        'hotel',
        'insurance',
        'internet',
        'pharmacy',
        'restaurant',
        'school_fees',
        'supermarket',
        'tickets',
        'tv_subscription',
        'donation',
        'foreign'
      )
    ),
  constraint kuntai_other_accounts_location_mode_check
    check (location_mode in ('manual', 'device')),
  constraint kuntai_other_accounts_foreign_currency_check
    check (
      (account_type = 'foreign' and currency = 'USD')
      or (account_type <> 'foreign')
    ),
  constraint kuntai_other_accounts_auto_created_check
    check (
      (account_type in ('business', 'transport') and is_system_created = true)
      or (account_type not in ('business', 'transport'))
    )
);

create unique index if not exists kuntai_other_accounts_user_account_type_idx
  on public.kuntai_other_accounts (user_id, account_type);

create index if not exists kuntai_other_accounts_user_created_at_idx
  on public.kuntai_other_accounts (user_id, created_at desc);

create index if not exists kuntai_other_accounts_location_idx
  on public.kuntai_other_accounts (location_country, location_city);

alter table public.kuntai_other_accounts enable row level security;

drop policy if exists "kuntai_other_accounts_select_own" on public.kuntai_other_accounts;
drop policy if exists "kuntai_other_accounts_insert_own" on public.kuntai_other_accounts;
drop policy if exists "kuntai_other_accounts_update_own" on public.kuntai_other_accounts;

create policy "kuntai_other_accounts_select_own"
on public.kuntai_other_accounts
for select
to authenticated
using (user_id = auth.uid());

create policy "kuntai_other_accounts_insert_own"
on public.kuntai_other_accounts
for insert
to authenticated
with check (
  user_id = auth.uid()
  and account_type not in ('business', 'transport')
);

create policy "kuntai_other_accounts_update_own"
on public.kuntai_other_accounts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.generate_other_account_number(
  p_country_code text,
  p_account_type text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_clean_country_code text := regexp_replace(coalesce(p_country_code, ''), '\+', '', 'g');
  v_next_sequence bigint;
  v_sequence_length integer;
  v_is_foreign boolean := p_account_type = 'foreign';
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_account_type is null or p_account_type = '' then
    raise exception 'Account type is required';
  end if;

  if p_account_type = 'main' then
    raise exception 'Use the main account generator for main accounts';
  end if;

  if p_account_type not in (
    'business',
    'transport',
    'merchant',
    'airtime',
    'electricity',
    'government',
    'hotel',
    'insurance',
    'internet',
    'pharmacy',
    'restaurant',
    'school_fees',
    'supermarket',
    'tickets',
    'tv_subscription',
    'donation',
    'foreign'
  ) then
    raise exception 'Unsupported account type';
  end if;

  v_sequence_length := case when v_is_foreign then 9 else 8 end;

  select coalesce(max(right(account_number, v_sequence_length)::bigint), 0) + 1
  into v_next_sequence
  from public.kuntai_other_accounts
  where country_code = p_country_code
    and (
      (v_is_foreign and account_type = 'foreign')
      or
      ((not v_is_foreign) and account_type <> 'foreign')
    );

  return v_clean_country_code || lpad(v_next_sequence::text, v_sequence_length, '0');
end;
$$;

revoke all on function public.generate_other_account_number(text, text) from public;
grant execute on function public.generate_other_account_number(text, text) to authenticated;

create or replace function public.create_other_account(
  p_account_type text,
  p_account_name text,
  p_location_mode text default 'manual',
  p_use_current_location boolean default false,
  p_location_country text default null,
  p_location_city text default null,
  p_location_address text default null,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_nearby_discovery_enabled boolean default false
)
returns public.kuntai_other_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_main_account public.kuntai_accounts%rowtype;
  v_account_number text;
  v_currency text;
  v_inserted public.kuntai_other_accounts%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_account_type in ('business', 'transport') then
    raise exception 'This account type is created automatically by the registration system';
  end if;

  if p_account_type not in (
    'merchant',
    'airtime',
    'electricity',
    'government',
    'hotel',
    'insurance',
    'internet',
    'pharmacy',
    'restaurant',
    'school_fees',
    'supermarket',
    'tickets',
    'tv_subscription',
    'donation',
    'foreign'
  ) then
    raise exception 'Unsupported account type';
  end if;

  if exists (
    select 1 from public.kuntai_other_accounts
    where user_id = v_user_id
      and account_type = p_account_type
  ) then
    raise exception 'An account of this type already exists';
  end if;

  select *
  into v_main_account
  from public.kuntai_accounts
  where user_id = v_user_id
    and account_type = 'main'
  limit 1;

  if not found then
    raise exception 'Main account not found';
  end if;

  v_currency := case
    when p_account_type = 'foreign' then 'USD'
    else v_main_account.currency
  end;

  v_account_number := public.generate_other_account_number(v_main_account.country_code, p_account_type);

  insert into public.kuntai_other_accounts (
    user_id,
    linked_main_account_id,
    account_type,
    account_name,
    account_number,
    country_code,
    country,
    currency,
    location_mode,
    use_current_location,
    location_country,
    location_city,
    location_address,
    latitude,
    longitude,
    nearby_discovery_enabled,
    is_system_created,
    created_from
  )
  values (
    v_user_id,
    v_main_account.id,
    p_account_type,
    p_account_name,
    v_account_number,
    v_main_account.country_code,
    v_main_account.country,
    v_currency,
    coalesce(p_location_mode, 'manual'),
    coalesce(p_use_current_location, false),
    p_location_country,
    p_location_city,
    p_location_address,
    p_latitude,
    p_longitude,
    coalesce(p_nearby_discovery_enabled, false),
    false,
    'wallet_app'
  )
  returning * into v_inserted;

  return v_inserted;
end;
$$;

revoke all on function public.create_other_account(text, text, text, boolean, text, text, text, numeric, numeric, boolean) from public;
grant execute on function public.create_other_account(text, text, text, boolean, text, text, text, numeric, numeric, boolean) to authenticated;

commit;
