'use client';

import { useMemo, useState } from 'react';
import { useEstadoStaff } from '@/lib/staff-estado';
import { formatearHora } from '@/lib/format';
import { EstadoHoja } from '@/components/ui/EstadoHoja';

export function VistaHistorial({ eventId }: { eventId: string }) {
  const { estado, error, refrescar } = useEstadoStaff(eventId);
  const [busqueda, setBusqueda] = useState('');
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const coincidencias = useMemo(() => {
    if (!estado || busqueda.trim() === '') return [];
    const termino = busqueda.trim().toLowerCase();

    return [...estado.pendientes, ...estado.ingresados].filter((familia) =>
      familia.nombre_familia.toLowerCase().includes(termino),
    );
  }, [estado, busqueda]);

  async function marcarEntrada(familyId: string) {
    setTrabajando(familyId);
    const respuesta = await fetch('/api/checkin/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, familyId }),
    });
    const datos = await respuesta.json();
    setAviso(datos.mensaje ?? datos.error ?? null);
    setTrabajando(null);
    await refrescar();
  }

  async function revertir(familyId: string) {
    setTrabajando(familyId);
    await fetch('/api/checkin/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, familyId }),
    });
    setAviso(
      'Entrada revertida. Ese código QR ya no sirve: la familia debe abrir su invitación otra vez.',
    );
    setTrabajando(null);
    await refrescar();
  }

  if (error) {
    return (
      <EstadoHoja tono="tinta" etiqueta="Historial" titulo="Se cortó la sesión" detalle={error} />
    );
  }
  if (!estado) {
    return (
      <EstadoHoja
        tono="tinta"
        etiqueta="Historial"
        titulo="Buscando familias"
        detalle="Un momento, estamos pidiendo la lista confirmada."
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8">
      <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro-claro">
        Búsqueda y correcciones
      </p>
      <h1 className="mt-3 font-display text-2xl text-papel">Buscar por nombre</h1>

      <label htmlFor="busqueda" className="sr-only">
        Nombre de la familia
      </label>
      <input
        id="busqueda"
        value={busqueda}
        onChange={(campo) => setBusqueda(campo.target.value)}
        placeholder="Escribe el apellido"
        className="mt-4 min-h-12 w-full rounded-[2px] border border-papel/25 bg-transparent px-4 text-papel outline-none transition-colors duration-200 focus:border-oro-claro"
      />

      {aviso && (
        <p role="status" className="mt-4 text-sm text-oro-claro">
          {aviso}
        </p>
      )}

      {busqueda.trim() !== '' && coincidencias.length === 0 && (
        <EstadoHoja
          tono="tinta"
          compacto
          titulo="Nadie coincide"
          detalle="Ninguna familia confirmada tiene ese apellido. Revisa la ortografía."
        />
      )}

      <ul className="mt-4 divide-y divide-papel/10">
        {coincidencias.map((familia) => (
          <li key={familia.id} className="flex items-center justify-between gap-4 py-4">
            <span>
              <span className="block text-papel">{familia.nombre_familia}</span>
              <span className="mt-1 block font-ticket text-xs text-papel/50">
                {familia.boletos_total} {familia.boletos_total === 1 ? 'boleto' : 'boletos'}
                {familia.checked_in_at && ` · entró ${formatearHora(familia.checked_in_at)}`}
              </span>
            </span>

            {familia.checked_in ? (
              <button
                type="button"
                disabled={trabajando === familia.id}
                onClick={() => revertir(familia.id)}
                className="min-h-11 cursor-pointer px-3 text-sm text-oro-claro underline underline-offset-4 disabled:opacity-50"
              >
                Deshacer entrada
              </button>
            ) : (
              <button
                type="button"
                disabled={trabajando === familia.id}
                onClick={() => marcarEntrada(familia.id)}
                className="min-h-11 cursor-pointer rounded-[2px] bg-oro-claro px-4 text-sm font-medium text-tinta transition-colors duration-200 hover:bg-oro disabled:opacity-50"
              >
                Marcar entrada
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mt-12 font-display text-xl text-papel">Últimas entradas</h2>

      {estado.ingresados.length === 0 ? (
        <EstadoHoja
          tono="tinta"
          compacto
          titulo="Sin entradas todavía"
          detalle="Cuando escaneen el primer boleto, aparece en esta lista."
        />
      ) : (
        <ul className="mt-3 divide-y divide-papel/10">
          {estado.ingresados.slice(0, 15).map((familia) => (
            <li key={familia.id} className="flex items-center justify-between gap-4 py-4">
              <span>
                <span className="block text-papel">{familia.nombre_familia}</span>
                <span className="mt-1 block font-ticket text-xs text-papel/50">
                  {formatearHora(familia.checked_in_at)}
                  {familia.checked_in_by && ` · ${familia.checked_in_by}`}
                </span>
              </span>
              <button
                type="button"
                disabled={trabajando === familia.id}
                onClick={() => revertir(familia.id)}
                className="min-h-11 cursor-pointer px-3 text-sm text-oro-claro underline underline-offset-4 disabled:opacity-50"
              >
                Deshacer
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
