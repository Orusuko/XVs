'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Boton } from '@/components/ui/Boton';

/** Door PINs for the night of the event, plus the link the staff will open. */
export function PanelStaff({ eventId }: { eventId: string }) {
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [creando, setCreando] = useState(false);
  const [creados, setCreados] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function crear(evento: React.FormEvent) {
    evento.preventDefault();
    setCreando(true);
    setError(null);

    const respuesta = await fetch('/api/staff/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, nombre, pin }),
    });

    const datos = await respuesta.json();
    setCreando(false);

    if (!respuesta.ok) {
      setError(datos.error ?? 'No pudimos crear el acceso.');
      return;
    }

    setCreados([...creados, nombre]);
    setNombre('');
    setPin('');
  }

  return (
    <section>
      <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
        Personal de la entrada
      </p>
      <h2 className="mt-3 font-display text-2xl text-tinta">Accesos para el día del evento</h2>
      <p className="mt-2 max-w-lg text-sm text-tinta-suave">
        Cada persona que reciba invitados en la puerta entra con su propio PIN. Anótalo: no se
        vuelve a mostrar.
      </p>

      <form onSubmit={crear} className="mt-6 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
        <div>
          <label htmlFor="staff-nombre" className="sr-only">
            Nombre
          </label>
          <input
            id="staff-nombre"
            required
            value={nombre}
            placeholder="Nombre"
            onChange={(campo) => setNombre(campo.target.value)}
            className="min-h-11 w-full rounded-[2px] border border-borde bg-papel-alto px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino"
          />
        </div>

        <div>
          <label htmlFor="staff-pin" className="sr-only">
            PIN
          </label>
          <input
            id="staff-pin"
            required
            inputMode="numeric"
            pattern="\d{4,8}"
            value={pin}
            placeholder="PIN"
            onChange={(campo) => setPin(campo.target.value)}
            className="min-h-11 w-full rounded-[2px] border border-borde bg-papel-alto px-4 font-ticket text-tinta outline-none transition-colors duration-200 focus:border-vino"
          />
        </div>

        <Boton type="submit" disabled={creando}>
          {creando ? 'Creando…' : 'Crear acceso'}
        </Boton>
      </form>

      {error && <p className="mt-3 text-sm text-alerta">{error}</p>}

      {creados.length > 0 && (
        <p className="mt-4 text-sm text-exito">
          Accesos creados: {creados.join(', ')}.
        </p>
      )}

      <p className="mt-6 text-sm text-tinta-suave">
        Enlace para la entrada:{' '}
        <Link
          href={`/staff/${eventId}/login`}
          className="cursor-pointer text-vino underline underline-offset-4"
        >
          /staff/{eventId}/login
        </Link>
      </p>
    </section>
  );
}
