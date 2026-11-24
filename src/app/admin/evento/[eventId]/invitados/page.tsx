import { notFound, redirect } from 'next/navigation';
import { organizadorActual } from '@/lib/organizador';
import { TablaFamilias } from '@/components/admin/TablaFamilias';
import { PanelStaff } from '@/components/admin/PanelStaff';
import { siteUrl } from '@/lib/format';
import type { EventRow, FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function InvitadosPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const actual = await organizadorActual();
  if (!actual) redirect('/admin');

  const { data: evento } = await actual.db
    .from('events')
    .select('id, quinceanera_nombre, capacidad_total, estado')
    .eq('id', eventId)
    .eq('admin_id', actual.sesion.id)
    .maybeSingle<
      Pick<EventRow, 'id' | 'quinceanera_nombre' | 'capacidad_total' | 'estado'>
    >();

  if (!evento) notFound();

  const { data: familias, error: errFamilias } = await actual.db
    .from('families')
    .select('id, nombre_familia, boletos_total, boletos_usados, token, estado_confirmacion, checked_in')
    .eq('event_id', eventId)
    .order('nombre_familia')
    .returns<
      Pick<
        FamilyRow,
        | 'id'
        | 'nombre_familia'
        | 'boletos_total'
        | 'boletos_usados'
        | 'token'
        | 'estado_confirmacion'
        | 'checked_in'
      >[]
    >();

  const errorLista =
    errFamilias &&
    (errFamilias.code === '42703'
      ? 'La base de datos necesita la migración de boletos parciales (0004_boletos_usados.sql). Hasta entonces la lista no puede cargarse.'
      : 'No pudimos cargar la lista de familias. Inténtalo de nuevo.');

  return (
    <main className="textura-papel min-h-screen px-5 py-14">
      <div className="mx-auto w-full max-w-4xl">
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
          Lista de invitados
        </p>
        <h1 className="mt-3 break-words font-display text-3xl text-tinta">
          {evento.quinceanera_nombre}
        </h1>

        {errorLista && (
          <p className="mt-6 text-sm text-alerta" role="alert">
            {errorLista}
          </p>
        )}

        <div className="mt-10">
          <TablaFamilias
            eventId={eventId}
            familiasIniciales={familias ?? []}
            siteUrl={siteUrl()}
            estadoInicial={evento.estado}
            capacidadTotal={evento.capacidad_total}
            errorServidor={errorLista ?? null}
          />
        </div>

        <div className="mt-14 border-t border-borde pt-8">
          <PanelStaff eventId={eventId} siteUrl={siteUrl()} />
        </div>
      </div>
    </main>
  );
}
