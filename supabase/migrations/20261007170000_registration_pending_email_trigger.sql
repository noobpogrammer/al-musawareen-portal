-- Secure server-side notification for new pending Al Musawareen registrations.
-- Enables pg_net + Vault, stores no plaintext secret in source control, and
-- notifies the operational email Edge Function only after a genuine pending
-- public.members row is inserted.

create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- The webhook secret value itself must be inserted into Vault in Supabase
-- after this migration is applied. This migration only references it by name.
--
-- Required Vault secret name:
--   registration_webhook_secret
--
-- Required Edge Function secret name:
--   REGISTRATION_WEBHOOK_SECRET
--
-- The values must match exactly.

create or replace function public.notify_pending_registration_email()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  webhook_secret text;
  function_url text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select decrypted_secret
    into webhook_secret
  from vault.decrypted_secrets
  where name = 'registration_webhook_secret'
  order by created_at desc
  limit 1;

  if webhook_secret is null or length(webhook_secret) = 0 then
    raise warning 'registration_webhook_secret is not configured in Vault; skipping pending registration email for member %', new.id;
    return new;
  end if;

  function_url := 'https://ceudhwrdplcumvojcrvp.supabase.co/functions/v1/send-operational-email';

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-registration-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object(
      'notificationType', 'registration_pending_admin',
      'memberId', new.id::text
    )
  );

  return new;
exception
  when others then
    -- Registration persistence must never fail because notification delivery failed.
    raise warning 'Pending registration notification enqueue failed for member %: %', new.id, sqlerrm;
    return new;
end;
$$;

revoke all on function public.notify_pending_registration_email() from public;
revoke all on function public.notify_pending_registration_email() from anon;
revoke all on function public.notify_pending_registration_email() from authenticated;

drop trigger if exists notify_pending_registration_email on public.members;

create trigger notify_pending_registration_email
after insert on public.members
for each row
when (new.status = 'pending')
execute function public.notify_pending_registration_email();
