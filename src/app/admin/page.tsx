import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { FormularioAcceso } from '@/components/admin/FormularioAcceso';
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

  return (
    <main className="textura-papel min-h-screen px-5 py-14">
      <div className="mx-auto w-full max-w-3xl">
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
          Panel del organizador
        </p>
        <h1 className="mt-3 font-display text-3xl text-tinta">Tus eventos</h1>

        {!eventos || eventos.length === 0 ? (
          <div className="talon mt-10 px-6 py-2">
            <EstadoHoja
              compacto
              titulo="Todavía no hay ningún evento"
              detalle="Crea el evento para elegir la plantilla, capturar los datos y armar la lista de familias."
              accion={
                <Link
                  href="/admin/evento/nuevo"
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[2px] border border-vino-hondo bg-vino px-5 text-sm font-medium text-papel-alto transition-colors duration-200 hover:bg-vino-hondo"
                >
                  Crear el evento
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {eventos.map((evento) => (
              <li key={evento.id}>
                <Link
                  href={`/admin/evento/${evento.id}/invitados`}
                  className="talon flex cursor-pointer items-center justify-between px-6 py-5 transition-colors duration-200 hover:border-vino"
                >
                  <span>
                    <span className="font-display text-xl text-tinta">
                      {evento.quinceanera_nombre}
                    </span>
                    <span className="mt-1 block font-ticket text-[11px] uppercase tracking-[0.2em] text-tinta-suave">
                      {evento.estado}
                    </span>
                  </span>
                  <span className="text-vino">Abrir</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
