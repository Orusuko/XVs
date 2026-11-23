import { notFound, redirect } from 'next/navigation';
import { organizadorActual } from '@/lib/organizador';
import { FormularioEvento } from '@/components/admin/FormularioEvento';
import type { EventRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DatosEventoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const actual = await organizadorActual();
  if (!actual) redirect('/admin');

  const { data: evento } = await actual.db
    .from('events')
    .select(
      'id, quinceanera_nombre, padre, madre, padrinos, mensaje, misa, recepcion, capacidad_total, template_config',
    )
    .eq('id', eventId)
    .eq('admin_id', actual.sesion.id)
    .maybeSingle<
      Pick<
        EventRow,
        | 'id'
        | 'quinceanera_nombre'
        | 'padre'
        | 'madre'
        | 'padrinos'
        | 'mensaje'
        | 'misa'
        | 'recepcion'
        | 'capacidad_total'
        | 'template_config'
      >
    >();

  if (!evento) notFound();

  return (
    <main className="textura-papel min-h-screen px-5 py-14">
      <div className="mx-auto w-full max-w-2xl">
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
          Editar evento
        </p>
        <h1 className="mt-3 font-display text-3xl text-tinta">{evento.quinceanera_nombre}</h1>

        <div className="mt-10">
          <FormularioEvento evento={evento} />
        </div>
      </div>
    </main>
  );
}
