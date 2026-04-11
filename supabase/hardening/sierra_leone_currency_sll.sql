update public.kuntai_accounts
set currency = 'SLL'
where upper(currency) = 'SLE';

update public.kuntai_other_accounts
set currency = 'SLL'
where upper(currency) = 'SLE';

update public.transactions
set currency = 'SLL'
where upper(currency) = 'SLE';

update public.kuntai_payment_intents
set currency = 'SLL'
where upper(currency) = 'SLE';
