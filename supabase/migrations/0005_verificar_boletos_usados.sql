-- Idempotente: aplicar en producción si aún no corrió 0004_boletos_usados.sql.
-- Los logs "column families.boletos_usados does not exist" desaparecen tras esto.

alter table public.families
  add column if not exists boletos_usados int not null default 0;

update public.families
set boletos_usados = boletos_total
where checked_in = true and boletos_usados = 0;

alter table public.families
  drop constraint if exists families_boletos_usados_check;

alter table public.families
  add constraint families_boletos_usados_check
  check (boletos_usados >= 0 and boletos_usados <= boletos_total);