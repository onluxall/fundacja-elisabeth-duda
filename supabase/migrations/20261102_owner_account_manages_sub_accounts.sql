-- Main (owner) account: only owners can create, approve, revoke and delete other accounts.
alter table public.admins add column if not exists is_owner boolean not null default false;
update public.admins a set is_owner = true from auth.users u where u.id = a.user_id and lower(u.email) = 'kontakt@fundacja-ed.com';

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (select 1 from public.admins a join auth.users u on u.id = a.user_id
                 where a.user_id = auth.uid() and a.is_owner and (u.banned_until is null or u.banned_until < now()));
$$;

drop policy if exists "admin add admins" on public.admins;
drop policy if exists "admin remove admins" on public.admins;
create policy "owner add admins" on public.admins for insert to authenticated
  with check ((select public.is_owner()) and not is_owner);
create policy "owner remove admins" on public.admins for delete to authenticated
  using ((select public.is_owner()) and user_id <> (select auth.uid()) and not is_owner);

drop function if exists public.list_accounts();
create function public.list_accounts()
returns table(user_id uuid, email text, name text, is_admin boolean, is_owner boolean, created_at timestamptz)
language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.is_admin() then return; end if;
  return query
    select u.id, u.email::text, coalesce(a.name, (u.raw_user_meta_data->>'name')::text, ''),
           a.user_id is not null, coalesce(a.is_owner, false), u.created_at
    from auth.users u left join public.admins a on a.user_id = u.id order by u.created_at;
end $$;

-- Owner creates a ready-to-use sub-account (confirmed e-mail, panel access granted).
create or replace function public.create_account(p_email text, p_password text, p_name text default '')
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_id uuid := gen_random_uuid(); v_email text := lower(trim(p_email));
begin
  if not public.is_owner() then raise exception 'Tylko konto główne może dodawać konta.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Niepoprawny e-mail.'; end if;
  if length(coalesce(p_password, '')) < 10 then raise exception 'Hasło musi mieć co najmniej 10 znaków.'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then raise exception 'Konto z tym e-mailem już istnieje.'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name', coalesce(p_name, '')), now(), now(),
      '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text, 'email',
      jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true), null, now(), now());
  insert into public.admins (user_id, name) values (v_id, coalesce(p_name, ''));
  return v_id;
end $$;

-- Owner permanently deletes an account (not itself, not another owner).
create or replace function public.delete_account(p_user uuid)
returns boolean language plpgsql security definer set search_path to '' as $$
begin
  if not public.is_owner() then raise exception 'Tylko konto główne może usuwać konta.'; end if;
  if p_user = auth.uid() then raise exception 'Nie możesz usunąć własnego konta.'; end if;
  if exists (select 1 from public.admins where user_id = p_user and is_owner) then raise exception 'Nie można usunąć konta głównego.'; end if;
  delete from auth.users where id = p_user;
  return found;
end $$;

revoke all on function public.is_owner(), public.list_accounts(), public.create_account(text, text, text), public.delete_account(uuid) from public, anon;
grant execute on function public.is_owner(), public.list_accounts(), public.create_account(text, text, text), public.delete_account(uuid) to authenticated;
