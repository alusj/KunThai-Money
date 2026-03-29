begin;

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

commit;
