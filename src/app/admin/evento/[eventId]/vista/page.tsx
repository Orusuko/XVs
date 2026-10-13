import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { layoutDe } from '@/lib/templates/catalogo';
import { invitacionMuestra } from '@/lib/templates/muestra';
import { POR_LAYOUT } from '@/lib/templates/por-layout';
import type { EventRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function VistaPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) redirect('/admin');

  const { data: evento } = await db
    .from('events')
    .select(
      'quinceanera_nombre, padre, madre, padrinos, mensaje, misa, recepcion, template_config',
    )
    .eq('id', eventId)
    .maybeSingle<
      Pick<
        EventRow,
        | 'quinceanera_nombre'
        | 'padre'
        | 'madre'
        | 'padrinos'
        | 'mensaje'
        | 'misa'
        | 'recepcion'
        | 'template_config'
      >
    >();

  if (!evento) notFound();

  const invitacion = invitacionMuestra(evento);
  const Plantilla = POR_LAYOUT[layoutDe(invitacion.evento.templateId)];

  return (
    <>
      <p className="bg-papel-alto px-5 py-3 text-center font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
        Así la ven las familias · muestra con Los Ramírez
      </p>
      <Plantilla token="muestra" invitacion={invitacion} sinConfirmacion />
    </>
  );
}
