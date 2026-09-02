-- XV Años — invitations and access control, single event.
-- Public traffic (invitation, RSVP, check-in) never reaches these tables
-- directly: it goes through Next.js Route Handlers using the service_role key.
-- RLS below is the second line of defence for the admin's own browser session.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  preview_url text,
  config_schema jsonb not null default '{}'::jsonb
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  quinceanera_nombre text not null,
  padre text,
  madre text,
  padrinos jsonb default '[]'::jsonb,
  mensaje text,
  template_id uuid references templates(id),
  template_config jsonb default '{}'::jsonb,
  misa jsonb,
  recepcion jsonb,
  capacidad_total int,
  staff_pin_hash text,
  estado text default 'borrador' check (estado in ('borrador', 'publicado', 'cancelado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  nombre_familia text not null,
  boletos_total int not null check (boletos_total > 0),
  token text unique not null,
  estado_confirmacion text default 'pendiente'
    check (estado_confirmacion in ('pendiente', 'confirmado', 'rechazado')),
  confirmado_at timestamptz,
  qr_jti text,
  checked_in boolean default false not null,
  checked_in_at timestamptz,
  checked_in_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists checkin_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  scanned_by text,
  scanned_at timestamptz default now(),
  resultado text not null
    check (resultado in ('exitoso', 'duplicado', 'invalido', 'jti_expirado', 'revertido'))
);

create table if not exists staff_users (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  nombre text not null,
  pin_hash text not null
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists families_token_idx on families (token);
create index if not exists families_event_idx on families (event_id);
create index if not exists families_event_estado_idx on families (event_id, estado_confirmacion);
create index if not exists checkin_logs_event_idx on checkin_logs (event_id, scanned_at desc);
create index if not exists events_admin_idx on events (admin_id);
create index if not exists staff_users_event_idx on staff_users (event_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_touch_updated_at on events;
create trigger events_touch_updated_at
  before update on events
  for each row execute function public.touch_updated_at();

drop trigger if exists families_touch_updated_at on families;
create trigger families_touch_updated_at
  before update on families
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table events enable row level security;
alter table families enable row level security;
alter table templates enable row level security;
alter table checkin_logs enable row level security;
alter table staff_users enable row level security;

-- events: an organizer only ever sees their own event.
drop policy if exists "events_select_own" on events;
create policy "events_select_own" on events
  for select to authenticated
  using ( (select auth.uid()) = admin_id );

drop policy if exists "events_insert_own" on events;
create policy "events_insert_own" on events
  for insert to authenticated
  with check ( (select auth.uid()) = admin_id );

-- Both USING and WITH CHECK, otherwise a row could be handed to another user.
drop policy if exists "events_update_own" on events;
create policy "events_update_own" on events
  for update to authenticated
  using ( (select auth.uid()) = admin_id )
  with check ( (select auth.uid()) = admin_id );

drop policy if exists "events_delete_own" on events;
create policy "events_delete_own" on events
  for delete to authenticated
  using ( (select auth.uid()) = admin_id );

-- families: reachable only through an event the caller owns.
drop policy if exists "families_select_own" on families;
create policy "families_select_own" on families
  for select to authenticated
  using (
    exists (
      select 1 from events e
      where e.id = families.event_id and e.admin_id = (select auth.uid())
    )
  );

drop policy if exists "families_insert_own" on families;
create policy "families_insert_own" on families
  for insert to authenticated
  with check (
    exists (
      select 1 from events e
      where e.id = families.event_id and e.admin_id = (select auth.uid())
    )
  );

drop policy if exists "families_update_own" on families;
create policy "families_update_own" on families
  for update to authenticated
  using (
    exists (
      select 1 from events e
      where e.id = families.event_id and e.admin_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from events e
      where e.id = families.event_id and e.admin_id = (select auth.uid())
    )
  );

drop policy if exists "families_delete_own" on families;
create policy "families_delete_own" on families
  for delete to authenticated
  using (
    exists (
      select 1 from events e
      where e.id = families.event_id and e.admin_id = (select auth.uid())
    )
  );

-- templates: a read-only gallery.
drop policy if exists "templates_select_all" on templates;
create policy "templates_select_all" on templates
  for select to authenticated
  using ( true );

-- checkin_logs and staff_users carry no policies on purpose: only the
-- service_role, which bypasses RLS, touches them.

-- ---------------------------------------------------------------------------
-- Data API grants
-- ---------------------------------------------------------------------------
-- Since 2026-04-28 new tables are not exposed to the Data API automatically,
-- so RLS alone would leave the admin dashboard unable to read anything.

grant select, insert, update, delete on events to authenticated;
grant select, insert, update, delete on families to authenticated;
grant select on templates to authenticated;

revoke all on checkin_logs from anon, authenticated;
revoke all on staff_users from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
-- The admin dashboard subscribes to families to watch RSVPs land live.
-- Realtime honours the policies above, so an organizer only receives their own
-- rows. Staff devices are not signed in with Supabase Auth, so the check-in
-- screens poll a server route instead of subscribing here.

alter table families replica identity full;

do $$
begin
  alter publication supabase_realtime add table families;
exception
  when duplicate_object then null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Seed templates
-- ---------------------------------------------------------------------------

insert into templates (nombre, config_schema)
select 'Clásica', '{"fields":["color_principal","color_secundario","fuente","foto_url"]}'::jsonb
where not exists (select 1 from templates where nombre = 'Clásica');
