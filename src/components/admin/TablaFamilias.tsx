'use client';

import { useEffect, useMemo, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { supabaseBrowser } from '@/lib/supabase/client';
import { summarizeTickets } from '@/lib/tickets';
import type { FamilyRow } from '@/lib/types';

type Familia = Pick<
  FamilyRow,
  'id' | 'nombre_familia' | 'boletos_total' | 'token' | 'estado_confirmacion' | 'checked_in'
>;

type Borrador = { nombre_familia: string; boletos_total: string };

type Props = {
  eventId: string;
  familiasIniciales: Familia[];
  siteUrl: string;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  rechazado: 'No asistirá',
};

export function TablaFamilias({ eventId, familiasIniciales, siteUrl }: Props) {
  const [familias, setFamilias] = useState<Familia[]>(familiasIniciales);
  const [borradores, setBorradores] = useState<Borrador[]>([
    { nombre_familia: '', boletos_total: '' },
  ]);
  const [capturando, setCapturando] = useState(familiasIniciales.length === 0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The organizer watches RSVPs land without refreshing. RLS scopes the stream
  // to this organizer's own rows.
  useEffect(() => {
    const cliente = supabaseBrowser();
    const canal = cliente
      .channel(`familias-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'families', filter: `event_id=eq.${eventId}` },
        (payload) => {
          const actualizada = payload.new as Familia;
          setFamilias((previas) =>
            previas.map((familia) =>
              familia.id === actualizada.id ? { ...familia, ...actualizada } : familia,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      cliente.removeChannel(canal);
    };
  }, [eventId]);

  const resumen = useMemo(
    () =>
      summarizeTickets(
        familias.map((familia) => ({
          boletos_total: familia.boletos_total,
          estado_confirmacion: familia.estado_confirmacion,
          checked_in: familia.checked_in,
        })),
      ),
    [familias],
  );

  const boletosEnBorrador = borradores.reduce(
    (suma, fila) => suma + (Number(fila.boletos_total) || 0),
    0,
  );

  async function guardarBorradores() {
    const listas = borradores
      .filter((fila) => fila.nombre_familia.trim() !== '' && Number(fila.boletos_total) > 0)
      .map((fila) => ({
        nombre_familia: fila.nombre_familia.trim(),
        boletos_total: Number(fila.boletos_total),
      }));

    if (listas.length === 0) {
      setError('Agrega al menos una familia con nombre y boletos.');
      return;
    }

    setGuardando(true);
    setError(null);

    const respuesta = await fetch('/api/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, familias: listas }),
    });

    const datos = await respuesta.json();
    setGuardando(false);

    if (!respuesta.ok) {
      setError(datos.error ?? 'No pudimos guardar la lista.');
      return;
    }

    setFamilias([
      ...familias,
      ...datos.familias.map((familia: { id: string; token: string; nombre_familia: string }) => ({
        ...familia,
        boletos_total:
          listas.find((lista) => lista.nombre_familia === familia.nombre_familia)?.boletos_total ??
          0,
        estado_confirmacion: 'pendiente' as const,
        checked_in: false,
      })),
    ]);
    setBorradores([{ nombre_familia: '', boletos_total: '' }]);
    setCapturando(false);
  }

  if (capturando) {
    return (
      <section>
        <div className="talon px-5 pb-6 pt-8">
          <div className="space-y-3">
            {borradores.map((fila, indice) => (
              <div key={indice} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                <div>
                  <label htmlFor={`familia-${indice}`} className="sr-only">
                    Nombre de la familia
                  </label>
                  <input
                    id={`familia-${indice}`}
                    value={fila.nombre_familia}
                    placeholder="Familia"
                    onChange={(campo) =>
                      actualizarBorrador(indice, { ...fila, nombre_familia: campo.target.value })
                    }
                    className="min-h-11 w-full rounded-[2px] border border-borde bg-papel px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino"
                  />
                </div>

                <div>
                  <label htmlFor={`boletos-${indice}`} className="sr-only">
                    Boletos
                  </label>
                  <input
                    id={`boletos-${indice}`}
                    type="number"
                    min={1}
                    value={fila.boletos_total}
                    placeholder="Boletos"
                    onChange={(campo) =>
                      actualizarBorrador(indice, { ...fila, boletos_total: campo.target.value })
                    }
                    className="min-h-11 w-full rounded-[2px] border border-borde bg-papel px-4 font-ticket text-tinta outline-none transition-colors duration-200 focus:border-vino"
                  />
                </div>

                <Boton
                  type="button"
                  variante="texto"
                  onClick={() => setBorradores(borradores.filter((_, i) => i !== indice))}
                  disabled={borradores.length === 1}
                >
                  Quitar
                </Boton>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-borde pt-5">
            <p className="font-ticket text-sm text-tinta-suave">
              Boletos en esta lista:{' '}
              <span className="text-lg font-bold text-vino">{boletosEnBorrador}</span>
            </p>

            <Boton
              type="button"
              variante="contorno"
              onClick={() =>
                setBorradores([...borradores, { nombre_familia: '', boletos_total: '' }])
              }
            >
              Agregar familia
            </Boton>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-alerta">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Boton onClick={guardarBorradores} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar lista'}
          </Boton>
          {familias.length > 0 && (
            <Boton variante="contorno" onClick={() => setCapturando(false)}>
              Volver al monitoreo
            </Boton>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato etiqueta="Boletos" valor={resumen.total} />
        <Dato etiqueta="Confirmados" valor={resumen.confirmados} acento />
        <Dato etiqueta="Pendientes" valor={resumen.pendientes} />
        <Dato etiqueta="No asistirán" valor={resumen.rechazados} />
      </dl>

      <div className="talon mt-6 overflow-x-auto px-5 pb-6 pt-8">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="font-ticket text-[10px] uppercase tracking-[0.2em] text-tinta-suave">
              <th className="pb-3 font-normal">Familia</th>
              <th className="pb-3 font-normal">Boletos</th>
              <th className="pb-3 font-normal">Asistencia</th>
              <th className="pb-3 font-normal">Invitación</th>
            </tr>
          </thead>
          <tbody>
            {familias.map((familia) => {
              const enlace = `${siteUrl}/invitacion/${familia.token}`;

              return (
                <tr key={familia.id} className="border-t border-borde">
                  <td className="py-3 text-tinta">{familia.nombre_familia}</td>
                  <td className="py-3 font-ticket text-tinta">{familia.boletos_total}</td>
                  <td className="py-3">
                    <EstadoAsistencia estado={familia.estado_confirmacion} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(enlace)}
                        className="min-h-11 cursor-pointer text-vino underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
                      >
                        Copiar enlace
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Hola Familia ${familia.nombre_familia}, aquí está su invitación: ${enlace}`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-11 cursor-pointer text-tinta-suave underline underline-offset-4 transition-colors duration-200 hover:text-vino"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Boton variante="contorno" onClick={() => setCapturando(true)}>
          Agregar más familias
        </Boton>
      </div>
    </section>
  );

  function actualizarBorrador(indice: number, fila: Borrador) {
    setBorradores(borradores.map((actual, i) => (i === indice ? fila : actual)));
  }
}

function Dato({
  etiqueta,
  valor,
  acento = false,
}: {
  etiqueta: string;
  valor: number;
  acento?: boolean;
}) {
  return (
    <div className="border border-borde bg-papel-alto px-4 py-4">
      <dt className="font-ticket text-[10px] uppercase tracking-[0.2em] text-tinta-suave">
        {etiqueta}
      </dt>
      <dd className={`mt-1 font-ticket text-2xl ${acento ? 'text-vino' : 'text-tinta'}`}>{valor}</dd>
    </div>
  );
}

function EstadoAsistencia({ estado }: { estado: string }) {
  const color =
    estado === 'confirmado'
      ? 'text-exito'
      : estado === 'rechazado'
        ? 'text-alerta'
        : 'text-tinta-suave';

  return (
    <span className={`inline-flex items-center gap-2 ${color}`}>
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
      {ETIQUETA_ESTADO[estado] ?? estado}
    </span>
  );
}
