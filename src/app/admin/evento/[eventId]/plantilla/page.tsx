import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { SelectorPlantilla } from '@/components/admin/SelectorPlantilla';
import { CLAVE_TEMPLATE_CONFIG, TEMPLATE_POR_DEFECTO, esTemplateId } from '@/lib/templates/catalogo';
import type { EventRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PlantillaPage({
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
    .select('id, quinceanera_nombre, template_config')
    .eq('id', eventId)
    .maybeSingle<Pick<EventRow, 'id' | 'quinceanera_nombre' | 'template_config'>>();

  if (!evento) notFound();

  const templateConfig = evento.template_config ?? {};
  const plantillaGuardada = templateConfig[CLAVE_TEMPLATE_CONFIG];
  const actual = esTemplateId(plantillaGuardada) ? plantillaGuardada : TEMPLATE_POR_DEFECTO;

  return (
    <main className="textura-papel min-h-screen px-5 py-14">
      <div className="mx-auto w-full max-w-6xl">
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">Plantilla</p>
        <h1 className="mt-3 font-display text-3xl text-tinta">Elige el diseño de la invitación</h1>
        <p className="mt-2 text-tinta-suave">
          Puedes cambiarla cuando quieras. La invitación pública usa la que quede elegida aquí.
        </p>

        <div className="mt-10">
          <SelectorPlantilla
            eventId={eventId}
            nombreQuinceanera={evento.quinceanera_nombre}
            templateConfig={templateConfig}
            actual={actual}
          />
        </div>
      </div>
    </main>
  );
}
