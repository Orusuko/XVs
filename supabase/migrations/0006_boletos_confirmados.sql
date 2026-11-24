-- RSVP parcial: cuántos boletos confirmó la familia al responder Sí (NULL = sin columna lógica / legacy).

alter table public.families
  add column if not exists boletos_confirmados int;

update public.families
set boletos_confirmados = boletos_total
where estado_confirmacion = 'confirmado'
  and boletos_confirmados is null;

alter table public.families
  drop constraint if exists families_boletos_confirmados_check;

alter table public.families
  add constraint families_boletos_confirmados_check
  check (
    boletos_confirmados is null
    or (
      boletos_confirmados >= 0
      and boletos_confirmados <= boletos_total
    )
  );