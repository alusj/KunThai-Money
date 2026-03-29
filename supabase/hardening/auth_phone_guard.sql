begin;

create or replace function public.get_phone_auth_status(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_normalized_phone text := nullif(trim(p_phone), '');
  v_exists_in_auth boolean := false;
  v_exists_in_accounts boolean := false;
  v_exists_in_profiles boolean := false;
begin
  if v_normalized_phone is null then
    return jsonb_build_object(
      'phone', p_phone,
      'is_registered', false,
      'exists_in_auth', false,
      'exists_in_accounts', false,
      'exists_in_profiles', false
    );
  end if;

  select exists(
    select 1
    from auth.users
    where phone = v_normalized_phone
  )
  into v_exists_in_auth;

  select exists(
    select 1
    from public.kuntai_accounts
    where phone = v_normalized_phone
  )
  into v_exists_in_accounts;

  select exists(
    select 1
    from public.kuntai_profiles
    where phone = v_normalized_phone
  )
  into v_exists_in_profiles;

  return jsonb_build_object(
    'phone', v_normalized_phone,
    'is_registered', (v_exists_in_auth or v_exists_in_accounts or v_exists_in_profiles),
    'exists_in_auth', v_exists_in_auth,
    'exists_in_accounts', v_exists_in_accounts,
    'exists_in_profiles', v_exists_in_profiles
  );
end;
$$;

revoke all on function public.get_phone_auth_status(text) from public;
grant execute on function public.get_phone_auth_status(text) to anon, authenticated;

commit;
