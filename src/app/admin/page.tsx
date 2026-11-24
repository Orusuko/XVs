import Link from 'next/link';
import { organizadorActual } from '@/lib/organizador';
import { FormularioAcceso } from '@/components/admin/FormularioAcceso';
import { ListaEventos } from '@/components/admin/ListaEventos';
import { EstadoHoja } from '@/components/ui/EstadoHoja';
import type { EventRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const actual = await organizadorActual();

  if (!actual) {
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
            <FormularioAcceso />
          </div>
        </div>
      </main>
    );
  }

  const { data: eventos } = await actual.db
    .from('events')
    .select('id, quinceanera_nombre, estado, capacidad_total')
    .eq('admin_id', actual.sesion.id)
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
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[2px] border border-vino-hondo bg-vino px-5 text-sm font-medium tracking-wide text-papel-alto transition-colors duration-200 hover:bg-vino-hondo"
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
