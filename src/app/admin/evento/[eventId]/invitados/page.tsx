import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
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
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) redirect('/admin');

  const { data: evento } = await db
    .from('events')
    .select('id, quinceanera_nombre, capacidad_total')
    .eq('id', eventId)
    .maybeSingle<Pick<EventRow, 'id' | 'quinceanera_nombre' | 'capacidad_total'>>();

  if (!evento) notFound();

  const { data: familias } = await db
    .from('families')
    .select('id, nombre_familia, boletos_total, token, estado_confirmacion, checked_in')
    .eq('event_id', eventId)
    .order('nombre_familia')
    .returns<
      Pick<
        FamilyRow,
        'id' | 'nombre_familia' | 'boletos_total' | 'token' | 'estado_confirmacion' | 'checked_in'
      >[]
    >();

  return (
    <main className="textura-papel min-h-screen px-5 py-14">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
              Lista de invitados
            </p>
            <h1 className="mt-3 font-display text-3xl text-tinta">{evento.quinceanera_nombre}</h1>
          </div>

          <Link
            href={`/admin/evento/${eventId}/datos`}
            className="min-h-11 cursor-pointer self-center text-vino underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
          >
            Editar datos del evento
          </Link>
        </div>

        <div className="mt-10">
          <TablaFamilias
            eventId={eventId}
            familiasIniciales={familias ?? []}
            siteUrl={siteUrl()}
          />
        </div>

        <div className="mt-14 border-t border-borde pt-8">
          <PanelStaff eventId={eventId} />
        </div>
      </div>
    </main>
  );
}
