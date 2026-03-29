begin;

create index if not exists transactions_user_created_at_idx
  on public.transactions (user_id, created_at desc);

create index if not exists transactions_user_direction_created_at_idx
  on public.transactions (user_id, direction, created_at desc);

commit;
