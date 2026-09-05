import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { FormularioAcceso } from '@/components/admin/FormularioAcceso';
import { ListaEventos } from '@/components/admin/ListaEventos';
import { AvisoErrorAuth } from '@/components/auth/AvisoErrorAuth';
import { EstadoHoja } from '@/components/ui/EstadoHoja';
import type { EventRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return (
      <main className="textura-papel flex min-h-screen items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
            Panel del organizador
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-tinta">
            Entra para preparar la invitación
          </h1>
          <div className="mt-8">
            <AvisoErrorAuth />
            <FormularioAcceso />
          </div>
        </div>
      </main>
    );
  }

  const { data: eventos } = await db
    .from('events')
    .select('id, quinceanera_nombre, estado, capacidad_total')
    .order('created_at', { ascending: false })
    .returns<Pick<EventRow, 'id' | 'quinceanera_nombre' | 'estado' | 'capacidad_total'>[]>();

  const hayEventos = Boolean(eventos && eventos.length > 0);

  return (
    <main className="textura-papel min-h-screen px-5 py-14">
      <div className="mx-auto w-full max-w-3xl">
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
          Panel del organizador
        </p>
        <h1 className="mt-3 font-display text-3xl text-tinta">Tus eventos</h1>

        <Link
          href="/admin/evento/nuevo"
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[2px] border border-vino-hondo bg-vino px-5 text-sm font-medium text-papel-alto transition-colors duration-200 hover:bg-vino-hondo"
        >
          {hayEventos ? 'Crear otro evento' : 'Crear el evento'}
        </Link>

        {!hayEventos ? (
          <div className="talon mt-10 px-6 py-2">
            <EstadoHoja
              compacto
              titulo="Todavía no hay ningún evento"
              detalle="Crea el evento para elegir la plantilla, capturar los datos y armar la lista de familias."
            />
          </div>
        ) : (
          <ListaEventos
            eventosIniciales={eventos!.map((evento) => ({
              id: evento.id,
              quinceanera_nombre: evento.quinceanera_nombre,
              estado: evento.estado,
            }))}
          />
        )}
      </div>
    </main>
  );
}
