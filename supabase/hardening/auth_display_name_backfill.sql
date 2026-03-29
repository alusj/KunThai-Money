-- Backfill auth user metadata from public.kuntai_profiles
-- Use this for existing phone-auth users whose "Displayed name" is empty in Supabase Auth Users.

begin;

update auth.users as au
set raw_user_meta_data = coalesce(au.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'name',
    trim(concat_ws(' ', kp.first_name, kp.middle_name, kp.last_name)),
    'full_name',
    trim(concat_ws(' ', kp.first_name, kp.middle_name, kp.last_name)),
    'display_name',
    trim(concat_ws(' ', kp.first_name, kp.middle_name, kp.last_name)),
    'first_name',
    kp.first_name,
    'middle_name',
    kp.middle_name,
    'last_name',
    kp.last_name
  )
from public.kuntai_profiles as kp
where kp.user_id = au.id
  and trim(concat_ws(' ', kp.first_name, kp.middle_name, kp.last_name)) <> '';

commit;
