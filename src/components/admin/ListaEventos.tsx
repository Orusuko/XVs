'use client';

import { useState } from 'react';
import Link from 'next/link';

type EventoLista = {
  id: string;
  quinceanera_nombre: string;
  estado: string;
};

type Props = {
  eventosIniciales: EventoLista[];
};

export function ListaEventos({ eventosIniciales }: Props) {
  const [eventos, setEventos] = useState(eventosIniciales);
  const [error, setError] = useState<string | null>(null);

  async function eliminarEvento(evento: EventoLista) {
    const confirma = window.confirm(
      `¿Eliminar el evento de ${evento.quinceanera_nombre}? Se borrarán las familias, los PIN del staff y el historial de entrada. Esto no se puede deshacer.`,
    );
    if (!confirma) return;

    setError(null);
    const respuesta = await fetch(`/api/events?id=${evento.id}`, { method: 'DELETE' });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => null);
      setError(datos?.error ?? 'No pudimos eliminar el evento.');
      return;
    }

    setEventos((previos) => previos.filter((actual) => actual.id !== evento.id));
  }

  if (eventos.length === 0) {
    return (
      <p className="mt-8 text-sm text-tinta-suave">
        Ya no hay eventos en esta lista. Crea uno nuevo cuando quieras.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-8 space-y-3">
        {eventos.map((evento) => (
          <li key={evento.id} className="talon flex items-center justify-between gap-4 px-6 py-5">
            <Link
              href={`/admin/evento/${evento.id}/invitados`}
              className="min-h-11 flex-1 cursor-pointer"
            >
              <span className="font-display text-xl text-tinta">{evento.quinceanera_nombre}</span>
              <span className="mt-1 block font-ticket text-[11px] uppercase tracking-[0.2em] text-tinta-suave">
                {evento.estado}
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-4">
              <Link
                href={`/admin/evento/${evento.id}/invitados`}
                className="inline-flex min-h-11 cursor-pointer items-center text-vino underline underline-offset-4"
              >
                Abrir
              </Link>
              <button
                type="button"
                onClick={() => eliminarEvento(evento)}
                className="inline-flex min-h-11 cursor-pointer items-center text-alerta underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="mt-3 text-sm text-alerta">{error}</p>}
    </>
  );
}
