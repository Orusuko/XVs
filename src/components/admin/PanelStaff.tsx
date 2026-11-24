'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Boton } from '@/components/ui/Boton';
import { validarNombreStaff, validarPinStaff } from '@/lib/validacion-formularios';

type Acceso = { id: string; nombre: string };

/** Door PINs for the night of the event, plus the link the staff will open. */
export function PanelStaff({ eventId, siteUrl }: { eventId: string; siteUrl: string }) {
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [creando, setCreando] = useState(false);
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const [revocando, setRevocando] = useState<string | null>(null);

  const urlEntrada = `${siteUrl}/staff/${eventId}/login`;

  const cargarAccesos = useCallback(async () => {
    const respuesta = await fetch(`/api/staff/pin?eventId=${encodeURIComponent(eventId)}`);
    if (!respuesta.ok) return;
    const datos = (await respuesta.json()) as { accesos?: Acceso[] };
    setAccesos(datos.accesos ?? []);
  }, [eventId]);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/staff/pin?eventId=${encodeURIComponent(eventId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((datos: { accesos?: Acceso[] } | null) => {
        if (vivo && datos) setAccesos(datos.accesos ?? []);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [eventId]);

  async function crear(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    const falloNombre = validarNombreStaff(nombre);
    if (falloNombre) {
      setError(falloNombre);
      return;
    }

    const falloPin = validarPinStaff(pin);
    if (falloPin) {
      setError(falloPin);
      return;
    }

    setCreando(true);

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

    setNombre('');
    setPin('');
    await cargarAccesos();
  }

  async function revocar(acceso: Acceso) {
    if (!window.confirm(`¿Revocar el acceso de ${acceso.nombre}? Ya no podrá entrar con su PIN.`)) {
      return;
    }

    setRevocando(acceso.id);
    const respuesta = await fetch(
      `/api/staff/pin?id=${encodeURIComponent(acceso.id)}&eventId=${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
    );
    setRevocando(null);

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => null);
      setError(datos?.error ?? 'No pudimos revocar ese acceso.');
      return;
    }

    setAccesos((prev) => prev.filter((item) => item.id !== acceso.id));
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

      <form onSubmit={crear} noValidate className="mt-6 grid gap-3 sm:grid-cols-[1fr_minmax(9rem,140px)_auto]">
        <div>
          <label htmlFor="staff-nombre" className="sr-only">
            Nombre
          </label>
          <input
            id="staff-nombre"
            value={nombre}
            placeholder="Nombre"
            onChange={(campo) => setNombre(campo.target.value)}
            className="min-h-11 w-full rounded-[2px] border border-borde bg-papel-alto px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino"
          />
        </div>

        <div>
          <label htmlFor="staff-pin" className="block font-ticket text-[10px] uppercase tracking-[0.2em] text-tinta-suave sm:sr-only">
            PIN (6–8 dígitos)
          </label>
          <input
            id="staff-pin"
            inputMode="numeric"
            pattern="\d{6,8}"
            minLength={6}
            maxLength={8}
            value={pin}
            placeholder="6–8 dígitos"
            onChange={(campo) => setPin(campo.target.value)}
            className="min-h-11 w-full min-w-0 rounded-[2px] border border-borde bg-papel-alto px-3 font-ticket text-tinta outline-none transition-colors duration-200 focus:border-vino"
          />
        </div>

        <Boton type="submit" disabled={creando}>
          {creando ? 'Creando…' : 'Crear acceso'}
        </Boton>
      </form>

      {error && <p className="mt-3 text-sm text-alerta">{error}</p>}

      {accesos.length > 0 && (
        <ul className="mt-6 divide-y divide-borde border border-borde">
          {accesos.map((acceso) => (
            <li key={acceso.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-tinta">{acceso.nombre}</span>
              <button
                type="button"
                disabled={revocando === acceso.id}
                onClick={() => void revocar(acceso)}
                className="min-h-11 cursor-pointer text-sm text-alerta underline underline-offset-4 disabled:opacity-50"
              >
                Revocar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 space-y-3">
        <p className="text-sm text-tinta-suave">
          Enlace para la entrada:{' '}
          <Link
            href={`/staff/${eventId}/login`}
            className="cursor-pointer break-all text-vino underline underline-offset-4"
          >
            {urlEntrada}
          </Link>
        </p>
        <Boton
          type="button"
          variante="contorno"
          className="min-h-11"
          onClick={async () => {
            await navigator.clipboard.writeText(urlEntrada);
            setEnlaceCopiado(true);
            window.setTimeout(() => setEnlaceCopiado(false), 2500);
          }}
        >
          Copiar enlace de la entrada
        </Boton>
        {enlaceCopiado && <p className="text-sm text-exito">Enlace copiado.</p>}
      </div>
    </section>
  );
}