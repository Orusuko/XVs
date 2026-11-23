-- Cuentas del organizador. El navegador no lee esta tabla.
-- El panel usa el service role en el servidor, después de validar la cookie.

create table if not exists public.cuentas (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.cuentas enable row level security;
alter table public.cuentas force row level security;

revoke all on table public.cuentas from public, anon, authenticated;
grant select, insert, update, delete on table public.cuentas to service_role;

-- Mismo id que auth.users cuando el hash ya es bcrypt, para no soltar events.admin_id.
-- shortcut: si el hash no es bcrypt, esa fila no se copia y la FK queda sin validar. No se borra el evento.
insert into public.cuentas (id, email, password_hash, created_at)
select u.id,
       lower(u.email),
       u.encrypted_password,
       coalesce(u.created_at, now())
from auth.users u
where u.email is not null
  and (
    u.encrypted_password like '$2a$%'
    or u.encrypted_password like '$2b$%'
    or u.encrypted_password like '$2y$%'
  )
  and not exists (
    select 1
    from public.cuentas c
    where c.id = u.id or c.email = lower(u.email)
  );

-- events.admin_id apuntaba a auth.users.
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any (c.conkey)
    where c.conrelid = 'public.events'::regclass
      and c.contype = 'f'
      and a.attname = 'admin_id'
  loop
    execute format('alter table public.events drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.events
  add constraint events_admin_id_fkey
  foreign key (admin_id) references public.cuentas (id)
  not valid;

do $$
begin
  if not exists (
    select 1
    from public.events e
    where not exists (select 1 from public.cuentas c where c.id = e.admin_id)
  ) then
    alter table public.events validate constraint events_admin_id_fkey;
  end if;
end $$;

-- Sin sesión de Supabase Auth, anon y authenticated no deben tocar estas tablas.
-- Invitación, QR y check-in siguen por el service role, que ignora RLS.
drop policy if exists "events_select_own" on events;
drop policy if exists "events_insert_own" on events;
drop policy if exists "events_update_own" on events;
drop policy if exists "events_delete_own" on events;
drop policy if exists "families_select_own" on families;
drop policy if exists "families_insert_own" on families;
drop policy if exists "families_update_own" on families;
drop policy if exists "families_delete_own" on families;
drop policy if exists "templates_select_all" on templates;

revoke all on table public.events from anon, authenticated;
revoke all on table public.families from anon, authenticated;
revoke all on table public.templates from anon, authenticated;
