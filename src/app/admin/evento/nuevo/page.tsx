import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { FormularioEvento } from '@/components/admin/FormularioEvento';

export const dynamic = 'force-dynamic';

export default async function NuevoEventoPage() {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) redirect('/admin');

  return (
    <main className="textura-papel min-h-screen px-5 py-14">
      <div className="mx-auto w-full max-w-2xl">
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">Evento nuevo</p>
        <h1 className="mt-3 font-display text-3xl text-tinta">Datos del evento</h1>
        <p className="mt-2 text-tinta-suave">
          Esto es lo que verán las familias en su invitación.
        </p>

        <div className="mt-10">
          <FormularioEvento />
        </div>
      </div>
    </main>
  );
}
